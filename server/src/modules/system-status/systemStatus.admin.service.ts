import { query } from '../../config/db.js';
import { ApiError } from '../../utils/ApiError.js';
import { writeAdminAuditLog } from '../platform-admin/auditLog.service.js';
import { getPublicStatusPage } from './systemStatus.service.js';
import { generateIncidentCode } from './systemStatus.service.js';
import type { SystemComponentStatus, SystemIncidentStatus, SystemMaintenanceStatus } from './systemStatus.types.js';

export async function getAdminSystemStatusDashboard() {
  const page = await getPublicStatusPage();
  const checks = await query(
    `select c.key, c.name, chk.status::text, chk.checked_at, chk.error_message
       from public.system_status_checks chk
       join public.system_status_components c on c.id = chk.component_id
      order by chk.checked_at desc
      limit 40`,
  );
  return { ...page, recentChecks: checks.rows };
}

export async function patchComponentStatus(
  adminId: string,
  componentId: string,
  body: { status?: SystemComponentStatus; metadata?: Record<string, unknown> },
) {
  const r = await query<{ id: string; key: string }>(
    `update public.system_status_components
        set status = coalesce($2::public.system_component_status, status),
            metadata = case when $3::jsonb is not null then coalesce(metadata, '{}'::jsonb) || $3::jsonb else metadata end,
            last_checked_at = now(),
            updated_at = now()
      where id = $1
      returning id, key`,
    [componentId, body.status ?? null, body.metadata ? JSON.stringify(body.metadata) : null],
  );
  const row = r.rows[0];
  if (!row) throw ApiError.notFound('Компонент не найден');
  await writeAdminAuditLog({
    adminUserId: adminId,
    action: 'system_status_component_updated',
    entityType: 'system_status_component',
    entityId: row.id,
    metadata: { key: row.key, status: body.status },
  });
  return row;
}

export async function createIncident(
  adminId: string,
  body: {
    title: string;
    description?: string | null;
    severity: string;
    affectedComponents: string[];
    status?: SystemIncidentStatus;
    message?: string;
  },
) {
  const code = generateIncidentCode();
  const r = await query<{ id: string }>(
    `insert into public.system_incidents (
       incident_code, title, description, severity, status, affected_components, created_by_admin_id
     ) values ($1, $2, $3, $4::public.system_incident_severity, $5::public.system_incident_status, $6, $7)
     returning id`,
    [
      code,
      body.title.trim(),
      body.description?.trim() || null,
      body.severity,
      body.status ?? 'investigating',
      body.affectedComponents,
      adminId,
    ],
  );
  const id = r.rows[0]!.id;
  if (body.message?.trim()) {
    await query(
      `insert into public.system_incident_updates (incident_id, status, message, created_by_admin_id)
       values ($1, $2::public.system_incident_status, $3, $4)`,
      [id, body.status ?? 'investigating', body.message.trim(), adminId],
    );
  }
  await writeAdminAuditLog({
    adminUserId: adminId,
    action: 'system_incident_created',
    entityType: 'system_incident',
    entityId: id,
    metadata: { incidentCode: code },
  });
  return { id, incidentCode: code };
}

export async function patchIncident(
  adminId: string,
  incidentId: string,
  body: { status?: SystemIncidentStatus; resolved?: boolean },
) {
  const resolvedAt = body.resolved || body.status === 'resolved' ? new Date().toISOString() : null;
  const r = await query(
    `update public.system_incidents
        set status = coalesce($2::public.system_incident_status, status),
            resolved_at = case when $3::timestamptz is not null then $3::timestamptz else resolved_at end,
            updated_at = now()
      where id = $1
      returning id`,
    [incidentId, body.status ?? null, resolvedAt],
  );
  if (!r.rowCount) throw ApiError.notFound('Инцидент не найден');
  await writeAdminAuditLog({
    adminUserId: adminId,
    action: 'system_incident_updated',
    entityType: 'system_incident',
    entityId: incidentId,
    metadata: body,
  });
}

export async function addIncidentUpdate(
  adminId: string,
  incidentId: string,
  body: { status: SystemIncidentStatus; message: string },
) {
  await query(
    `insert into public.system_incident_updates (incident_id, status, message, created_by_admin_id)
     values ($1, $2::public.system_incident_status, $3, $4)`,
    [incidentId, body.status, body.message.trim(), adminId],
  );
  await query(
    `update public.system_incidents
        set status = $2::public.system_incident_status,
            resolved_at = case when $2::text = 'resolved' then now() else resolved_at end,
            updated_at = now()
      where id = $1`,
    [incidentId, body.status],
  );
  await writeAdminAuditLog({
    adminUserId: adminId,
    action: 'system_incident_update_added',
    entityType: 'system_incident',
    entityId: incidentId,
    metadata: { status: body.status },
  });
}

export async function createMaintenance(
  adminId: string,
  body: {
    title: string;
    description?: string | null;
    affectedComponents: string[];
    startsAt: string;
    endsAt: string;
    status?: SystemMaintenanceStatus;
  },
) {
  const r = await query<{ id: string }>(
    `insert into public.system_maintenance_windows (
       title, description, affected_components, starts_at, ends_at, status, created_by_admin_id
     ) values ($1, $2, $3, $4, $5, $6::public.system_maintenance_status, $7)
     returning id`,
    [
      body.title.trim(),
      body.description?.trim() || null,
      body.affectedComponents,
      body.startsAt,
      body.endsAt,
      body.status ?? 'scheduled',
      adminId,
    ],
  );
  const id = r.rows[0]!.id;
  await writeAdminAuditLog({
    adminUserId: adminId,
    action: 'system_maintenance_created',
    entityType: 'system_maintenance',
    entityId: id,
  });
  return { id };
}

export async function patchMaintenance(
  adminId: string,
  id: string,
  body: { status?: SystemMaintenanceStatus },
) {
  const r = await query(
    `update public.system_maintenance_windows
        set status = coalesce($2::public.system_maintenance_status, status),
            updated_at = now()
      where id = $1`,
    [id, body.status ?? null],
  );
  if (!r.rowCount) throw ApiError.notFound('Окно обслуживания не найдено');
  await writeAdminAuditLog({
    adminUserId: adminId,
    action: 'system_maintenance_updated',
    entityType: 'system_maintenance',
    entityId: id,
    metadata: body,
  });
}
