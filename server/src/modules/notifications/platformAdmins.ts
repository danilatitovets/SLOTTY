import { query } from '../../config/db.js';

/** Активные platform_admin для системных уведомлений. */
export async function listPlatformAdminProfileIds(): Promise<string[]> {
  const r = await query<{ id: string }>(
    `select id from public.profiles
      where role = 'platform_admin'::public.user_role
        and account_status = 'active'::public.account_status`,
  );
  return r.rows.map((row) => row.id);
}
