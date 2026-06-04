import { env } from '../../config/env.js';
import { processDueNotificationJobs } from './notificationJobs.service.js';
import { logNotification, logNotificationWarn } from './notificationLog.js';

let timer: ReturnType<typeof setInterval> | null = null;
let running = false;
let lastTickAt: string | null = null;
let lastTickError: string | null = null;
let lastReport: { claimed: number; sent: number; failed: number; skipped: number } | null = null;

async function tick(): Promise<void> {
  if (running) return;
  running = true;
  try {
    const report = await processDueNotificationJobs(40);
    lastTickAt = new Date().toISOString();
    lastTickError = null;
    lastReport = report;
    if (report.claimed > 0) {
      logNotification('notification.worker.tick', {
        claimed: report.claimed,
        sent: report.sent,
        failed: report.failed,
        skipped: report.skipped,
        durationMs: report.durationMs,
      });
    }
  } catch (e) {
    lastTickError = e instanceof Error ? e.message : String(e);
    logNotificationWarn('notification.worker.failed', { error: lastTickError });
  } finally {
    running = false;
  }
}

export function startNotificationJobsWorker(): void {
  if (!env.NOTIFICATION_JOBS_ENABLED) {
    console.log('[notification-jobs] worker disabled (NOTIFICATION_JOBS_ENABLED=false)');
    return;
  }

  const intervalMs = env.NOTIFICATION_JOBS_INTERVAL_MS;
  console.log(`[notification-jobs] worker started, interval ${Math.round(intervalMs / 1000)}s`);

  void tick();
  timer = setInterval(() => {
    void tick();
  }, intervalMs);
}

export function stopNotificationJobsWorker(): void {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}

export function getNotificationJobsWorkerStatus(): {
  enabled: boolean;
  running: boolean;
  intervalMs: number;
  lastTickAt: string | null;
  lastTickError: string | null;
  lastReport: { claimed: number; sent: number; failed: number; skipped: number } | null;
} {
  return {
    enabled: env.NOTIFICATION_JOBS_ENABLED,
    running: timer != null,
    intervalMs: env.NOTIFICATION_JOBS_INTERVAL_MS,
    lastTickAt,
    lastTickError,
    lastReport,
  };
}
