import { query } from '../../config/db.js';
import { ApiError } from '../../utils/ApiError.js';
import { notifyUser } from '../notifications/notifyUser.js';
import { writeAdminAuditLog } from './auditLog.service.js';
import { assertAdminCanModifyUser } from './platformAdminGuards.service.js';

export type PlatformUserListItem = {
  id: string;
  fullName: string;
  role: string;
  accountStatus: string;
  phone: string | null;
  email: string | null;
  telegramUsername: string | null;
  createdAt: string;
  hasMasterProfile: boolean;
  appointmentsCount: number;
};

export type PlatformUserAuthIdentity = {
  provider: 'telegram' | 'google' | 'email';
  providerUserId: string;
  email: string | null;
  emailVerified: boolean;
  linkedAt: string;
};

export type PlatformUserEmailConflict = {
  id: string;
  fullName: string;
  role: string;
};

export type PlatformUserDetail = PlatformUserListItem & {
  blockedAt: string | null;
  blockedReason: string | null;
  accessRestrictedUntil: string | null;
  accessRestrictionReason: string | null;
  identities: PlatformUserAuthIdentity[];
  emailConflicts: PlatformUserEmailConflict[];
};

function mapListRow(row: {
  id: string;
  full_name: string;
  role: string;
  account_status: string;
  phone: string | null;
  email: string | null;
  telegram_username: string | null;
  created_at: Date | string;
  has_master_profile: boolean;
  appointments_count: string;
}): PlatformUserListItem {
  return {
    id: row.id,
    fullName: row.full_name,
    role: row.role,
    accountStatus: row.account_status,
    phone: row.phone,
    email: row.email,
    telegramUsername: row.telegram_username,
    createdAt: new Date(row.created_at).toISOString(),
    hasMasterProfile: row.has_master_profile,
    appointmentsCount: Number(row.appointments_count),
  };
}

/** Email для списка: только провайдер email (не дублируем Google-email на других аккаунтах). */
const USER_LIST_EMAIL_SQL = `(select ai.email from public.auth_identities ai
           where ai.profile_id = p.id and ai.provider = 'email'::public.auth_provider
           limit 1)`;

const USER_LIST_BASE = `
  select p.id, p.full_name, p.role::text as role, p.account_status::text as account_status,
         p.phone, p.telegram_username, p.created_at,
         ${USER_LIST_EMAIL_SQL} as email,
         exists (select 1 from public.master_profiles mp where mp.master_id = p.id) as has_master_profile,
         (select count(*)::text from public.appointments a
           where a.client_id = p.id or a.master_id = p.id) as appointments_count
    from public.profiles p
`;

export async function listPlatformUsers(params: {
  q?: string;
  role?: string;
  status?: string;
  limit?: number;
  offset?: number;
}): Promise<{
  users: PlatformUserListItem[];
  items: PlatformUserListItem[];
  total: number;
  limit: number;
  offset: number;
}> {
  const conditions: string[] = [];
  const vals: unknown[] = [];
  let i = 1;

  if (params.role && params.role !== 'all') {
    conditions.push(`p.role = $${i++}::public.user_role`);
    vals.push(params.role === 'admin' ? 'platform_admin' : params.role);
  }
  if (params.status && params.status !== 'all') {
    if (params.status === 'restricted') {
      conditions.push(`p.account_status = 'restricted'`);
    } else if (params.status === 'blocked') {
      conditions.push(`p.account_status = 'blocked'`);
    } else {
      conditions.push(`p.account_status = $${i++}::public.profile_account_status`);
      vals.push(params.status);
    }
  }
  if (params.q?.trim()) {
    const q = `%${params.q.trim().replace(/%/g, '\\%')}%`;
    conditions.push(
      `(p.full_name ilike $${i} or p.phone ilike $${i} or p.telegram_username ilike $${i}
        or p.id::text = $${i + 1} or exists (
          select 1 from public.auth_identities ai
           where ai.profile_id = p.id and (ai.email ilike $${i} or ai.provider_user_id ilike $${i})
        ))`,
    );
    vals.push(q, params.q.trim());
    i += 2;
  }

  const where = conditions.length ? `where ${conditions.join(' and ')}` : '';
  const limit = Math.min(params.limit ?? 50, 100);
  const offset = params.offset ?? 0;

  const countR = await query<{ total: string }>(
    `select count(*)::text as total from public.profiles p ${where}`,
    vals,
  );
  const listR = await query<Parameters<typeof mapListRow>[0]>(
    `${USER_LIST_BASE} ${where} order by p.created_at desc limit $${i} offset $${i + 1}`,
    [...vals, limit, offset],
  );

  const items = listR.rows.map(mapListRow);
  return {
    users: items,
    items,
    total: Number(countR.rows[0]?.total ?? 0),
    limit,
    offset,
  };
}

async function listAuthIdentitiesForAdmin(profileId: string): Promise<PlatformUserAuthIdentity[]> {
  const r = await query<{
    provider: 'telegram' | 'google' | 'email';
    provider_user_id: string;
    email: string | null;
    email_verified_at: Date | string | null;
    created_at: Date | string;
  }>(
    `select provider::text as provider, provider_user_id, email, email_verified_at, created_at
       from public.auth_identities
      where profile_id = $1
      order by created_at asc`,
    [profileId],
  );
  return r.rows.map((row) => ({
    provider: row.provider,
    providerUserId: row.provider_user_id,
    email: row.email,
    emailVerified: row.provider === 'email' ? Boolean(row.email_verified_at) : false,
    linkedAt: new Date(row.created_at).toISOString(),
  }));
}

async function findEmailConflictsForProfile(profileId: string): Promise<PlatformUserEmailConflict[]> {
  const r = await query<{ id: string; full_name: string; role: string }>(
    `with my_emails as (
       select distinct lower(trim(e)) as email
         from (
           select email as e from public.auth_identities where profile_id = $1 and email is not null
           union all
           select provider_user_id as e from public.auth_identities
            where profile_id = $1 and provider = 'email'::public.auth_provider
         ) raw
        where e is not null and trim(e) <> ''
     )
     select distinct on (p.id) p.id, p.full_name, p.role::text as role
       from public.profiles p
       join public.auth_identities ai on ai.profile_id = p.id
       join my_emails me on (
         (ai.provider = 'email'::public.auth_provider and lower(ai.provider_user_id) = me.email)
         or (ai.email is not null and lower(trim(ai.email)) = me.email)
       )
      where p.id <> $1
      order by p.id, p.created_at asc`,
    [profileId],
  );
  return r.rows.map((row) => ({
    id: row.id,
    fullName: row.full_name,
    role: row.role,
  }));
}

export async function getPlatformUser(userId: string): Promise<PlatformUserDetail> {
  const r = await query<
    Parameters<typeof mapListRow>[0] & {
      blocked_at: Date | string | null;
      blocked_reason: string | null;
      access_restricted_until: Date | string | null;
      access_restriction_reason: string | null;
    }
  >(
    `select p.id, p.full_name, p.role::text as role, p.account_status::text as account_status,
            p.phone, p.telegram_username, p.created_at,
            p.blocked_at, p.blocked_reason, p.access_restricted_until, p.access_restriction_reason,
            ${USER_LIST_EMAIL_SQL} as email,
            exists (select 1 from public.master_profiles mp where mp.master_id = p.id) as has_master_profile,
            (select count(*)::text from public.appointments a
              where a.client_id = p.id or a.master_id = p.id) as appointments_count
       from public.profiles p
      where p.id = $1`,
    [userId],
  );
  const row = r.rows[0];
  if (!row) throw ApiError.notFound('User not found');
  const base = mapListRow(row);
  const identities = await listAuthIdentitiesForAdmin(userId);
  let emailConflicts: PlatformUserEmailConflict[] = [];
  try {
    emailConflicts = await findEmailConflictsForProfile(userId);
  } catch {
    emailConflicts = [];
  }
  return {
    ...base,
    blockedAt: row.blocked_at ? new Date(row.blocked_at).toISOString() : null,
    blockedReason: row.blocked_reason,
    accessRestrictedUntil: row.access_restricted_until
      ? new Date(row.access_restricted_until).toISOString()
      : null,
    accessRestrictionReason: row.access_restriction_reason,
    identities,
    emailConflicts,
  };
}

async function profileAuditMeta(userId: string): Promise<{ displayName: string; oldStatus: string }> {
  const r = await query<{ full_name: string; account_status: string }>(
    `select full_name, account_status::text as account_status from public.profiles where id = $1`,
    [userId],
  );
  const row = r.rows[0];
  if (!row) throw ApiError.notFound('User not found');
  return { displayName: row.full_name, oldStatus: row.account_status };
}

export async function blockPlatformUser(
  userId: string,
  adminId: string,
  reason: string,
): Promise<void> {
  const trimmed = reason.trim();
  if (!trimmed) throw ApiError.badRequest('Укажите причину', 'validation_error');

  await assertAdminCanModifyUser(userId, adminId);

  const before = await profileAuditMeta(userId);

  const r = await query(`update public.profiles
      set account_status = 'blocked',
          blocked_at = now(),
          blocked_reason = $2,
          blocked_by = $3,
          access_restricted_until = null,
          access_restriction_reason = null,
          updated_at = now()
    where id = $1 and account_status <> 'deleted'`,
    [userId, trimmed, adminId],
  );
  if (!r.rowCount) throw ApiError.notFound('User not found');

  await writeAdminAuditLog({
    adminUserId: adminId,
    action: 'user_blocked',
    entityType: 'profile',
    entityId: userId,
    targetUserId: userId,
    reason: trimmed,
    metadata: {
      displayName: before.displayName,
      oldStatus: before.oldStatus,
      newStatus: 'blocked',
      reason: trimmed,
    },
  });

  await notifyUser({
    userId,
    type: 'system',
    title: 'Аккаунт заблокирован',
    body: `Причина: ${trimmed}`,
    relatedEntityType: 'profile',
    relatedEntityId: userId,
  });
}

export async function unblockPlatformUser(userId: string, adminId: string): Promise<void> {
  const before = await profileAuditMeta(userId);
  const r = await query(
    `update public.profiles
        set account_status = 'active',
            blocked_at = null,
            blocked_reason = null,
            blocked_by = null,
            updated_at = now()
      where id = $1`,
    [userId],
  );
  if (!r.rowCount) throw ApiError.notFound('User not found');

  await writeAdminAuditLog({
    adminUserId: adminId,
    action: 'user_unblocked',
    entityType: 'profile',
    entityId: userId,
    targetUserId: userId,
    metadata: {
      displayName: before.displayName,
      oldStatus: before.oldStatus,
      newStatus: 'active',
    },
  });
}

export async function restrictPlatformUser(
  userId: string,
  adminId: string,
  reason: string,
  until?: string | null,
): Promise<void> {
  const trimmed = reason.trim();
  if (!trimmed) throw ApiError.badRequest('Укажите причину', 'validation_error');

  await assertAdminCanModifyUser(userId, adminId);

  const untilDate = until ? new Date(until) : null;
  if (until && Number.isNaN(untilDate!.getTime())) {
    throw ApiError.badRequest('Некорректная дата', 'validation_error');
  }

  const before = await profileAuditMeta(userId);

  const r = await query(
    `update public.profiles
        set account_status = 'restricted',
            access_restriction_reason = $2,
            access_restricted_until = $3,
            updated_at = now()
      where id = $1 and account_status <> 'deleted'`,
    [userId, trimmed, untilDate],
  );
  if (!r.rowCount) throw ApiError.notFound('User not found');

  await writeAdminAuditLog({
    adminUserId: adminId,
    action: 'user_restricted',
    entityType: 'profile',
    entityId: userId,
    targetUserId: userId,
    reason: trimmed,
    metadata: {
      displayName: before.displayName,
      oldStatus: before.oldStatus,
      newStatus: 'restricted',
      reason: trimmed,
      ...(until ? { until } : {}),
    },
  });

  const untilText = untilDate
    ? ` до ${untilDate.toLocaleDateString('ru-RU')}`
    : '';
  await notifyUser({
    userId,
    type: 'system',
    title: 'Доступ ограничен',
    body: `Причина: ${trimmed}${untilText}`,
    relatedEntityType: 'profile',
    relatedEntityId: userId,
  });
}

export async function unrestrictPlatformUser(userId: string, adminId: string): Promise<void> {
  const before = await profileAuditMeta(userId);
  const r = await query(
    `update public.profiles
        set account_status = 'active',
            access_restriction_reason = null,
            access_restricted_until = null,
            updated_at = now()
      where id = $1`,
    [userId],
  );
  if (!r.rowCount) throw ApiError.notFound('User not found');

  await writeAdminAuditLog({
    adminUserId: adminId,
    action: 'user_unrestricted',
    entityType: 'profile',
    entityId: userId,
    targetUserId: userId,
    metadata: {
      displayName: before.displayName,
      oldStatus: before.oldStatus,
      newStatus: 'active',
    },
  });
}
