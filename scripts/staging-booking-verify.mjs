/**
 * Staging booking lifecycle verification (no secrets in output).
 * Usage: node scripts/staging-booking-verify.mjs
 * Optional: E2E_API_URL, E2E_PLATFORM_ADMIN_TOKEN, E2E_BOOKING_CODE
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function readEnv(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const out = {};
  for (const line of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const eq = t.indexOf('=');
    if (eq === -1) continue;
    const key = t.slice(0, eq).trim();
    let val = t.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    out[key] = val;
  }
  return out;
}

const serverEnv = readEnv(path.join(root, 'server', '.env'));
const rootEnv = readEnv(path.join(root, '.env'));
const env = { ...rootEnv, ...serverEnv, ...process.env };

function configured(key) {
  const v = env[key];
  return Boolean(v && String(v).trim().length > 0);
}

function maskUrl(url) {
  if (!url) return null;
  try {
    const u = new URL(url);
    return `${u.protocol}//${u.hostname}${u.pathname !== '/' ? u.pathname : ''}`;
  } catch {
    return '(invalid url)';
  }
}

const report = {
  env: {},
  database: {},
  api: {},
  migrations: [],
  tables: {},
  enums: [],
  jobStats: {},
};

const keys = [
  'DATABASE_URL',
  'JWT_SECRET',
  'TELEGRAM_BOT_TOKEN',
  'RESEND_API_KEY',
  'RESEND_FROM',
  'CLIENT_URL',
  'APP_PUBLIC_URL',
  'NOTIFICATION_JOBS_ENABLED',
  'BOOKING_AUTO_COMPLETE_HOURS',
  'NODE_ENV',
  'FRONTEND_URL',
  'VITE_API_URL',
  'PUBLIC_API_URL',
  'RAILWAY_PUBLIC_DOMAIN',
];

for (const k of keys) {
  report.env[k] = configured(k) ? 'yes' : 'no';
}

report.env.CLIENT_URL_masked = maskUrl(env.CLIENT_URL);
report.env.VITE_API_URL_masked = maskUrl(env.VITE_API_URL);
report.env.PUBLIC_API_URL_masked = maskUrl(env.PUBLIC_API_URL);

const apiBase =
  process.env.E2E_API_URL?.replace(/\/$/, '') ||
  env.PUBLIC_API_URL?.replace(/\/$/, '') ||
  env.VITE_API_URL?.replace(/\/$/, '');

report.api.baseUrl = apiBase ? maskUrl(apiBase) : null;

// --- DB checks ---
if (configured('DATABASE_URL')) {
  const client = new pg.Client({ connectionString: env.DATABASE_URL });
  try {
    await client.connect();
    const host = (() => {
      try {
        return new URL(env.DATABASE_URL.replace(/^postgres:/, 'https:')).hostname;
      } catch {
        return 'unknown';
      }
    })();
    report.database.connected = true;
    report.database.host = host;

    const mig = await client.query(
      `select filename, applied_at from public.schema_migrations_v2
        where filename in (
          '057_notification_jobs.sql',
          '058_appointment_lifecycle.sql',
          '059_booking_two_sided_lifecycle.sql'
        )
        order by filename`,
    );
    report.migrations = mig.rows.map((r) => ({
      name: r.filename,
      applied: Boolean(r.applied_at),
    }));

    for (const table of [
      'notification_jobs',
      'booking_events',
      'booking_disputes',
      'booking_completion_jobs',
    ]) {
      const t = await client.query(
        `select to_regclass($1::text) as reg`,
        [`public.${table}`],
      );
      report.tables[table] = t.rows[0]?.reg ? 'exists' : 'missing';
    }

    const enums = await client.query(
      `select e.enumlabel
         from pg_type t
         join pg_enum e on e.enumtypid = t.oid
        where t.typname = 'appointment_status'
        order by e.enumsortorder`,
    );
    const required = [
      'client_arrived',
      'in_progress',
      'master_marked_completed',
      'client_confirmed_completed',
      'disputed_by_client',
      'disputed_by_master',
      'cancelled_by_admin',
      'expired',
    ];
    const labels = enums.rows.map((r) => r.enumlabel);
    report.enums = required.map((label) => ({
      label,
      present: labels.includes(label),
    }));

    const jobs = await client.query(
      `select status, count(*)::int as c from public.notification_jobs group by status`,
    );
    for (const row of jobs.rows) {
      report.jobStats[row.status] = row.c;
    }
  } catch (e) {
    report.database.connected = false;
    report.database.error = e instanceof Error ? e.message : String(e);
  } finally {
    await client.end().catch(() => {});
  }
} else {
  report.database.connected = false;
  report.database.error = 'DATABASE_URL not set';
}

// --- API health + diagnostics (needs admin token for diagnostics) ---
if (apiBase) {
  try {
    const health = await fetch(`${apiBase}/api/health/ready`);
    report.api.healthReady = health.ok ? (await health.json()).status : `http_${health.status}`;
  } catch (e) {
    report.api.healthReady = e instanceof Error ? e.message : 'fetch_failed';
  }

  let adminToken = process.env.E2E_PLATFORM_ADMIN_TOKEN;
  if (!adminToken && configured('JWT_SECRET') && configured('DATABASE_URL')) {
    const pg2 = new pg.Client({ connectionString: env.DATABASE_URL });
    try {
      await pg2.connect();
      const adm = await pg2.query(
        `select id from public.profiles where role = 'platform_admin'::public.user_role and account_status = 'active' limit 1`,
      );
      const adminId = adm.rows[0]?.id;
      if (adminId) {
        const { default: jwt } = await import(path.join(root, 'server/node_modules/jsonwebtoken/index.js'));
        adminToken = jwt.sign({ sub: adminId, role: 'platform_admin' }, env.JWT_SECRET, {
          expiresIn: '1h',
        });
        report.api.adminAuth = 'jwt_from_db_platform_admin';
      }
    } catch {
      report.api.adminAuth = 'jwt_mint_failed';
    } finally {
      await pg2.end().catch(() => {});
    }
  }

  if (adminToken) {
    try {
      const res = await fetch(`${apiBase}/api/platform-admin/notifications/diagnostics`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (res.ok) {
        const d = await res.json();
        report.api.diagnostics = {
          resendConfigured: d.resendConfigured,
          telegramConfigured: d.telegramConfigured,
          resendFrom: d.resendFrom ?? null,
          appPublicUrl: d.appPublicUrl,
          environment: d.environment,
          notificationJobsEnabled: d.notificationJobsEnabled,
          pendingJobs: d.pendingJobs,
          failedJobs: d.failedJobs,
          notificationWorker: {
            running: d.notificationWorker?.running,
            lastTickAt: d.notificationWorker?.lastTickAt,
            lastTickError: d.notificationWorker?.lastTickError,
            lastReport: d.notificationWorker?.lastReport,
          },
          autoCompleteWorker: {
            running: d.autoCompleteWorker?.running,
            lastTickAt: d.autoCompleteWorker?.lastTickAt,
            lastProcessed: d.autoCompleteWorker?.lastProcessed,
            lastError: d.autoCompleteWorker?.lastError,
          },
          lastFailedCount: d.lastFailedJobs?.length ?? 0,
        };
      } else {
        report.api.diagnostics = { error: `http_${res.status}` };
      }

      if (res.ok || adminToken) {
        for (const [label, path, method, parse] of [
          ['testEmail', '/api/platform-admin/notifications/test-email', 'POST', true],
          ['testTelegram', '/api/platform-admin/notifications/test-telegram', 'POST', true],
        ]) {
          try {
            const r = await fetch(`${apiBase}${path}`, {
              method,
              headers: {
                Authorization: `Bearer ${adminToken}`,
                'Content-Type': 'application/json',
              },
            });
            const body = parse ? await r.json().catch(() => ({})) : {};
            report.api[label] = r.ok
              ? { ok: true, status: r.status, ...sanitizeTestBody(body) }
              : { ok: false, status: r.status, error: body?.message ?? body?.error ?? `http_${r.status}` };
          } catch (e) {
            report.api[label] = { ok: false, error: e instanceof Error ? e.message : 'fetch_failed' };
          }
        }

        const bookingCode =
          process.env.E2E_BOOKING_CODE?.trim().toUpperCase() ||
          (await (async () => {
            const pg3 = new pg.Client({ connectionString: env.DATABASE_URL });
            try {
              await pg3.connect();
              const b = await pg3.query(
                `select voucher_number from public.booking_vouchers order by created_at desc nulls last limit 1`,
              );
              return b.rows[0]?.voucher_number ?? null;
            } catch {
              return null;
            } finally {
              await pg3.end().catch(() => {});
            }
          })());

        if (bookingCode) {
          report.api.sampleBookingCode = bookingCode;
          try {
            const r = await fetch(
              `${apiBase}/api/platform-admin/notifications/test-booking/${encodeURIComponent(bookingCode)}`,
              {
                method: 'POST',
                headers: { Authorization: `Bearer ${adminToken}` },
              },
            );
            const body = await r.json().catch(() => ({}));
            report.api.testBooking = r.ok
              ? { ok: true, status: r.status, ...sanitizeTestBody(body) }
              : { ok: false, status: r.status, error: body?.message ?? `http_${r.status}` };
          } catch (e) {
            report.api.testBooking = { ok: false, error: e instanceof Error ? e.message : 'fetch_failed' };
          }
        }
      }
    } catch (e) {
      report.api.diagnostics = { error: e instanceof Error ? e.message : 'fetch_failed' };
    }
  } else {
    report.api.diagnostics = { skipped: 'no admin token (set E2E_PLATFORM_ADMIN_TOKEN or platform_admin in DB)' };
  }
}

function sanitizeTestBody(body) {
  if (!body || typeof body !== 'object') return {};
  const out = {};
  if (body.to) out.to = maskEmail(body.to);
  if (body.messageId) out.messageId = String(body.messageId).slice(0, 12) + '…';
  if (body.status) out.status = body.status;
  if (body.skipped) out.skipped = body.skipped;
  return out;
}

function maskEmail(email) {
  if (!email || typeof email !== 'string') return null;
  const [u, d] = email.split('@');
  if (!d) return '***';
  return `${u.slice(0, 2)}***@${d}`;
}

console.log(JSON.stringify(report, null, 2));
