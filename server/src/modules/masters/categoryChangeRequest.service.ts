import { query } from '../../config/db.js';
import { env } from '../../config/env.js';
import { ApiError } from '../../utils/ApiError.js';
import { notifyUser } from '../notifications/notifyUser.js';
import { sendTelegramMessage } from '../telegram/telegram.service.js';
import { writeAdminAuditLog } from '../platform-admin/auditLog.service.js';
import {
  buildCategoryChangePolicy,
  buildMasterPublicProfileUrl,
  getActiveCategoryChangeRequest,
  getMasterActivityStats,
  getMasterActivityStatsBatch,
  type CategoryChangeRequestDto,
} from './categoryChangePolicy.service.js';

type RequestRow = {
  id: string;
  master_id: string;
  current_category_id: string | null;
  requested_category_id: string;
  reason: string;
  status: string;
  admin_comment: string | null;
  created_at: Date | string;
  reviewed_at: Date | string | null;
  reviewed_by: string | null;
};

async function mapCategoryRow(id: string | null) {
  if (!id) return null;
  const r = await query<{ id: string; code: string; name: string }>(
    `select id, code, name from public.service_categories where id = $1`,
    [id],
  );
  const row = r.rows[0];
  return row ? { id: row.id, code: row.code, name: row.name } : null;
}

async function mapRequestRow(row: RequestRow): Promise<CategoryChangeRequestDto> {
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

async function getMasterProfileMeta(masterId: string) {
  const r = await query<{ display_name: string; slug: string | null; primary_category_id: string | null }>(
    `select display_name, slug, primary_category_id from public.master_profiles where master_id = $1`,
    [masterId],
  );
  const row = r.rows[0];
  if (!row) throw ApiError.notFound('Master profile not found');
  return row;
}

export async function createCategoryChangeRequest(
  masterId: string,
  params: { requestedCategoryId: string; reason: string },
): Promise<CategoryChangeRequestDto> {
  const policy = await buildCategoryChangePolicy(masterId);
  if (policy.canChangeDirectly) {
    throw ApiError.badRequest(
      'Категорию можно изменить сразу в профиле',
      'category_change_not_required',
    );
  }
  if (policy.hasActiveRequest) {
    throw ApiError.badRequest('У вас уже есть заявка на смену категории', 'active_request_exists');
  }

  const reason = params.reason.trim();
  if (reason.length < 10) {
    throw ApiError.badRequest('Укажите причину не короче 10 символов', 'validation_error');
  }

  const cat = await query<{ id: string }>(
    `select id from public.service_categories where id = $1 and is_active = true`,
    [params.requestedCategoryId],
  );
  if (!cat.rows[0]) {
    throw ApiError.badRequest('Некорректная категория', 'validation_error');
  }

  const profile = await getMasterProfileMeta(masterId);
  const currentCategoryId = profile.primary_category_id;
  if (currentCategoryId === params.requestedCategoryId) {
    throw ApiError.badRequest('Выберите категорию, отличную от текущей', 'same_category');
  }

  const ins = await query<RequestRow>(
    `insert into public.category_change_requests (
       master_id, current_category_id, requested_category_id, reason, status
     ) values ($1, $2, $3, $4, 'pending')
     returning id, master_id, current_category_id, requested_category_id, reason, status,
               admin_comment, created_at, reviewed_at, reviewed_by`,
    [masterId, currentCategoryId, params.requestedCategoryId, reason],
  );
  const row = ins.rows[0]!;
  const mapped = await mapRequestRow(row);

  const activity = await getMasterActivityStats(masterId);
  const [currentCat, requestedCat] = await Promise.all([
    mapCategoryRow(currentCategoryId),
    mapCategoryRow(params.requestedCategoryId),
  ]);
  const profileUrl = buildMasterPublicProfileUrl(masterId, profile.slug);

  void notifyAdminAboutCategoryRequest({
    masterId,
    masterName: profile.display_name,
    profileUrl,
    currentCategory: currentCat?.name ?? '—',
    requestedCategory: requestedCat?.name ?? '—',
    reason,
    servicesCount: activity.servicesCount,
    activeWindowsCount: activity.activeWindowsCount,
    futureBookingsCount: activity.futureBookingsCount,
    reviewsCount: activity.reviewsCount,
  });

  return mapped;
}

async function notifyAdminAboutCategoryRequest(params: {
  masterId: string;
  masterName: string;
  profileUrl: string;
  currentCategory: string;
  requestedCategory: string;
  reason: string;
  servicesCount: number;
  activeWindowsCount: number;
  futureBookingsCount: number;
  reviewsCount: number;
}): Promise<void> {
  const chatId = env.TELEGRAM_ADMIN_CHAT_ID?.trim();
  if (!chatId) return;

  const text = [
    'Новая заявка на смену категории',
    '',
    `Мастер: ${params.masterName}`,
    `Профиль: ${params.profileUrl}`,
    '',
    `${params.currentCategory} → ${params.requestedCategory}`,
    '',
    'Причина:',
    params.reason,
    '',
    `Услуги: ${params.servicesCount}`,
    `Активные окна: ${params.activeWindowsCount}`,
    `Будущие записи: ${params.futureBookingsCount}`,
    `Отзывы: ${params.reviewsCount}`,
  ].join('\n');

  await sendTelegramMessage({ telegramUserId: chatId, text });
}

export async function getActiveCategoryChangeRequestForMaster(
  masterId: string,
): Promise<{ hasActiveRequest: boolean; request: CategoryChangeRequestDto | null }> {
  const request = await getActiveCategoryChangeRequest(masterId);
  return { hasActiveRequest: Boolean(request), request };
}

export type CategoryChangeRequestAdminRow = CategoryChangeRequestDto & {
  masterId: string;
  masterName: string;
  profileUrl: string;
  activity: Awaited<ReturnType<typeof getMasterActivityStats>>;
};

export async function listCategoryChangeRequestsForAdmin(
  status: 'all' | 'pending' | 'approved' | 'rejected' = 'pending',
  params?: { limit?: number; offset?: number },
): Promise<{
  requests: CategoryChangeRequestAdminRow[];
  items: CategoryChangeRequestAdminRow[];
  total: number;
  limit: number;
  offset: number;
}> {
  const conditions: string[] = [];
  const vals: unknown[] = [];
  let i = 1;
  if (status !== 'all') {
    conditions.push(`r.status = $${i++}`);
    vals.push(status);
  }
  const where = conditions.length ? `where ${conditions.join(' and ')}` : '';
  const limit = Math.min(params?.limit ?? 50, 100);
  const offset = params?.offset ?? 0;

  const countR = await query<{ total: string }>(
    `select count(*)::text as total
       from public.category_change_requests r
       join public.master_profiles mp on mp.master_id = r.master_id
      ${where}`,
    vals,
  );

  const r = await query<RequestRow & { display_name: string; slug: string | null }>(
    `select r.id, r.master_id, r.current_category_id, r.requested_category_id, r.reason, r.status,
            r.admin_comment, r.created_at, r.reviewed_at, r.reviewed_by,
            mp.display_name, mp.slug
       from public.category_change_requests r
       join public.master_profiles mp on mp.master_id = r.master_id
      ${where}
      order by r.created_at desc
      limit $${i} offset $${i + 1}`,
    [...vals, limit, offset],
  );

  const masterIds = r.rows.map((row) => row.master_id);
  const activityByMaster = await getMasterActivityStatsBatch(masterIds);

  const out: CategoryChangeRequestAdminRow[] = [];
  for (const row of r.rows) {
    const mapped = await mapRequestRow(row);
    const activity = activityByMaster.get(row.master_id)!;
    out.push({
      ...mapped,
      masterId: row.master_id,
      masterName: row.display_name,
      profileUrl: buildMasterPublicProfileUrl(row.master_id, row.slug),
      activity,
    });
  }
  return {
    requests: out,
    items: out,
    total: Number(countR.rows[0]?.total ?? 0),
    limit,
    offset,
  };
}

async function categoryAuditMetaForRequest(
  row: RequestRow,
  masterName: string,
): Promise<Record<string, unknown>> {
  const [currentCategory, requestedCategory] = await Promise.all([
    mapCategoryRow(row.current_category_id),
    mapCategoryRow(row.requested_category_id),
  ]);
  return {
    masterId: row.master_id,
    masterName,
    requestId: row.id,
    categoryBefore: currentCategory?.name ?? '—',
    categoryAfter: requestedCategory?.name ?? '—',
    requestedCategory: requestedCategory?.name ?? '—',
  };
}

export async function approveCategoryChangeRequest(
  requestId: string,
  adminUserId: string,
  adminComment?: string | null,
): Promise<void> {
  const r = await query<RequestRow & { display_name: string }>(
    `select r.id, r.master_id, r.current_category_id, r.requested_category_id, r.reason, r.status,
            r.admin_comment, r.created_at, r.reviewed_at, r.reviewed_by,
            mp.display_name
       from public.category_change_requests r
       join public.master_profiles mp on mp.master_id = r.master_id
      where r.id = $1`,
    [requestId],
  );
  const row = r.rows[0];
  if (!row) throw ApiError.notFound('Request not found');
  if (row.status !== 'pending') {
    throw ApiError.badRequest('Заявка уже обработана', 'BAD_STATUS');
  }

  const auditMeta = await categoryAuditMetaForRequest(row, row.display_name);

  const masterId = row.master_id;
  const newCategoryId = row.requested_category_id;

  await query(
    `update public.master_profiles
        set primary_category_id = $2, updated_at = now()
      where master_id = $1`,
    [masterId, newCategoryId],
  );

  await query(
    `update public.master_services
        set is_active = false, updated_at = now()
      where master_id = $1`,
    [masterId],
  );

  await query(
    `update public.category_change_requests
        set status = 'approved',
            admin_comment = coalesce($3, admin_comment),
            reviewed_at = now(),
            reviewed_by = $2,
            updated_at = now()
      where id = $1`,
    [requestId, adminUserId, adminComment?.trim() || null],
  );

  await notifyUser({
    userId: masterId,
    type: 'system',
    title: 'Категория профиля изменена',
    body: 'Мы скрыли услуги из прошлой категории — проверьте прайс перед публикацией.',
    relatedEntityType: 'category_change_request',
    relatedEntityId: requestId,
  });

  await writeAdminAuditLog({
    adminUserId: adminUserId,
    action: 'category_request_approved',
    entityType: 'category_change_request',
    entityId: requestId,
    targetUserId: masterId,
    reason: adminComment?.trim() || null,
    metadata: auditMeta,
  });
}

export async function rejectCategoryChangeRequest(
  requestId: string,
  adminUserId: string,
  adminComment: string,
): Promise<void> {
  const comment = adminComment.trim();
  if (!comment) {
    throw ApiError.badRequest('Укажите причину отклонения', 'validation_error');
  }

  const r = await query<RequestRow & { display_name: string }>(
    `select r.id, r.master_id, r.current_category_id, r.requested_category_id, r.reason, r.status,
            r.admin_comment, r.created_at, r.reviewed_at, r.reviewed_by,
            mp.display_name
       from public.category_change_requests r
       join public.master_profiles mp on mp.master_id = r.master_id
      where r.id = $1`,
    [requestId],
  );
  const row = r.rows[0];
  if (!row) throw ApiError.notFound('Request not found');
  if (row.status !== 'pending') {
    throw ApiError.badRequest('Заявка уже обработана', 'BAD_STATUS');
  }

  const auditMeta = {
    ...(await categoryAuditMetaForRequest(row, row.display_name)),
    adminComment: comment,
  };

  await query(
    `update public.category_change_requests
        set status = 'rejected',
            admin_comment = $3,
            reviewed_at = now(),
            reviewed_by = $2,
            updated_at = now()
      where id = $1`,
    [requestId, adminUserId, comment],
  );

  await notifyUser({
    userId: row.master_id,
    type: 'system',
    title: 'Заявка на смену категории отклонена',
    body: `Причина: ${comment}`,
    relatedEntityType: 'category_change_request',
    relatedEntityId: requestId,
  });

  await writeAdminAuditLog({
    adminUserId: adminUserId,
    action: 'category_request_rejected',
    entityType: 'category_change_request',
    entityId: requestId,
    targetUserId: row.master_id,
    reason: comment,
    metadata: auditMeta,
  });
}

/** @deprecated use listCategoryChangeRequestsForAdmin */
export async function listPendingCategoryChangeRequests(): Promise<CategoryChangeRequestAdminRow[]> {
  const out = await listCategoryChangeRequestsForAdmin('pending');
  return out.requests;
}
