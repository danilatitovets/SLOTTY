import { query } from '../../config/db.js';

export async function listNotificationDeliveries(params?: {
  limit?: number;
  offset?: number;
  channel?: string;
  status?: string;
  search?: string;
}) {
  const limit = Math.min(params?.limit ?? 50, 100);
  const offset = params?.offset ?? 0;
  const conditions: string[] = ['true'];
  const values: unknown[] = [];
  let idx = 1;

  if (params?.channel && params.channel !== 'all') {
    conditions.push(`nd.channel = $${idx++}`);
    values.push(params.channel);
  }
  if (params?.status && params.status !== 'all') {
    conditions.push(`nd.status = $${idx++}`);
    values.push(params.status);
  }
  if (params?.search?.trim()) {
    conditions.push(
      `(p.full_name ilike $${idx} or ai.email ilike $${idx} or nd.error_message ilike $${idx})`,
    );
    values.push(`%${params.search.trim()}%`);
    idx += 1;
  }

  const where = conditions.join(' and ');
  const countValues = [...values];
  values.push(limit, offset);

  const [rows, count] = await Promise.all([
    query<{
      id: string;
      notification_id: string | null;
      profile_id: string;
      channel: string;
      status: string;
      dedupe_key: string | null;
      error_message: string | null;
      sent_at: Date | string | null;
      failed_at: Date | string | null;
      created_at: Date | string;
      full_name: string;
      email: string | null;
    }>(
      `select nd.*, p.full_name, ai.email
         from public.notification_deliveries nd
         join public.profiles p on p.id = nd.profile_id
         left join lateral (
           select email from public.auth_identities
            where profile_id = p.id and email is not null
            limit 1
         ) ai on true
        where ${where}
        order by nd.created_at desc
        limit $${idx++} offset $${idx}`,
      values,
    ),
    query<{ count: string }>(
      `select count(*)::text as count
         from public.notification_deliveries nd
         join public.profiles p on p.id = nd.profile_id
         left join lateral (
           select email from public.auth_identities
            where profile_id = p.id and email is not null
            limit 1
         ) ai on true
        where ${where}`,
      countValues,
    ),
  ]);

  return {
    items: rows.rows.map((r) => ({
      id: r.id,
      notificationId: r.notification_id,
      profileId: r.profile_id,
      channel: r.channel,
      status: r.status,
      dedupeKey: r.dedupe_key,
      errorMessage: r.error_message,
      sentAt: r.sent_at,
      failedAt: r.failed_at,
      createdAt: r.created_at,
      fullName: r.full_name,
      email: r.email,
    })),
    total: Number(count.rows[0]?.count ?? 0),
    limit,
    offset,
  };
}

export async function listAppointmentReminderFailures(params?: {
  limit?: number;
  offset?: number;
  search?: string;
}) {
  const limit = Math.min(params?.limit ?? 50, 100);
  const offset = params?.offset ?? 0;
  const conditions: string[] = [`ard.status = 'failed'`];
  const values: unknown[] = [];
  let idx = 1;

  if (params?.search?.trim()) {
    conditions.push(`(p.full_name ilike $${idx} or ai.email ilike $${idx})`);
    values.push(`%${params.search.trim()}%`);
    idx += 1;
  }

  const where = conditions.join(' and ');
  const countValues = [...values];
  values.push(limit, offset);

  const [rows, count] = await Promise.all([
    query<{
      appointment_id: string;
      reminder_kind: string;
      status: string;
      failed_at: Date | string | null;
      error_message: string | null;
      retry_count: number;
      full_name: string;
      email: string | null;
    }>(
      `select ard.*, p.full_name, ai.email
         from public.appointment_reminder_deliveries ard
         join public.appointments a on a.id = ard.appointment_id
         join public.profiles p on p.id = a.client_id
         left join lateral (
           select email from public.auth_identities
            where profile_id = p.id and email is not null
            limit 1
         ) ai on true
        where ${where}
        order by ard.failed_at desc nulls last
        limit $${idx++} offset $${idx}`,
      values,
    ),
    query<{ count: string }>(
      `select count(*)::text as count
         from public.appointment_reminder_deliveries ard
         join public.appointments a on a.id = ard.appointment_id
         join public.profiles p on p.id = a.client_id
         left join lateral (
           select email from public.auth_identities
            where profile_id = p.id and email is not null
            limit 1
         ) ai on true
        where ${where}`,
      countValues,
    ),
  ]);

  return {
    items: rows.rows.map((r) => ({
      appointmentId: r.appointment_id,
      reminderKind: r.reminder_kind,
      status: r.status,
      failedAt: r.failed_at,
      errorMessage: r.error_message,
      retryCount: r.retry_count,
      fullName: r.full_name,
      email: r.email,
    })),
    total: Number(count.rows[0]?.count ?? 0),
    limit,
    offset,
  };
}
