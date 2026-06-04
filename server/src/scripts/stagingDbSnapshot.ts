import { query } from '../config/db.js';

async function main() {
  const [tickets, exports, audit, notifs, mig065] = await Promise.all([
    query<{ c: string }>(`select count(*)::text as c from public.support_tickets`),
    query<{ c: string }>(`select count(*)::text as c from public.data_export_jobs`),
    query<{ c: string }>(
      `select count(*)::text as c from public.admin_audit_logs
        where action like 'auth_%' or action like 'support_%'`,
    ),
    query<{ c: string }>(
      `select count(*)::text as c from public.notifications
        where type = 'system' and created_at > now() - interval '7 days'`,
    ),
    query<{ filename: string }>(
      `select filename from public.schema_migrations_v2 where filename = '065_data_export_jobs.sql'`,
    ),
  ]);
  console.log(
    JSON.stringify(
      {
        supportTickets: tickets.rows[0]?.c,
        dataExportJobs: exports.rows[0]?.c,
        auditSecuritySupport: audit.rows[0]?.c,
        systemNotificationsLast7d: notifs.rows[0]?.c,
        migration065: mig065.rows[0]?.filename ?? null,
      },
      null,
      2,
    ),
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
