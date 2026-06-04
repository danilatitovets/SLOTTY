/**
 * Smoke: platform-admin SQL + HTTP (optional).
 * npm run platform-admin-smoke --prefix server
 */
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { getPlatformAdminOverview } from '../modules/platform-admin/platformAdmin.overview.service.js';
import { listNotificationDeliveries, listAppointmentReminderFailures } from '../modules/platform-admin/platformAdmin.notifications.service.js';
import { listAccountDeletionRequestsForAdmin } from '../modules/account-deletion/accountDeletion.service.js';
import { listSupportTicketsForAdmin } from '../modules/support/supportTicket.service.js';
import { listPlatformUsers } from '../modules/platform-admin/platformAdmin.users.service.js';
import { listPlatformMasters } from '../modules/platform-admin/platformAdmin.masters.service.js';
import { listPlatformBookings } from '../modules/platform-admin/platformAdmin.bookings.service.js';
import { query } from '../config/db.js';

async function check(name: string, fn: () => Promise<unknown>) {
  try {
    await fn();
    console.log(`OK  ${name}`);
  } catch (e) {
    console.log(`FAIL ${name}: ${e instanceof Error ? e.message : e}`);
  }
}

async function main() {
  console.log('=== Platform admin smoke ===\n');

  await check('overview', () => getPlatformAdminOverview());
  await check('users', () => listPlatformUsers({ limit: 30, offset: 0 }));
  await check('masters', () => listPlatformMasters({ limit: 30, offset: 0 }));
  await check('bookings', () => listPlatformBookings({ limit: 30, offset: 0 }));
  await check('support tickets', () => listSupportTicketsForAdmin({ limit: 30, offset: 0 }));
  await check('notification deliveries', () => listNotificationDeliveries({ limit: 30, offset: 0 }));
  await check('reminder failures', () => listAppointmentReminderFailures({ limit: 30, offset: 0 }));
  await check('account deletion requests', () => listAccountDeletionRequestsForAdmin({ limit: 30, offset: 0 }));

  const apiBase = process.env.PUBLIC_API_URL?.replace(/\/$/, '');
  if (apiBase) {
    const admin = await query<{ id: string }>(
      `select id from public.profiles where role = 'platform_admin'::public.user_role and account_status = 'active' limit 1`,
    );
    const adminId = admin.rows[0]?.id;
    if (adminId && env.JWT_SECRET) {
      const token = jwt.sign({ sub: adminId, role: 'platform_admin' }, env.JWT_SECRET, { expiresIn: '1h' });
      for (const path of [
        '/api/platform-admin/overview',
        '/api/platform-admin/users?limit=30&offset=0',
        '/api/platform-admin/notifications/reminder-failures?limit=30&offset=0',
        '/api/platform-admin/account-deletion-requests?limit=30&offset=0',
      ]) {
        const res = await fetch(`${apiBase}${path}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const ok = res.ok ? 'OK ' : 'FAIL';
        console.log(`${ok} HTTP ${res.status} ${path}`);
      }
    }
  }

  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
