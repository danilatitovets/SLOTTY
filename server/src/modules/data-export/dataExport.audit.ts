import { query } from '../../config/db.js';
import type { DataExportAuditAction } from './dataExport.types.js';

export async function writeDataExportAudit(params: {
  userId: string;
  jobId?: string | null;
  action: DataExportAuditAction;
  metadata?: Record<string, unknown> | null;
}): Promise<void> {
  await query(
    `insert into public.data_export_audit_logs (user_id, job_id, action, metadata)
     values ($1, $2, $3, $4::jsonb)`,
    [
      params.userId,
      params.jobId ?? null,
      params.action,
      params.metadata ? JSON.stringify(params.metadata) : null,
    ],
  );
}
