import { query } from '../../config/db.js';
import { ApiError } from '../../utils/ApiError.js';

async function countActivePlatformAdmins(excludeUserId?: string): Promise<number> {
  const r = await query<{ total: string }>(
    `select count(*)::text as total
       from public.profiles p
      where p.role = 'platform_admin'
        and p.account_status not in ('blocked', 'deleted')
        and ($1::uuid is null or p.id <> $1::uuid)`,
    [excludeUserId ?? null],
  );
  return Number(r.rows[0]?.total ?? 0);
}

/** Перед block/restrict/unblock/unrestrict platform-admin target. */
export async function assertAdminCanModifyUser(targetUserId: string, adminId: string): Promise<void> {
  if (targetUserId === adminId) {
    throw ApiError.forbidden(
      'Нельзя применить это действие к своему аккаунту',
      'SELF_ADMIN_ACTION_FORBIDDEN',
    );
  }

  const targetR = await query<{ role: string }>(
    `select role::text as role from public.profiles where id = $1`,
    [targetUserId],
  );
  const role = targetR.rows[0]?.role;
  if (!role) {
    throw ApiError.notFound('User not found');
  }

  if (role === 'platform_admin') {
    const others = await countActivePlatformAdmins(targetUserId);
    if (others === 0) {
      throw ApiError.forbidden(
        'Нельзя изменить статус последнего администратора платформы',
        'LAST_ADMIN_FORBIDDEN',
      );
    }
  }
}
