import { query } from '../../config/db.js';
import { ApiError } from '../../utils/ApiError.js';
import {
  filterNotificationsForAudience,
  type NotificationAudience,
} from './notificationAudience.js';

function toIso(v: Date | string | null | undefined): string | null {
  if (v == null) return null;
  if (v instanceof Date) return v.toISOString();
  return String(v);
}

export type NotificationRow = {
  id: string;
  type: string;
  title: string;
  body: string;
  related_entity_type: string | null;
  related_entity_id: string | null;
  booking_code: string | null;
  read_at: string | null;
  created_at: string;
};

export async function listNotifications(
  userId: string,
  audience?: NotificationAudience,
): Promise<NotificationRow[]> {
  const r = await query<{
    id: string;
    type: string;
    title: string;
    body: string;
    related_entity_type: string | null;
    related_entity_id: string | null;
    read_at: Date | string | null;
    created_at: Date | string;
  }>(
    `select n.id, n.type::text, n.title, n.body, n.related_entity_type, n.related_entity_id,
            n.read_at, n.created_at, bv.voucher_number as booking_code
       from public.notifications n
       left join public.booking_vouchers bv
         on n.related_entity_type = 'appointment' and bv.appointment_id = n.related_entity_id
      where n.user_id = $1
      order by n.created_at desc
      limit 200`,
    [userId],
  );
  const mapped = r.rows.map((row) => ({
    id: row.id,
    type: row.type,
    title: row.title,
    body: row.body,
    related_entity_type: row.related_entity_type,
    related_entity_id: row.related_entity_id,
    booking_code: (row as { booking_code?: string | null }).booking_code ?? null,
    read_at: toIso(row.read_at),
    created_at: toIso(row.created_at) ?? new Date().toISOString(),
  }));

  if (!audience) return mapped;
  return filterNotificationsForAudience(mapped, audience);
}

export async function markNotificationRead(userId: string, notificationId: string) {
  const u = await query(
    `update public.notifications set read_at = now(), updated_at = now()
      where id = $1 and user_id = $2
      returning id`,
    [notificationId, userId],
  );
  if (!u.rowCount) {
    throw ApiError.notFound('Notification not found');
  }
}
