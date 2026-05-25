import { query } from '../../config/db.js';
import { ApiError } from '../../utils/ApiError.js';
import { notifyUser } from '../notifications/notifyUser.js';
import { writeAdminAuditLog } from './auditLog.service.js';

export type PlatformServiceListItem = {
  id: string;
  title: string;
  masterId: string;
  masterName: string;
  categoryName: string | null;
  priceAmount: number;
  durationMinutes: number;
  isActive: boolean;
  isAdminHidden: boolean;
  adminHiddenAt: string | null;
  adminHiddenReason: string | null;
  createdAt: string;
  appointmentsCount: number;
};

export async function listPlatformServices(params: {
  filter?: string;
  categoryId?: string;
  masterId?: string;
  q?: string;
  limit?: number;
  offset?: number;
}): Promise<{
  services: PlatformServiceListItem[];
  items: PlatformServiceListItem[];
  total: number;
  limit: number;
  offset: number;
}> {
  const conditions: string[] = [];
  const vals: unknown[] = [];
  let i = 1;

  const filter = params.filter ?? 'all';
  if (filter === 'visible') conditions.push(`ms.is_active = true and ms.admin_hidden_at is null`);
  else if (filter === 'hidden') {
    conditions.push(`(ms.is_active = false or ms.admin_hidden_at is not null)`);
  }

  if (params.categoryId) {
    conditions.push(`ms.category_id = $${i++}`);
    vals.push(params.categoryId);
  }
  if (params.masterId) {
    conditions.push(`ms.master_id = $${i++}`);
    vals.push(params.masterId);
  }
  if (params.q?.trim()) {
    conditions.push(`(ms.title ilike $${i} or mp.display_name ilike $${i})`);
    vals.push(`%${params.q.trim()}%`);
    i++;
  }

  const where = conditions.length ? `where ${conditions.join(' and ')}` : '';
  const limit = Math.min(params.limit ?? 50, 100);
  const offset = params.offset ?? 0;

  const countR = await query<{ total: string }>(
    `select count(*)::text as total
       from public.master_services ms
       join public.master_profiles mp on mp.master_id = ms.master_id
       ${where}`,
    vals,
  );

  const listR = await query<{
    id: string;
    title: string;
    master_id: string;
    display_name: string;
    category_name: string | null;
    price_amount: string;
    duration_minutes: number;
    is_active: boolean;
    admin_hidden_reason: string | null;
    admin_hidden_at: Date | string | null;
    created_at: Date | string;
    appointments_count: string;
  }>(
    `select ms.id, ms.title, ms.master_id, mp.display_name, sc.name as category_name,
            ms.price_amount::text, ms.duration_minutes, ms.is_active, ms.admin_hidden_reason,
            ms.admin_hidden_at, ms.created_at,
            (select count(*)::text from public.appointments a where a.service_id = ms.id) as appointments_count
       from public.master_services ms
       join public.master_profiles mp on mp.master_id = ms.master_id
       left join public.service_categories sc on sc.id = ms.category_id
       ${where}
       order by ms.created_at desc
       limit $${i} offset $${i + 1}`,
    [...vals, limit, offset],
  );

  const items = listR.rows.map((row) => ({
      id: row.id,
      title: row.title,
      masterId: row.master_id,
      masterName: row.display_name,
      categoryName: row.category_name,
      priceAmount: Number(row.price_amount),
      durationMinutes: row.duration_minutes,
      isActive: row.is_active,
      isAdminHidden: !row.is_active || row.admin_hidden_at != null,
      adminHiddenAt: row.admin_hidden_at ? new Date(row.admin_hidden_at).toISOString() : null,
      adminHiddenReason: row.admin_hidden_reason,
      createdAt: new Date(row.created_at).toISOString(),
      appointmentsCount: Number(row.appointments_count),
    }));
  return {
    services: items,
    items,
    total: Number(countR.rows[0]?.total ?? 0),
    limit,
    offset,
  };
}

export async function hidePlatformService(
  serviceId: string,
  adminId: string,
  reason: string,
): Promise<void> {
  const trimmed = reason.trim();
  if (!trimmed) throw ApiError.badRequest('Укажите причину', 'validation_error');

  const meta = await query<{ master_id: string; title: string; publication_status: string }>(
    `select ms.master_id, ms.title, mp.publication_status::text as publication_status
       from public.master_services ms
       join public.master_profiles mp on mp.master_id = ms.master_id
      where ms.id = $1`,
    [serviceId],
  );
  const row = meta.rows[0];
  if (!row) throw ApiError.notFound('Service not found');
  const masterId = row.master_id;

  await query(
    `update public.master_services
        set is_active = false,
            admin_hidden_at = now(),
            admin_hidden_reason = $2,
            updated_at = now()
      where id = $1`,
    [serviceId, trimmed],
  );

  await writeAdminAuditLog({
    adminUserId: adminId,
    action: 'service_hidden',
    entityType: 'master_service',
    entityId: serviceId,
    targetUserId: masterId,
    reason: trimmed,
    metadata: {
      serviceName: row.title,
      reason: trimmed,
      oldStatus: 'visible',
      newStatus: 'hidden',
    },
  });

  await notifyUser({
    userId: masterId,
    type: 'system',
    title: 'Услуга скрыта',
    body: `Услуга скрыта администратором. Причина: ${trimmed}`,
    relatedEntityType: 'master_service',
    relatedEntityId: serviceId,
  });
}

export async function unhidePlatformService(serviceId: string, adminId: string): Promise<void> {
  const meta = await query<{ master_id: string }>(
    `select master_id from public.master_services where id = $1`,
    [serviceId],
  );
  const masterId = meta.rows[0]?.master_id;
  if (!masterId) throw ApiError.notFound('Service not found');

  await query(
    `update public.master_services
        set is_active = true,
            admin_hidden_at = null,
            admin_hidden_reason = null,
            updated_at = now()
      where id = $1`,
    [serviceId],
  );

  await writeAdminAuditLog({
    adminUserId: adminId,
    action: 'service_unhidden',
    entityType: 'master_service',
    entityId: serviceId,
    targetUserId: masterId,
  });
}
