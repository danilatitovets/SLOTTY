import { query } from '../../config/db.js';

export type PlatformAuditLogItem = {
  id: string;
  adminUserId: string;
  adminName: string;
  action: string;
  entityType: string;
  entityId: string;
  targetUserId: string | null;
  reason: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
};

export async function listPlatformAuditLogs(params: {
  limit?: number;
  offset?: number;
}): Promise<{
  logs: PlatformAuditLogItem[];
  items: PlatformAuditLogItem[];
  total: number;
  limit: number;
  offset: number;
}> {
  const limit = Math.min(params.limit ?? 50, 100);
  const offset = params.offset ?? 0;

  const countR = await query<{ total: string }>(
    `select count(*)::text as total from public.admin_audit_logs`,
  );

  const listR = await query<{
    id: string;
    admin_user_id: string;
    admin_name: string;
    action: string;
    entity_type: string;
    entity_id: string;
    target_user_id: string | null;
    reason: string | null;
    metadata: Record<string, unknown> | null;
    created_at: Date | string;
  }>(
    `select l.id, l.admin_user_id, p.full_name as admin_name, l.action, l.entity_type, l.entity_id,
            l.target_user_id, l.reason, l.metadata, l.created_at
       from public.admin_audit_logs l
       join public.profiles p on p.id = l.admin_user_id
       order by l.created_at desc
       limit $1 offset $2`,
    [limit, offset],
  );

  const items = listR.rows.map((row) => ({
      id: row.id,
      adminUserId: row.admin_user_id,
      adminName: row.admin_name,
      action: row.action,
      entityType: row.entity_type,
      entityId: row.entity_id,
      targetUserId: row.target_user_id,
      reason: row.reason,
      metadata: row.metadata,
      createdAt: new Date(row.created_at).toISOString(),
    }));
  return {
    logs: items,
    items,
    total: Number(countR.rows[0]?.total ?? 0),
    limit,
    offset,
  };
}
