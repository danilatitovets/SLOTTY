import { query } from '../../config/db.js';

export type NotificationDeliveryStatus = 'sent' | 'failed' | 'skipped';

export async function logNotificationDelivery(params: {
  notificationId: string | null;
  profileId: string;
  channel: 'telegram';
  status: NotificationDeliveryStatus;
  dedupeKey?: string | null;
  errorMessage?: string | null;
}): Promise<void> {
  const now = new Date();
  const sentAt = params.status === 'sent' ? now : null;
  const failedAt = params.status === 'failed' ? now : null;

  await query(
    `insert into public.notification_deliveries (
       notification_id, profile_id, channel, status, dedupe_key, error_message, sent_at, failed_at
     ) values ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [
      params.notificationId,
      params.profileId,
      params.channel,
      params.status,
      params.dedupeKey ?? null,
      params.errorMessage ?? null,
      sentAt,
      failedAt,
    ],
  );
}
