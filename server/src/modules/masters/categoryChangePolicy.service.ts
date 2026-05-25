import { query } from '../../config/db.js';
import { env } from '../../config/env.js';

export type CategoryChangePolicyReason =
  | 'draft_profile'
  | 'empty_published_profile'
  | 'active_profile';

export type CategoryDto = { id: string; code: string; name: string };

export type CategoryChangeRequestDto = {
  id: string;
  status: 'pending' | 'approved' | 'rejected';
  reason: string;
  adminComment: string | null;
  createdAt: string;
  reviewedAt: string | null;
  currentCategory: CategoryDto | null;
  requestedCategory: CategoryDto;
};

export type MasterActivityStats = {
  servicesCount: number;
  activeWindowsCount: number;
  futureBookingsCount: number;
  completedBookingsCount: number;
  reviewsCount: number;
};

export type CategoryChangePolicyDto = {
  canChangeDirectly: boolean;
  needsRequest: boolean;
  reason: CategoryChangePolicyReason;
  hasActiveRequest: boolean;
  activeRequest: CategoryChangeRequestDto | null;
  activity: MasterActivityStats;
};

function mapActivityRow(row: {
  services_count: string;
  active_windows_count: string;
  future_bookings_count: string;
  completed_bookings_count: string;
  reviews_count: string;
}): MasterActivityStats {
  return {
    servicesCount: Number(row.services_count ?? 0),
    activeWindowsCount: Number(row.active_windows_count ?? 0),
    futureBookingsCount: Number(row.future_bookings_count ?? 0),
    completedBookingsCount: Number(row.completed_bookings_count ?? 0),
    reviewsCount: Number(row.reviews_count ?? 0),
  };
}

const ACTIVITY_STATS_SELECT = `
  (select count(*)::text from public.master_services where master_id = mp.master_id) as services_count,
  (select count(*)::text
     from public.master_availability_slots s
    where s.master_id = mp.master_id
      and s.status = 'available'
      and s.ends_at > now()) as active_windows_count,
  (select count(*)::text
     from public.appointments a
    where a.master_id = mp.master_id
      and a.status in ('pending', 'confirmed')
      and a.starts_at > now()) as future_bookings_count,
  (select count(*)::text
     from public.appointments a
    where a.master_id = mp.master_id
      and a.status = 'completed') as completed_bookings_count,
  (select count(*)::text from public.reviews where master_id = mp.master_id) as reviews_count`;

export async function getMasterActivityStats(masterId: string): Promise<MasterActivityStats> {
  const batch = await getMasterActivityStatsBatch([masterId]);
  return batch.get(masterId) ?? {
    servicesCount: 0,
    activeWindowsCount: 0,
    futureBookingsCount: 0,
    completedBookingsCount: 0,
    reviewsCount: 0,
  };
}

export async function getMasterActivityStatsBatch(
  masterIds: string[],
): Promise<Map<string, MasterActivityStats>> {
  const out = new Map<string, MasterActivityStats>();
  if (masterIds.length === 0) return out;

  const r = await query<{
    master_id: string;
    services_count: string;
    active_windows_count: string;
    future_bookings_count: string;
    completed_bookings_count: string;
    reviews_count: string;
  }>(
    `select mp.master_id,
            ${ACTIVITY_STATS_SELECT}
       from public.master_profiles mp
      where mp.master_id = any($1::uuid[])`,
    [masterIds],
  );

  for (const row of r.rows) {
    out.set(row.master_id, mapActivityRow(row));
  }
  for (const id of masterIds) {
    if (!out.has(id)) {
      out.set(id, {
        servicesCount: 0,
        activeWindowsCount: 0,
        futureBookingsCount: 0,
        completedBookingsCount: 0,
        reviewsCount: 0,
      });
    }
  }
  return out;
}

function isProfileActive(stats: MasterActivityStats): boolean {
  return (
    stats.servicesCount > 0 ||
    stats.activeWindowsCount > 0 ||
    stats.futureBookingsCount > 0 ||
    stats.completedBookingsCount > 0 ||
    stats.reviewsCount > 0
  );
}

async function mapCategoryRow(id: string | null): Promise<CategoryDto | null> {
  if (!id) return null;
  const r = await query<{ id: string; code: string; name: string }>(
    `select id, code, name from public.service_categories where id = $1`,
    [id],
  );
  const row = r.rows[0];
  return row ? { id: row.id, code: row.code, name: row.name } : null;
}

async function mapRequestRow(row: {
  id: string;
  status: string;
  reason: string;
  admin_comment: string | null;
  created_at: Date | string;
  reviewed_at: Date | string | null;
  current_category_id: string | null;
  requested_category_id: string;
}): Promise<CategoryChangeRequestDto> {
  const [currentCategory, requestedCategory] = await Promise.all([
    mapCategoryRow(row.current_category_id),
    mapCategoryRow(row.requested_category_id),
  ]);
  return {
    id: row.id,
    status: row.status as CategoryChangeRequestDto['status'],
    reason: row.reason,
    adminComment: row.admin_comment,
    createdAt: new Date(row.created_at).toISOString(),
    reviewedAt: row.reviewed_at ? new Date(row.reviewed_at).toISOString() : null,
    currentCategory,
    requestedCategory: requestedCategory!,
  };
}

export async function getActiveCategoryChangeRequest(
  masterId: string,
): Promise<CategoryChangeRequestDto | null> {
  const r = await query<{
    id: string;
    status: string;
    reason: string;
    admin_comment: string | null;
    created_at: Date | string;
    reviewed_at: Date | string | null;
    current_category_id: string | null;
    requested_category_id: string;
  }>(
    `select id, status, reason, admin_comment, created_at, reviewed_at, current_category_id, requested_category_id
       from public.category_change_requests
      where master_id = $1 and status = 'pending'
      order by created_at desc
      limit 1`,
    [masterId],
  );
  const row = r.rows[0];
  if (!row) return null;
  return mapRequestRow(row);
}

export async function buildCategoryChangePolicy(masterId: string): Promise<CategoryChangePolicyDto> {
  const profileRes = await query<{ publication_status: string; primary_category_id: string | null }>(
    `select publication_status::text, primary_category_id from public.master_profiles where master_id = $1`,
    [masterId],
  );
  const profile = profileRes.rows[0];
  const publicationStatus = profile?.publication_status ?? 'draft';
  const activity = await getMasterActivityStats(masterId);
  const activeRequest = await getActiveCategoryChangeRequest(masterId);

  const published = publicationStatus === 'published';
  const active = isProfileActive(activity);

  let reason: CategoryChangePolicyReason;
  let canChangeDirectly: boolean;

  if (!published) {
    reason = 'draft_profile';
    canChangeDirectly = true;
  } else if (!active) {
    reason = 'empty_published_profile';
    canChangeDirectly = true;
  } else {
    reason = 'active_profile';
    canChangeDirectly = false;
  }

  return {
    canChangeDirectly,
    needsRequest: !canChangeDirectly,
    reason,
    hasActiveRequest: Boolean(activeRequest),
    activeRequest,
    activity,
  };
}

export function buildMasterPublicProfileUrl(masterId: string, slug: string | null): string {
  const base = env.CLIENT_URL.replace(/\/$/, '');
  if (slug?.trim()) return `${base}/m/${encodeURIComponent(slug.trim())}`;
  return `${base}/m/${masterId}`;
}
