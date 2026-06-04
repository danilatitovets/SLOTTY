import { writeAdminAuditLog } from '../platform-admin/auditLog.service.js';
import { logNotification } from '../notifications/notificationLog.js';

export type ProfileSecurityAuditAction =
  | 'auth_telegram_linked'
  | 'auth_google_linked'
  | 'auth_email_linked'
  | 'auth_session_revoked'
  | 'auth_sessions_revoked_others';

export async function recordProfileSecurityEvent(
  profileId: string,
  action: ProfileSecurityAuditAction,
  metadata?: Record<string, unknown>,
): Promise<void> {
  logNotification('profile.security.event', { profileId, action, ...metadata });
  await writeAdminAuditLog({
    adminUserId: profileId,
    action,
    entityType: 'profile',
    entityId: profileId,
    targetUserId: profileId,
    metadata: metadata ?? null,
  }).catch(() => undefined);
}
