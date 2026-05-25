import { query } from '../../config/db.js';

export type AdminAuditAction =
  | 'category_request_approved'
  | 'category_request_rejected'
  | 'user_blocked'
  | 'user_unblocked'
  | 'user_restricted'
  | 'user_unrestricted'
  | 'master_hidden'
  | 'master_unhidden'
  | 'master_paused'
  | 'master_unpaused'
  | 'service_hidden'
  | 'service_unhidden';

export async function writeAdminAuditLog(params: {
  adminUserId: string;
  action: AdminAuditAction;
  entityType: string;
  entityId: string;
  targetUserId?: string | null;
  reason?: string | null;
  metadata?: Record<string, unknown> | null;
}): Promise<void> {
  await query(
    `insert into public.admin_audit_logs (
       admin_user_id, action, entity_type, entity_id, target_user_id, reason, metadata
     ) values ($1, $2, $3, $4, $5, $6, $7::jsonb)`,
    [
      params.adminUserId,
      params.action,
      params.entityType,
      params.entityId,
      params.targetUserId ?? null,
      params.reason?.trim() || null,
      params.metadata ? JSON.stringify(params.metadata) : null,
    ],
  );
}
