import { query } from '../../config/db.js';
import { ApiError } from '../../utils/ApiError.js';
import { notifyUser } from '../notifications/notifyUser.js';
import { buildMasterPublicProfileUrl } from '../masters/categoryChangePolicy.service.js';
import { getMasterSubscriptionWithUsage } from '../billing/billing.service.js';
import { listBillingEventsForMaster } from '../billing/billingEvents.service.js';
import { writeAdminAuditLog } from './auditLog.service.js';

export type PlatformMasterListItem = {
  masterId: string;
  displayName: string;
  slug: string | null;
  profileUrl: string;
  categoryName: string | null;
  publicationStatus: string;
  isVerified: boolean;
  planCode: string;
  planName: string;
  servicesCount: number;
  slotsCount: number;
  appointmentsCount: number;
  reviewsCount: number;
  ratingAvg: number;
  createdAt: string;
  hasPendingCategoryRequest: boolean;
};

export type PlatformMasterPickerItem = {
  masterId: string;
  displayName: string;
  planCode: string;
};

export type PlatformMasterBillingEvent = {
  id: string;
  eventType: string;
  planCode: string | null;
  billingPeriod: string | null;
  amount: number | null;
  currency: string;
  status: string;
  source: string;
  errorMessage: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
};

export type PlatformMasterDetail = PlatformMasterListItem & {
  phone: string | null;
  email: string | null;
  telegramUsername: string | null;
  adminHiddenReason: string | null;
  adminPauseReason: string | null;
  masterPlan: string;
  proInterested: boolean;
  proStatus: string | null;
  proStartedAt: string | null;
  proExpiresAt: string | null;
  publishedAt: string | null;
  subscription: {
    id: string;
    status: string;
    billingPeriod: string;
    currentPeriodStart: string;
    currentPeriodEnd: string;
    planCode: string;
    planName: string;
    priceMonth: number;
    priceYear: number;
    usage: { activeServices: number; monthlyAppointments: number };
  } | null;
  billingEvents: PlatformMasterBillingEvent[];
};

export async function listPlatformMasters(params: {
  filter?: string;
  q?: string;
  limit?: number;
  offset?: number;
}): Promise<{
  masters: PlatformMasterListItem[];
  items: PlatformMasterListItem[];
  total: number;
  limit: number;
  offset: number;
}> {
  const conditions: string[] = [];
  const vals: unknown[] = [];
  let i = 1;

  const filter = params.filter ?? 'all';
  if (filter === 'published') conditions.push(`mp.publication_status = 'published'`);
  else if (filter === 'hidden') conditions.push(`mp.publication_status = 'hidden'`);
  else if (filter === 'paused') conditions.push(`mp.publication_status = 'paused'`);
  else if (filter === 'blocked') conditions.push(`mp.publication_status = 'blocked'`);
  else if (filter === 'draft') conditions.push(`mp.publication_status = 'draft'`);
  else if (filter === 'no_category') conditions.push(`mp.primary_category_id is null`);
  else if (filter === 'pending_requests') {
    conditions.push(`exists (
      select 1 from public.category_change_requests ccr
       where ccr.master_id = mp.master_id and ccr.status = 'pending'
    )`);
  }

  if (params.q?.trim()) {
    conditions.push(
      `(mp.display_name ilike $${i} or mp.slug ilike $${i} or mp.master_id::text = $${i + 1})`,
    );
    vals.push(`%${params.q.trim()}%`, params.q.trim());
    i += 2;
  }

  const where = conditions.length ? `where ${conditions.join(' and ')}` : '';

  const countR = await query<{ total: string }>(
    `select count(*)::text as total from public.master_profiles mp ${where}`,
    vals,
  );

  const limit = Math.min(params.limit ?? 50, 100);
  const offset = params.offset ?? 0;

  const listR = await query<{
    master_id: string;
    display_name: string;
    slug: string | null;
    publication_status: string;
    is_verified: boolean;
    rating_avg: string;
    reviews_count: number;
    created_at: Date | string;
    category_name: string | null;
    services_count: string;
    slots_count: string;
    appointments_count: string;
    plan_code: string;
    plan_name: string;
    has_pending: boolean;
  }>(
    `select mp.master_id, mp.display_name, mp.slug, mp.publication_status::text as publication_status,
            mp.is_verified, mp.rating_avg::text, mp.reviews_count, mp.created_at,
            coalesce(sp.code, 'free') as plan_code,
            coalesce(sp.name, 'Free') as plan_name,
            sc.name as category_name,
            (select count(*)::text from public.master_services ms where ms.master_id = mp.master_id) as services_count,
            (select count(*)::text from public.master_availability_slots s
              where s.master_id = mp.master_id and s.status = 'available'
                and s.starts_at > now()) as slots_count,
            (select count(*)::text from public.appointments a where a.master_id = mp.master_id) as appointments_count,
            exists (
              select 1 from public.category_change_requests ccr
               where ccr.master_id = mp.master_id and ccr.status = 'pending'
            ) as has_pending
       from public.master_profiles mp
       left join public.master_subscriptions msub on msub.master_id = mp.master_id
       left join public.subscription_plans sp on sp.id = msub.plan_id
       left join public.service_categories sc on sc.id = mp.primary_category_id
       ${where}
       order by mp.created_at desc
       limit $${i} offset $${i + 1}`,
    [...vals, limit, offset],
  );

  const items = listR.rows.map((row) => ({
      masterId: row.master_id,
      displayName: row.display_name,
      slug: row.slug,
      profileUrl: buildMasterPublicProfileUrl(row.master_id, row.slug),
      categoryName: row.category_name,
      publicationStatus: row.publication_status,
      isVerified: row.is_verified,
      planCode: row.plan_code,
      planName: row.plan_name,
      servicesCount: Number(row.services_count),
      slotsCount: Number(row.slots_count),
      appointmentsCount: Number(row.appointments_count),
      reviewsCount: row.reviews_count,
      ratingAvg: Number(row.rating_avg),
      createdAt: new Date(row.created_at).toISOString(),
      hasPendingCategoryRequest: row.has_pending,
    }));
  return {
    masters: items,
    items,
    total: Number(countR.rows[0]?.total ?? 0),
    limit,
    offset,
  };
}

export async function listPlatformMasterPicker(q?: string): Promise<PlatformMasterPickerItem[]> {
  const conditions: string[] = [];
  const vals: unknown[] = [];
  if (q?.trim()) {
    conditions.push(`(mp.display_name ilike $1 or mp.slug ilike $1 or mp.master_id::text = $2)`);
    vals.push(`%${q.trim()}%`, q.trim());
  }
  const where = conditions.length ? `where ${conditions.join(' and ')}` : '';
  const r = await query<{ master_id: string; display_name: string; plan_code: string }>(
    `select mp.master_id, mp.display_name, coalesce(sp.code, 'free') as plan_code
       from public.master_profiles mp
       left join public.master_subscriptions msub on msub.master_id = mp.master_id
       left join public.subscription_plans sp on sp.id = msub.plan_id
       ${where}
       order by mp.display_name asc
       limit 80`,
    vals,
  );
  return r.rows.map((row) => ({
    masterId: row.master_id,
    displayName: row.display_name,
    planCode: row.plan_code,
  }));
}

export async function getPlatformMaster(masterId: string): Promise<PlatformMasterDetail> {
  const r = await query<{
    master_id: string;
    display_name: string;
    slug: string | null;
    publication_status: string;
    is_verified: boolean;
    rating_avg: string;
    reviews_count: number;
    created_at: Date | string;
    category_name: string | null;
    plan_code: string;
    plan_name: string;
    services_count: string;
    slots_count: string;
    appointments_count: string;
    has_pending: boolean;
    phone: string | null;
    telegram_username: string | null;
    admin_hidden_reason: string | null;
    admin_pause_reason: string | null;
    master_plan: string;
    pro_interested: boolean;
    pro_status: string | null;
    pro_started_at: Date | string | null;
    pro_expires_at: Date | string | null;
    published_at: Date | string | null;
    email: string | null;
  }>(
    `select mp.master_id, mp.display_name, mp.slug, mp.publication_status::text as publication_status,
            mp.is_verified, mp.rating_avg::text, mp.reviews_count, mp.created_at,
            mp.admin_hidden_reason, mp.admin_pause_reason,
            mp.master_plan, mp.pro_interested, mp.pro_status::text as pro_status,
            mp.pro_started_at, mp.pro_expires_at, mp.published_at,
            p.phone, p.telegram_username,
            coalesce(sp.code, 'free') as plan_code,
            coalesce(sp.name, 'Free') as plan_name,
            sc.name as category_name,
            (select email from public.auth_identities ai
              where ai.profile_id = mp.master_id and ai.provider = 'email'::public.auth_provider
              limit 1) as email,
            (select count(*)::text from public.master_services ms where ms.master_id = mp.master_id) as services_count,
            (select count(*)::text from public.master_availability_slots s
              where s.master_id = mp.master_id and s.status = 'available' and s.starts_at > now()) as slots_count,
            (select count(*)::text from public.appointments a where a.master_id = mp.master_id) as appointments_count,
            exists (
              select 1 from public.category_change_requests ccr
               where ccr.master_id = mp.master_id and ccr.status = 'pending'
            ) as has_pending
       from public.master_profiles mp
       join public.profiles p on p.id = mp.master_id
       left join public.master_subscriptions msub on msub.master_id = mp.master_id
       left join public.subscription_plans sp on sp.id = msub.plan_id
       left join public.service_categories sc on sc.id = mp.primary_category_id
      where mp.master_id = $1`,
    [masterId],
  );
  const row = r.rows[0];
  if (!row) throw ApiError.notFound('Master not found');

  let subscription: PlatformMasterDetail['subscription'] = null;
  try {
    const sub = await getMasterSubscriptionWithUsage(masterId);
    subscription = {
      id: sub.id,
      status: sub.status,
      billingPeriod: sub.billingPeriod,
      currentPeriodStart: sub.currentPeriodStart,
      currentPeriodEnd: sub.currentPeriodEnd,
      planCode: sub.plan.code,
      planName: sub.plan.name,
      priceMonth: sub.plan.priceMonth,
      priceYear: sub.plan.priceYear,
      usage: sub.usage,
    };
  } catch {
    subscription = null;
  }

  let billingEvents: PlatformMasterBillingEvent[] = [];
  try {
    billingEvents = await listBillingEventsForMaster(masterId);
  } catch {
    billingEvents = [];
  }

  return {
    masterId: row.master_id,
    displayName: row.display_name,
    slug: row.slug,
    profileUrl: buildMasterPublicProfileUrl(row.master_id, row.slug),
    categoryName: row.category_name,
    publicationStatus: row.publication_status,
    isVerified: row.is_verified,
    planCode: row.plan_code,
    planName: row.plan_name,
    servicesCount: Number(row.services_count),
    slotsCount: Number(row.slots_count),
    appointmentsCount: Number(row.appointments_count),
    reviewsCount: row.reviews_count,
    ratingAvg: Number(row.rating_avg),
    createdAt: new Date(row.created_at).toISOString(),
    hasPendingCategoryRequest: row.has_pending,
    phone: row.phone,
    email: row.email,
    telegramUsername: row.telegram_username,
    adminHiddenReason: row.admin_hidden_reason,
    adminPauseReason: row.admin_pause_reason,
    masterPlan: row.master_plan,
    proInterested: row.pro_interested,
    proStatus: row.pro_status,
    proStartedAt: row.pro_started_at ? new Date(row.pro_started_at).toISOString() : null,
    proExpiresAt: row.pro_expires_at ? new Date(row.pro_expires_at).toISOString() : null,
    publishedAt: row.published_at ? new Date(row.published_at).toISOString() : null,
    subscription,
    billingEvents,
  };
}

export async function hidePlatformMaster(
  masterId: string,
  adminId: string,
  reason: string,
): Promise<void> {
  const trimmed = reason.trim();
  if (!trimmed) throw ApiError.badRequest('Укажите причину', 'validation_error');

  const r = await query(
    `update public.master_profiles
        set publication_status = 'hidden',
            is_profile_active = false,
            admin_hidden_reason = $2,
            updated_at = now()
      where master_id = $1`,
    [masterId, trimmed],
  );
  if (!r.rowCount) throw ApiError.notFound('Master not found');

  await writeAdminAuditLog({
    adminUserId: adminId,
    action: 'master_hidden',
    entityType: 'master_profile',
    entityId: masterId,
    targetUserId: masterId,
    reason: trimmed,
  });

  await notifyUser({
    userId: masterId,
    type: 'system',
    title: 'Профиль скрыт',
    body: `Причина: ${trimmed}`,
    relatedEntityType: 'master_profile',
    relatedEntityId: masterId,
  });
}

export async function unhidePlatformMaster(masterId: string, adminId: string): Promise<void> {
  const r = await query(
    `update public.master_profiles
        set publication_status = 'published',
            is_profile_active = true,
            admin_hidden_reason = null,
            published_at = coalesce(published_at, now()),
            updated_at = now()
      where master_id = $1`,
    [masterId],
  );
  if (!r.rowCount) throw ApiError.notFound('Master not found');

  await writeAdminAuditLog({
    adminUserId: adminId,
    action: 'master_unhidden',
    entityType: 'master_profile',
    entityId: masterId,
    targetUserId: masterId,
  });
}

export async function pausePlatformMaster(
  masterId: string,
  adminId: string,
  reason: string,
): Promise<void> {
  const trimmed = reason.trim();
  if (!trimmed) throw ApiError.badRequest('Укажите причину', 'validation_error');

  const r = await query(
    `update public.master_profiles
        set publication_status = 'paused',
            is_profile_active = false,
            admin_paused_at = now(),
            admin_pause_reason = $2,
            updated_at = now()
      where master_id = $1`,
    [masterId, trimmed],
  );
  if (!r.rowCount) throw ApiError.notFound('Master not found');

  await writeAdminAuditLog({
    adminUserId: adminId,
    action: 'master_paused',
    entityType: 'master_profile',
    entityId: masterId,
    targetUserId: masterId,
    reason: trimmed,
  });

  await notifyUser({
    userId: masterId,
    type: 'system',
    title: 'Профиль на паузе',
    body: `Причина: ${trimmed}`,
    relatedEntityType: 'master_profile',
    relatedEntityId: masterId,
  });
}

export async function unpausePlatformMaster(masterId: string, adminId: string): Promise<void> {
  const r = await query(
    `update public.master_profiles
        set publication_status = 'published',
            is_profile_active = true,
            admin_paused_at = null,
            admin_pause_reason = null,
            published_at = coalesce(published_at, now()),
            updated_at = now()
      where master_id = $1`,
    [masterId],
  );
  if (!r.rowCount) throw ApiError.notFound('Master not found');

  await writeAdminAuditLog({
    adminUserId: adminId,
    action: 'master_unpaused',
    entityType: 'master_profile',
    entityId: masterId,
    targetUserId: masterId,
  });
}
