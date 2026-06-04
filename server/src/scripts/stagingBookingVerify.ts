/**
 * Railway/staging booking verification via API + DB (no secrets in stdout).
 * Run: cd server && npx tsx src/scripts/stagingBookingVerify.ts
 */
import jwt from 'jsonwebtoken';
import { query } from '../config/db.js';
import { loadE2eEnv } from './e2eDb.js';

function maskUrl(url: string | undefined): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    return `${u.protocol}//${u.hostname}`;
  } catch {
    return '(invalid)';
  }
}

function maskEmail(email: string): string {
  const [u, d] = email.split('@');
  return d ? `${u.slice(0, 2)}***@${d}` : '***';
}

async function main() {
  loadE2eEnv();

  const configured = (k: string) => Boolean(process.env[k]?.trim());

  console.log('=== ENV (configured yes/no) ===');
  for (const k of [
    'DATABASE_URL',
    'JWT_SECRET',
    'TELEGRAM_BOT_TOKEN',
    'RESEND_API_KEY',
    'RESEND_FROM',
    'CLIENT_URL',
    'NOTIFICATION_JOBS_ENABLED',
    'BOOKING_AUTO_COMPLETE_HOURS',
    'NODE_ENV',
    'PUBLIC_API_URL',
  ]) {
    console.log(`  ${k}: ${configured(k) ? 'yes' : 'no'}`);
  }
  console.log(`  CLIENT_URL host: ${maskUrl(process.env.CLIENT_URL)}`);
  console.log(`  PUBLIC_API_URL host: ${maskUrl(process.env.PUBLIC_API_URL)}`);

  const mig = await query<{ filename: string }>(
    `select filename from public.schema_migrations_v2
      where filename in ('057_notification_jobs.sql','058_appointment_lifecycle.sql','059_booking_two_sided_lifecycle.sql')
      order by filename`,
  );
  console.log('\n=== MIGRATIONS ===');
  for (const f of ['057_notification_jobs.sql', '058_appointment_lifecycle.sql', '059_booking_two_sided_lifecycle.sql']) {
    console.log(`  ${f}: ${mig.rows.some((r) => r.filename === f) ? 'applied' : 'MISSING'}`);
  }

  const jobs = await query<{ status: string; c: number }>(
    `select status, count(*)::int as c from public.notification_jobs group by status`,
  );
  console.log('\n=== NOTIFICATION JOBS (DB) ===');
  if (!jobs.rows.length) console.log('  (no rows)');
  for (const row of jobs.rows) console.log(`  ${row.status}: ${row.c}`);

  const apiBase = (process.env.E2E_API_URL ?? process.env.PUBLIC_API_URL)?.replace(/\/$/, '');
  if (!apiBase) {
    console.log('\nNo PUBLIC_API_URL / E2E_API_URL — skip API checks');
    process.exit(0);
  }

  const health = await fetch(`${apiBase}/api/health/ready`);
  const healthJson = health.ok ? await health.json() : null;
  console.log(`\n=== API ${maskUrl(apiBase)} ===`);
  console.log(`  health/ready: ${health.ok ? healthJson?.status : health.status}`);

  const adm = await query<{ id: string }>(
    `select id from public.profiles where role = 'platform_admin'::public.user_role and account_status = 'active' limit 1`,
  );
  const adminId = adm.rows[0]?.id;
  if (!adminId || !process.env.JWT_SECRET) {
    console.log('  diagnostics: skip (no platform_admin or JWT_SECRET)');
    process.exit(0);
  }

  const token = jwt.sign({ sub: adminId, role: 'platform_admin' }, process.env.JWT_SECRET, {
    expiresIn: '1h',
  });

  const overviewRes = await fetch(`${apiBase}/api/platform-admin/overview`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  console.log(`  overview HTTP: ${overviewRes.status}`);

  const diagRes = await fetch(`${apiBase}/api/platform-admin/notifications/diagnostics`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  console.log(`  diagnostics HTTP: ${diagRes.status}`);
  let d: Record<string, unknown> = {};
  if (diagRes.ok) {
    d = (await diagRes.json()) as Record<string, unknown>;
  } else {
    const errText = await diagRes.text();
    console.log(`  diagnostics body: ${errText.slice(0, 200)}`);
    if (diagRes.status === 404) {
      console.log('  BLOCKER: redeploy slotty-api — GET /notifications/diagnostics not in running build');
    }
  }

  if (diagRes.ok) {
  console.log('  Resend configured:', d.resendConfigured);
  console.log('  Telegram configured:', d.telegramConfigured);
  console.log('  resendFrom:', d.resendFrom ?? '—');
  console.log('  appPublicUrl:', d.appPublicUrl);
  console.log('  notificationJobsEnabled:', d.notificationJobsEnabled);
  console.log('  pendingJobs:', d.pendingJobs);
  console.log('  failedJobs:', d.failedJobs);
  const nw = d.notificationWorker as Record<string, unknown> | undefined;
  const ac = d.autoCompleteWorker as Record<string, unknown> | undefined;
  console.log('  notificationWorker.running:', nw?.running);
  console.log('  notificationWorker.lastTickAt:', nw?.lastTickAt ?? '—');
  console.log('  autoCompleteWorker.lastTickAt:', ac?.lastTickAt ?? '—');
  }

  for (const label of ['test-email', 'test-telegram'] as const) {
    const path =
      label === 'test-email'
        ? '/api/platform-admin/notifications/test-email'
        : '/api/platform-admin/notifications/test-telegram';
    const r = await fetch(`${apiBase}${path}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    });
    const body = await r.json().catch(() => ({}));
    console.log(`\n  POST ${label}: HTTP ${r.status}`);
    if (r.ok) {
      const b = body as { to?: string; messageId?: string; status?: string; skipped?: boolean };
      if (b.to) console.log(`    to: ${maskEmail(b.to)}`);
      if (b.messageId) console.log(`    messageId: ${String(b.messageId).slice(0, 16)}…`);
      if (b.status) console.log(`    status: ${b.status}`);
      if (b.skipped) console.log('    skipped: true (no Telegram linked)');
    } else {
      console.log(`    error: ${(body as { message?: string }).message ?? 'unknown'}`);
    }
  }

  const voucherR = await query<{ voucher_number: string }>(
    `select voucher_number from public.booking_vouchers order by created_at desc limit 1`,
  );
  const code = process.env.E2E_BOOKING_CODE?.trim().toUpperCase() ?? voucherR.rows[0]?.voucher_number;
  if (code) {
    const r = await fetch(
      `${apiBase}/api/platform-admin/notifications/test-booking/${encodeURIComponent(code)}`,
      { method: 'POST', headers: { Authorization: `Bearer ${token}` } },
    );
    const body = await r.json().catch(() => ({}));
    console.log(`\n  POST test-booking ${code}: HTTP ${r.status}`);
    if (r.ok) {
      const b = body as { to?: string; messageId?: string };
      if (b.to) console.log(`    to: ${maskEmail(b.to)}`);
      if (b.messageId) console.log(`    messageId: ${String(b.messageId).slice(0, 16)}…`);
    } else {
      console.log(`    error: ${(body as { message?: string }).message ?? 'unknown'}`);
    }
  }

  if (code) {
    const voucherAudit = await fetch(
      `${apiBase}/api/platform-admin/bookings/voucher/${encodeURIComponent(code)}/events`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    console.log(`\n  GET booking events (${code}): HTTP ${voucherAudit.status}`);
    if (voucherAudit.status === 404) {
      console.log('  BLOCKER: booking audit API not deployed on Railway');
    }
  }

  const apptStats = await query<{ status: string; c: number }>(
    `select status::text, count(*)::int as c from public.appointments group by status order by c desc limit 12`,
  );
  console.log('\n=== APPOINTMENTS (sample counts) ===');
  for (const row of apptStats.rows) console.log(`  ${row.status}: ${row.c}`);

  console.log('\nDone. Inbox/Telegram delivery must be confirmed manually.');
  console.log('Redeploy Railway slotty-api if diagnostics/test-* return 404.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
