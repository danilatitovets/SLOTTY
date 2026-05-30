import { query } from '../../config/db.js';

export type NotificationType =
  | 'appointment_new'
  | 'appointment_pending'
  | 'appointment_confirmed'
  | 'appointment_reminder'
  | 'appointment_cancelled'
  | 'review_request'
  | 'billing'
  | 'system';

export async function insertUserNotification(params: {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  relatedEntityType?: string | null;
  relatedEntityId?: string | null;
}): Promise<string> {
  const r = await query<{ id: string }>(
    `insert into public.notifications (user_id, type, title, body, related_entity_type, related_entity_id)
     values ($1, $2::public.notification_type, $3, $4, $5, $6)
     returning id`,
    [
      params.userId,
      params.type,
      params.title,
      params.body,
      params.relatedEntityType ?? null,
      params.relatedEntityId ?? null,
    ],
  );
  const id = r.rows[0]?.id;
  if (!id) {
    throw new Error('Failed to insert notification');
  }
  return id;
}
