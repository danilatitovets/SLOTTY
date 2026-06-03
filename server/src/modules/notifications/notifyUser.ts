import { sendSlottyEmail } from '../auth/email/resendMail.js';
import { isResendConfigured } from '../email/emailConfig.js';
import { resolveAccountEmail } from '../profiles/profiles.service.js';
import { insertUserNotification, type NotificationType } from './notificationsInsert.js';
import { logNotificationDelivery } from './notificationDeliveriesInsert.js';
import { sendNotificationToProfile } from '../telegram/telegramProfileNotifications.js';
import type { SendTelegramMessageResult } from '../telegram/telegram.service.js';

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
  /** HTML для Telegram; если не задан — Telegram не отправляется. */
  telegramHtml?: string;
  telegramReplyMarkup?: Record<string, unknown>;
  /** Письмо через Resend (Google / email-вход). */
  email?: NotifyUserEmail;
};

function buildTelegramDedupeKey(params: NotifyUserParams): string {
  const entity = params.relatedEntityId ?? '';
  return `telegram:${params.type}:${params.userId}:${entity}`;
}

function logTelegramIssue(context: string, res: SendTelegramMessageResult): void {
  if (res.status === 'error') {
    console.warn(`[notify] ${context} telegram:`, res.message);
  }
}

async function deliverEmail(params: NotifyUserParams): Promise<void> {
  const mail = params.email;
  if (!mail) return;

  const to = await resolveAccountEmail(params.userId);
  if (!to) {
    console.warn(
      `[notify] ${params.type} email skipped user=${params.userId}: нет email (войдите через Google или email)`,
    );
    return;
  }

  if (!isResendConfigured()) {
    console.warn(`[notify] ${params.type} email skipped: RESEND_API_KEY не задан на сервере`);
    return;
  }

  try {
    await sendSlottyEmail({
      to,
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
    });
    console.info(`[notify] ${params.type} email sent user=${params.userId}`);
  } catch (e) {
    console.warn(
      `[notify] ${params.type} email failed user=${params.userId}:`,
      e instanceof Error ? e.message : e,
    );
  }
}

async function deliverTelegram(
  params: NotifyUserParams,
  notificationId: string,
): Promise<void> {
  const html = params.telegramHtml?.trim();
  if (!html) return;

  const dedupeKey = buildTelegramDedupeKey(params);

  try {
    const res = await sendNotificationToProfile(
      params.userId,
      html,
      params.telegramReplyMarkup,
    );
    logTelegramIssue(`${params.type} user=${params.userId}`, res);

    if (res.status === 'ok') {
      await logNotificationDelivery({
        notificationId,
        profileId: params.userId,
        channel: 'telegram',
        status: 'sent',
        dedupeKey,
      });
      return;
    }

    if (res.status === 'skipped') {
      await logNotificationDelivery({
        notificationId,
        profileId: params.userId,
        channel: 'telegram',
        status: 'skipped',
        dedupeKey,
      });
      return;
    }

    await logNotificationDelivery({
      notificationId,
      profileId: params.userId,
      channel: 'telegram',
      status: 'failed',
      dedupeKey,
      errorMessage: res.message,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.warn(`[notify] ${params.type} telegram failed:`, message);
    await logNotificationDelivery({
      notificationId,
      profileId: params.userId,
      channel: 'telegram',
      status: 'failed',
      dedupeKey,
      errorMessage: message,
    }).catch((logErr) => {
      console.warn('[notify] failed to log telegram delivery:', logErr);
    });
  }
}

/** In-app уведомление + опционально Telegram и email (Resend). */
export async function notifyUser(params: NotifyUserParams): Promise<void> {
  const notificationId = await insertUserNotification({
    userId: params.userId,
    type: params.type,
    title: params.title,
    body: params.body,
    relatedEntityType: params.relatedEntityType,
    relatedEntityId: params.relatedEntityId,
  });

  await Promise.all([deliverTelegram(params, notificationId), deliverEmail(params)]);
}
