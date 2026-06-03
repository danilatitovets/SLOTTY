import { insertUserNotification, type NotificationType } from './notificationsInsert.js';
import { logNotificationDelivery } from './notificationDeliveriesInsert.js';
import { sendNotificationToProfile } from '../telegram/telegramProfileNotifications.js';
import type { SendTelegramMessageResult } from '../telegram/telegram.service.js';

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

/** In-app уведомление + опционально сообщение в Telegram. */
export async function notifyUser(params: NotifyUserParams): Promise<void> {
  const notificationId = await insertUserNotification({
    userId: params.userId,
    type: params.type,
    title: params.title,
    body: params.body,
    relatedEntityType: params.relatedEntityType,
    relatedEntityId: params.relatedEntityId,
  });

  if (!params.telegramHtml?.trim()) return;

  const dedupeKey = buildTelegramDedupeKey(params);

  try {
    const res = await sendNotificationToProfile(
      params.userId,
      params.telegramHtml,
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
