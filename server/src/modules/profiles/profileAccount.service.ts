import { query } from '../../config/db.js';
import { ApiError } from '../../utils/ApiError.js';
import type { JwtUserRole } from '../../middlewares/auth.js';

export type ProfileAccountStatus = 'active' | 'restricted' | 'blocked' | 'deleted';

export type ProfileAuthContext = {
  id: string;
  role: JwtUserRole;
  accountStatus: ProfileAccountStatus;
  restrictionReason: string | null;
  blockedReason: string | null;
  accessRestrictedUntil: string | null;
};

function isRestrictionActive(row: {
  account_status: ProfileAccountStatus;
  access_restricted_until: Date | string | null;
}): boolean {
  if (row.account_status !== 'restricted') return false;
  const until = row.access_restricted_until
    ? new Date(row.access_restricted_until)
    : null;
  if (!until) return true;
  return until.getTime() > Date.now();
}

function accountForbidden(
  code: 'ACCOUNT_BLOCKED' | 'ACCOUNT_DELETED' | 'ACCOUNT_RESTRICTED',
  message: string,
  reason?: string | null,
): ApiError {
  const err = ApiError.forbidden(message, code);
  if (reason?.trim()) err.reason = reason.trim();
  return err;
}

export async function loadProfileAuthContext(profileId: string): Promise<ProfileAuthContext> {
  const r = await query<{
    id: string;
    role: JwtUserRole;
    account_status: ProfileAccountStatus;
    access_restriction_reason: string | null;
    blocked_reason: string | null;
    access_restricted_until: Date | string | null;
  }>(
    `select id, role::text as role, account_status::text as account_status,
            access_restriction_reason, blocked_reason, access_restricted_until
       from public.profiles where id = $1`,
    [profileId],
  );
  const row = r.rows[0];
  if (!row) throw ApiError.notFound('Profile not found');

  const restrictedActive = isRestrictionActive(row);
  const accountStatus =
    row.account_status === 'restricted' && !restrictedActive ? 'active' : row.account_status;

  return {
    id: row.id,
    role: row.role,
    accountStatus,
    restrictionReason: row.access_restriction_reason,
    blockedReason: row.blocked_reason,
    accessRestrictedUntil: row.access_restricted_until
      ? new Date(row.access_restricted_until).toISOString()
      : null,
  };
}

export function effectiveAccountStatusFromRow(row: {
  account_status: ProfileAccountStatus;
  access_restricted_until: Date | string | null;
}): ProfileAccountStatus {
  if (row.account_status === 'restricted') {
    const until = row.access_restricted_until
      ? new Date(row.access_restricted_until)
      : null;
    if (until && until.getTime() <= Date.now()) {
      return 'active';
    }
  }
  return row.account_status;
}

export async function getProfileAccountStatus(profileId: string): Promise<ProfileAccountStatus> {
  const ctx = await loadProfileAuthContext(profileId);
  return ctx.accountStatus;
}

export async function assertProfileCanAuthenticate(profileId: string): Promise<void> {
  const ctx = await loadProfileAuthContext(profileId);
  if (ctx.accountStatus === 'blocked') {
    const reason = ctx.blockedReason?.trim() || 'Аккаунт заблокирован. Обратитесь в поддержку.';
    throw accountForbidden('ACCOUNT_BLOCKED', reason, ctx.blockedReason);
  }
  if (ctx.accountStatus === 'deleted') {
    throw accountForbidden('ACCOUNT_DELETED', 'Аккаунт удалён');
  }
}

/** Любые действия API, кроме чтения своих данных (blocked/deleted). */
export async function assertProfileCanUsePlatform(profileId: string): Promise<void> {
  const ctx = await loadProfileAuthContext(profileId);
  if (ctx.accountStatus === 'blocked') {
    const reason = ctx.blockedReason?.trim() || 'Аккаунт заблокирован';
    throw accountForbidden('ACCOUNT_BLOCKED', `Аккаунт заблокирован. Причина: ${reason}`, ctx.blockedReason);
  }
  if (ctx.accountStatus === 'deleted') {
    throw accountForbidden('ACCOUNT_DELETED', 'Аккаунт удалён');
  }
}

export async function assertProfileCanCreateBooking(profileId: string): Promise<void> {
  await assertProfileCanUsePlatform(profileId);
  const ctx = await loadProfileAuthContext(profileId);
  if (ctx.accountStatus === 'restricted') {
    const reason = ctx.restrictionReason?.trim() || 'Доступ ограничен';
    throw accountForbidden(
      'ACCOUNT_RESTRICTED',
      `Доступ ограничен. Причина: ${reason}`,
      ctx.restrictionReason,
    );
  }
}

export async function assertProfileCanManageMasterContent(profileId: string): Promise<void> {
  await assertProfileCanUsePlatform(profileId);
  const ctx = await loadProfileAuthContext(profileId);
  if (ctx.accountStatus === 'restricted') {
    const reason = ctx.restrictionReason?.trim() || 'Доступ ограничен';
    throw accountForbidden(
      'ACCOUNT_RESTRICTED',
      `Доступ ограничен. Причина: ${reason}`,
      ctx.restrictionReason,
    );
  }
}

export async function assertProfileCanManageMasterProfile(profileId: string): Promise<void> {
  await assertProfileCanManageMasterContent(profileId);
}

/** @deprecated use assertProfileCanCreateBooking */
export async function assertProfileCanCreateContent(profileId: string): Promise<void> {
  await assertProfileCanCreateBooking(profileId);
}

export async function assertMasterAcceptsBookings(masterId: string): Promise<void> {
  const r = await query<{
    publication_status: string;
    account_status: ProfileAccountStatus;
    access_restricted_until: Date | string | null;
    access_restriction_reason: string | null;
    blocked_reason: string | null;
  }>(
    `select mp.publication_status::text as publication_status,
            p.account_status::text as account_status,
            p.access_restricted_until, p.access_restriction_reason, p.blocked_reason
       from public.master_profiles mp
       join public.profiles p on p.id = mp.master_id
      where mp.master_id = $1`,
    [masterId],
  );
  const row = r.rows[0];
  if (!row) {
    throw ApiError.notFound('Master not found');
  }
  if (row.account_status === 'blocked' || row.account_status === 'deleted') {
    throw ApiError.conflict('Мастер недоступен для записи', 'MASTER_NOT_BOOKABLE');
  }
  if (isRestrictionActive(row)) {
    throw ApiError.conflict('Мастер недоступен для записи', 'MASTER_NOT_BOOKABLE');
  }
  if (row.publication_status !== 'published') {
    throw ApiError.conflict('Master is not published', 'MASTER_NOT_PUBLISHED');
  }
}
