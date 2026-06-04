import { sendSlottyEmailDetailed } from '../auth/email/resendMail.js';
import { isResendConfigured, resolveResendFrom } from '../email/emailConfig.js';
import { resolveAccountEmail } from '../profiles/profiles.service.js';
import { insertUserNotification, type NotificationType } from './notificationsInsert.js';
import { logNotificationDelivery } from './notificationDeliveriesInsert.js';
import { sendNotificationToProfile } from '../telegram/telegramProfileNotifications.js';
import type { SendTelegramMessageResult } from '../telegram/telegram.service.js';
import { logNotification, logNotificationWarn } from './notificationLog.js';

export type NotifyUserEmail = {
  subject: string;
  html: string;
  text?: string;
};

export type NotifyUserParams = {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  relatedEntityType?: string | null;
  relatedEntityId?: string | null;
  telegramHtml?: string;
  telegramReplyMarkup?: Record<string, unknown>;
  email?: NotifyUserEmail;
  bookingCode?: string | null;
};

function buildTelegramDedupeKey(params: {
  type: NotificationType;
  userId: string;
  relatedEntityId?: string | null;
}): string {
  const entity = params.relatedEntityId ?? '';
  return `telegram:${params.type}:${params.userId}:${entity}`;
}

function logTelegramIssue(context: string, res: SendTelegramMessageResult): void {
  if (res.status === 'error') {
    logNotificationWarn('notification.telegram.failed', { context, message: res.message });
  }
}

export type EmailDeliveryResult =
  | { status: 'sent'; providerMessageId: string | null }
  | { status: 'skipped'; reason: string };

/** Только email (Resend), независимо от Telegram. */
export async function deliverEmailNotification(params: {
  userId: string;
  type: NotificationType;
  email: NotifyUserEmail;
  template: string;
  bookingCode?: string | null;
}): Promise<EmailDeliveryResult> {
  const to = await resolveAccountEmail(params.userId);
  if (!to) {
    logNotificationWarn('notification.skipped', {
      channel: 'email',
      recipientUserId: params.userId,
      type: params.type,
      template: params.template,
      reason: 'NO_EMAIL',
      bookingCode: params.bookingCode,
    });
    return { status: 'skipped', reason: 'NO_EMAIL' };
  }

  if (!isResendConfigured()) {
    logNotificationWarn('notification.skipped', {
      channel: 'email',
      recipientUserId: params.userId,
      type: params.type,
      template: params.template,
      reason: 'RESEND_NOT_CONFIGURED',
      bookingCode: params.bookingCode,
    });
    return { status: 'skipped', reason: 'RESEND_NOT_CONFIGURED' };
  }

  const from = resolveResendFrom();
  logNotification('email.send.attempt', {
    to,
    from,
    template: params.template,
    bookingCode: params.bookingCode,
    subject: params.email.subject,
  });

  try {
    const result = await sendSlottyEmailDetailed({
      to,
      subject: params.email.subject,
      html: params.email.html,
      text: params.email.text,
    });
    if (result.devLogged) {
      return { status: 'skipped', reason: 'DEV_LOGGED' };
    }
    logNotification('email.send.success', {
      to,
      template: params.template,
      resendMessageId: result.messageId,
      bookingCode: params.bookingCode,
    });
    return { status: 'sent', providerMessageId: result.messageId };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    logNotificationWarn('email.send.failed', {
      to,
      template: params.template,
      bookingCode: params.bookingCode,
      error: message,
    });
    throw e;
  }
}

async function deliverTelegramOnly(
  params: NotifyUserParams,
  notificationId: string,
): Promise<void> {
  const html = params.telegramHtml?.trim();
  if (!html) return;

  const dedupeKey = buildTelegramDedupeKey(params);

  try {
    const res = await sendNotificationToProfile(params.userId, html, params.telegramReplyMarkup);
    logTelegramIssue(`${params.type} user=${params.userId}`, res);

    const status =
      res.status === 'ok' ? 'sent' : res.status === 'skipped' ? 'skipped' : 'failed';

    await logNotificationDelivery({
      notificationId,
      profileId: params.userId,
      channel: 'telegram',
      status,
      dedupeKey,
      errorMessage: res.status === 'error' ? res.message : undefined,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    logNotificationWarn('notification.telegram.failed', {
      userId: params.userId,
      type: params.type,
      error: message,
    });
    await logNotificationDelivery({
      notificationId,
      profileId: params.userId,
      channel: 'telegram',
      status: 'failed',
      dedupeKey,
      errorMessage: message,
    }).catch(() => undefined);
  }
}

/** In-app + опционально Telegram (каналы независимы от email). */
export async function deliverInAppAndTelegram(
  params: NotifyUserParams & { type: NotificationType },
): Promise<string> {
  const notificationId = await insertUserNotification({
    userId: params.userId,
    type: params.type,
    title: params.title,
    body: params.body,
    relatedEntityType: params.relatedEntityType,
    relatedEntityId: params.relatedEntityId,
  });

  if (params.telegramHtml?.trim()) {
    await deliverTelegramOnly(
      {
        userId: params.userId,
        type: params.type,
        title: params.title,
        body: params.body,
        telegramHtml: params.telegramHtml,
        telegramReplyMarkup: params.telegramReplyMarkup,
        relatedEntityId: params.relatedEntityId,
      },
      notificationId,
    );
  }

  return notificationId;
}

async function deliverEmailFromNotifyParams(params: NotifyUserParams): Promise<void> {
  const mail = params.email;
  if (!mail) return;
  await deliverEmailNotification({
    userId: params.userId,
    type: params.type,
    email: mail,
    template: params.type,
    bookingCode: params.bookingCode,
  }).catch(() => undefined);
}

/** In-app + Telegram + email параллельно; сбой одного канала не блокирует другой. */
export async function notifyUser(params: NotifyUserParams): Promise<void> {
  const notificationId = await insertUserNotification({
    userId: params.userId,
    type: params.type,
    title: params.title,
    body: params.body,
    relatedEntityType: params.relatedEntityType,
    relatedEntityId: params.relatedEntityId,
  });

  const results = await Promise.allSettled([
    params.telegramHtml?.trim()
      ? deliverTelegramOnly(params, notificationId)
      : Promise.resolve(),
    deliverEmailFromNotifyParams(params),
  ]);

  for (const r of results) {
    if (r.status === 'rejected') {
      logNotificationWarn('notification.channel.failed', {
        userId: params.userId,
        type: params.type,
        error: r.reason instanceof Error ? r.reason.message : String(r.reason),
      });
    }
  }
}
