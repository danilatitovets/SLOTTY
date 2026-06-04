import { query } from '../../config/db.js';
import { env } from '../../config/env.js';
import { getBillingWorkerStatus } from '../billing/billingWorker.js';
import { isResendConfigured } from '../email/emailConfig.js';
import { getGoogleOAuthDiagnostics } from '../auth/googleOAuth.service.js';
import { getNotificationJobsWorkerStatus } from '../notifications/notificationJobs.worker.js';
import { isBePaidConfigured } from '../payments/bepaid.config.js';
import { callBotMethod, getBotToken } from '../telegram/telegram.botApi.js';
import type { SystemComponentStatus } from './systemStatus.types.js';

export type CheckResult = {
  status: SystemComponentStatus;
  responseTimeMs: number | null;
  errorMessage: string | null;
  metadata: Record<string, unknown>;
};

const AUTOMATED_KEYS = new Set([
  'api',
  'database',
  'auth',
  'telegram_bot',
  'email_notifications',
  'payments_bepaid',
  'notification_worker',
  'billing_worker',
]);

export function isAutomatedComponentKey(key: string): boolean {
  return AUTOMATED_KEYS.has(key);
}

async function checkDatabase(): Promise<CheckResult> {
  const t0 = Date.now();
  try {
    await query('select 1 as ok');
    return {
      status: 'operational',
      responseTimeMs: Date.now() - t0,
      errorMessage: null,
      metadata: {},
    };
  } catch (e) {
    return {
      status: 'major_outage',
      responseTimeMs: Date.now() - t0,
      errorMessage: e instanceof Error ? e.message : 'db ping failed',
      metadata: {},
    };
  }
}

async function checkApi(): Promise<CheckResult> {
  const t0 = Date.now();
  try {
    await query('select count(*)::int from public.system_status_components');
    return {
      status: 'operational',
      responseTimeMs: Date.now() - t0,
      errorMessage: null,
      metadata: {},
    };
  } catch (e) {
    return {
      status: 'major_outage',
      responseTimeMs: Date.now() - t0,
      errorMessage: e instanceof Error ? e.message : 'api/db failed',
      metadata: {},
    };
  }
}

async function checkAuth(): Promise<CheckResult> {
  const google = getGoogleOAuthDiagnostics();
  const telegramOk = Boolean(env.TELEGRAM_BOT_TOKEN?.trim());
  const googleOk = google.configured;
  if (googleOk && telegramOk) {
    return {
      status: 'operational',
      responseTimeMs: null,
      errorMessage: null,
      metadata: { google: true, telegram: true },
    };
  }
  if (googleOk || telegramOk) {
    return {
      status: 'degraded',
      responseTimeMs: null,
      errorMessage: null,
      metadata: { google: googleOk, telegram: telegramOk },
    };
  }
  return {
    status: 'unknown',
    responseTimeMs: null,
    errorMessage: 'OAuth не настроен',
    metadata: { google: false, telegram: false },
  };
}

async function checkTelegramBot(): Promise<CheckResult> {
  const token = getBotToken();
  if (!token) {
    return {
      status: 'unknown',
      responseTimeMs: null,
      errorMessage: 'Бот не настроен',
      metadata: { configured: false },
    };
  }
  const t0 = Date.now();
  const r = await callBotMethod(token, 'getMe', {});
  return {
    status: r.ok ? 'operational' : 'degraded',
    responseTimeMs: Date.now() - t0,
    errorMessage: r.ok ? null : r.error,
    metadata: { configured: true },
  };
}

function checkResend(): CheckResult {
  const ok = isResendConfigured();
  return {
    status: ok ? 'operational' : 'unknown',
    responseTimeMs: null,
    errorMessage: ok ? null : 'Resend не настроен',
    metadata: { configured: ok },
  };
}

function checkBePaid(): CheckResult {
  const ok = isBePaidConfigured();
  return {
    status: ok ? 'operational' : 'unknown',
    responseTimeMs: null,
    errorMessage: ok ? null : 'BePaid не настроен',
    metadata: { configured: ok },
  };
}

function checkNotificationWorker(): CheckResult {
  const w = getNotificationJobsWorkerStatus();
  const meta: Record<string, unknown> = {
    enabled: w.enabled,
    running: w.running,
    lastTickAt: w.lastTickAt,
    lastTickError: w.lastTickError,
    pendingJobs: w.lastReport?.claimed ?? null,
    failedJobs: w.lastReport?.failed ?? null,
  };
  if (!w.enabled) {
    return { status: 'unknown', responseTimeMs: null, errorMessage: 'Worker отключён', metadata: meta };
  }
  if (w.lastTickError) {
    return { status: 'degraded', responseTimeMs: null, errorMessage: w.lastTickError, metadata: meta };
  }
  return { status: 'operational', responseTimeMs: null, errorMessage: null, metadata: meta };
}

function checkBillingWorker(): CheckResult {
  const w = getBillingWorkerStatus();
  const meta: Record<string, unknown> = {
    enabled: w.enabled,
    running: w.running,
    lastTickAt: w.lastTickAt,
    lastTickError: w.lastTickError,
    nextChargeJobs: w.lastReport?.renewalChargesAttempted ?? null,
  };
  if (!w.enabled) {
    return { status: 'unknown', responseTimeMs: null, errorMessage: 'Worker отключён', metadata: meta };
  }
  if (w.lastTickError) {
    return { status: 'degraded', responseTimeMs: null, errorMessage: w.lastTickError, metadata: meta };
  }
  return { status: 'operational', responseTimeMs: null, errorMessage: null, metadata: meta };
}

export async function runComponentCheck(componentKey: string): Promise<CheckResult | null> {
  switch (componentKey) {
    case 'database':
      return checkDatabase();
    case 'api':
      return checkApi();
    case 'auth':
      return checkAuth();
    case 'telegram_bot':
      return checkTelegramBot();
    case 'email_notifications':
      return checkResend();
    case 'payments_bepaid':
      return checkBePaid();
    case 'notification_worker':
      return checkNotificationWorker();
    case 'billing_worker':
      return checkBillingWorker();
    case 'pro_subscription':
      return {
        status: isBePaidConfigured() ? 'operational' : 'unknown',
        responseTimeMs: null,
        errorMessage: null,
        metadata: { billingConfigured: isBePaidConfigured() },
      };
    default:
      return null;
  }
}
