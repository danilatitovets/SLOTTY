import { query } from '../../config/db.js';
import { ApiError } from '../../utils/ApiError.js';
import type { AuthProvider } from './authIdentities.types.js';

export type ProfileDiagnosticRow = {
  profileId: string;
  role: string;
  createdAt: string;
  providers: string;
  hasMasterProfile: boolean;
  servicesCount: number;
  appointmentsCount: number;
  subscription: string;
  isLikelyMainProfile: boolean;
  isLikelyDuplicateProfile: boolean;
};

/** Профиль с данными мастера / записями / подпиской — не «пустой дубль». */
export async function isProfileSubstantial(profileId: string): Promise<boolean> {
  const r = await query<{ substantial: boolean }>(
    `select (
      exists (
        select 1 from public.master_profiles mp
         where mp.master_id = $1
           and (
             nullif(trim(mp.display_name), '') is not null
             or length(trim(coalesce(mp.bio, ''))) > 0
             or nullif(trim(coalesce(mp.photo_url, '')), '') is not null
             or nullif(trim(coalesce(mp.phone, '')), '') is not null
           )
      )
      or exists (select 1 from public.master_services ms where ms.master_id = $1 limit 1)
      or exists (select 1 from public.master_portfolio_items mpi where mpi.master_id = $1 limit 1)
      or exists (select 1 from public.master_subscriptions msub where msub.master_id = $1 limit 1)
      or exists (
        select 1 from public.appointments a
         where a.master_id = $1 or a.client_id = $1
         limit 1
      )
      or exists (
        select 1 from public.profiles p
         where p.id = $1 and p.role = 'master'
      )
    ) as substantial`,
    [profileId],
  );
  return Boolean(r.rows[0]?.substantial);
}

/**
 * Пустой дубль: только client (или без данных), нет кабинета/услуг/подписки/записей,
 * обычно единственная привязка — Google.
 */
export async function isProfileEmptyDuplicate(profileId: string): Promise<boolean> {
  if (await isProfileSubstantial(profileId)) return false;

  const identities = await query<{ provider: AuthProvider }>(
    `select provider::text as provider from public.auth_identities where profile_id = $1`,
    [profileId],
  );
  if (identities.rows.length === 0) return false;

  const providers = new Set(identities.rows.map((r) => r.provider));
  const onlyGoogleOrEmail =
    [...providers].every((p) => p === 'google' || p === 'email') && providers.has('google');
  return onlyGoogleOrEmail || providers.size === 1;
}

export async function findProfileIdsByEmail(email: string): Promise<string[]> {
  const normalized = email.trim().toLowerCase();
  const r = await query<{ profile_id: string }>(
    `select distinct profile_id from public.auth_identities
      where (provider = 'email'::public.auth_provider and provider_user_id = $1)
         or (lower(trim(coalesce(email, ''))) = $1)`,
    [normalized],
  );
  return r.rows.map((row) => row.profile_id);
}

export async function diagnoseProfilesByEmail(emailRaw: string): Promise<ProfileDiagnosticRow[]> {
  const email = emailRaw.trim().toLowerCase();
  const profileIds = await findProfileIdsByEmail(email);

  const tgByEmail = await query<{ profile_id: string }>(
    `select distinct p.id as profile_id
       from public.profiles p
      where p.telegram_user_id is not null
        and exists (
          select 1 from public.auth_identities ai
           where ai.profile_id = p.id
             and lower(trim(coalesce(ai.email, ''))) = $1
        )`,
    [email],
  );
  for (const row of tgByEmail.rows) {
    if (!profileIds.includes(row.profile_id)) profileIds.push(row.profile_id);
  }

  const rows: ProfileDiagnosticRow[] = [];
  for (const profileId of profileIds) {
    rows.push(await buildDiagnosticRow(profileId));
  }

  const mainCount = rows.filter((r) => r.isLikelyMainProfile).length;
  if (mainCount === 0 && rows.length > 0) {
    const best = [...rows].sort((a, b) => {
      const score = (r: ProfileDiagnosticRow) =>
        (r.hasMasterProfile ? 8 : 0) +
        r.servicesCount * 2 +
        (r.subscription !== '—' ? 4 : 0) +
        r.appointmentsCount +
        (r.role === 'master' ? 2 : 0);
      return score(b) - score(a);
    })[0];
    if (best) best.isLikelyMainProfile = true;
    for (const r of rows) {
      if (r.profileId !== best?.profileId && r.isLikelyDuplicateProfile === false) {
        r.isLikelyDuplicateProfile =
          r.role === 'client' && !r.hasMasterProfile && r.servicesCount === 0;
      }
    }
  }

  return rows.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

async function buildDiagnosticRow(profileId: string): Promise<ProfileDiagnosticRow> {
  const p = await query<{ role: string; created_at: Date | string }>(
    `select role::text as role, created_at from public.profiles where id = $1`,
    [profileId],
  );
  const role = p.rows[0]?.role ?? '?';
  const createdAt =
    p.rows[0]?.created_at instanceof Date
      ? p.rows[0].created_at.toISOString()
      : String(p.rows[0]?.created_at ?? '');

  const idRows = await query<{ provider: string; email: string | null }>(
    `select provider::text as provider, email from public.auth_identities where profile_id = $1 order by created_at`,
    [profileId],
  );
  const providers = idRows.rows
    .map((r) => (r.email ? `${r.provider}(${r.email})` : r.provider))
    .join(', ');

  const mp = await query<{ n: number }>(
    `select count(*)::int as n from public.master_profiles where master_id = $1`,
    [profileId],
  );
  const hasMasterProfile = (mp.rows[0]?.n ?? 0) > 0;

  const svc = await query<{ n: number }>(
    `select count(*)::int as n from public.master_services where master_id = $1`,
    [profileId],
  );
  const servicesCount = svc.rows[0]?.n ?? 0;

  const ap = await query<{ n: number }>(
    `select count(*)::int as n from public.appointments
      where master_id = $1 or client_id = $1`,
    [profileId],
  );
  const appointmentsCount = ap.rows[0]?.n ?? 0;

  const sub = await query<{ plan_id: string | null; status: string | null }>(
    `select plan_id::text, status::text from public.master_subscriptions where master_id = $1 limit 1`,
    [profileId],
  );
  const subscription = sub.rows[0]
    ? `${sub.rows[0].status ?? '—'}${sub.rows[0].plan_id ? ` / ${sub.rows[0].plan_id}` : ''}`
    : '—';

  const substantial = await isProfileSubstantial(profileId);
  const emptyDup = await isProfileEmptyDuplicate(profileId);

  return {
    profileId,
    role,
    createdAt,
    providers: providers || '—',
    hasMasterProfile,
    servicesCount,
    appointmentsCount,
    subscription,
    isLikelyMainProfile: substantial && !emptyDup,
    isLikelyDuplicateProfile: emptyDup,
  };
}

export async function assertGoogleEmailLinkSafe(
  currentProfileId: string,
  googleEmail: string | null | undefined,
  existingGoogleProfileId: string | null,
): Promise<void> {
  if (!googleEmail?.trim()) return;
  const email = googleEmail.trim().toLowerCase();
  const emailProfiles = await findProfileIdsByEmail(email);
  const others = emailProfiles.filter(
    (id) => id !== currentProfileId && id !== existingGoogleProfileId,
  );
  for (const otherId of others) {
    if (await isProfileSubstantial(otherId)) {
      throw ApiError.conflict(
        'Этот email Google уже используется другим аккаунтом с данными. Войдите через тот способ входа или обратитесь в поддержку.',
        'GOOGLE_EMAIL_CONFLICT',
      );
    }
  }
}
