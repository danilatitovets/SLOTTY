import { env } from '../../config/env.js';
import { processAppointmentReminders } from './appointmentReminders.service.js';

let timer: ReturnType<typeof setInterval> | null = null;
let running = false;
let lastTickAt: string | null = null;
let lastTickError: string | null = null;
let lastReport: { sent24h: number; sent1h: number; durationMs: number } | null = null;

async function tick(): Promise<void> {
  if (running) return;
  running = true;
  try {
    const report = await processAppointmentReminders();
    lastTickAt = new Date().toISOString();
    lastTickError = null;
    lastReport = report;
    if (report.sent24h > 0 || report.sent1h > 0) {
      console.log(
        `[reminders] sent 24h=${report.sent24h} 1h=${report.sent1h} (${report.durationMs}ms)`,
      );
    }
  } catch (e) {
    lastTickError = e instanceof Error ? e.message : String(e);
    console.warn('[reminders] tick failed:', lastTickError);
  } finally {
    running = false;
  }
}

/** Периодическая проверка записей и отправка напоминаний в Telegram + in-app. */
export function startAppointmentRemindersScheduler(): void {
  if (!env.APPOINTMENT_REMINDERS_LEGACY) {
    console.log('[reminders] legacy poll disabled (use notification_jobs worker)');
    return;
  }
  if (!env.APPOINTMENT_REMINDERS_ENABLED) {
    console.log('[reminders] scheduler disabled (APPOINTMENT_REMINDERS_ENABLED=false)');
    return;
  }

  const intervalMs = env.APPOINTMENT_REMINDERS_INTERVAL_MS;
  console.log(`[reminders] scheduler started, interval ${Math.round(intervalMs / 1000)}s`);

  void tick();
  timer = setInterval(() => {
    void tick();
  }, intervalMs);
}

export function stopAppointmentRemindersScheduler(): void {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}

export function getAppointmentRemindersSchedulerStatus(): {
  enabled: boolean;
  running: boolean;
  intervalMs: number;
  lastTickAt: string | null;
  lastTickError: string | null;
  lastReport: { sent24h: number; sent1h: number; durationMs: number } | null;
} {
  return {
    enabled: env.APPOINTMENT_REMINDERS_ENABLED,
    running: timer != null,
    intervalMs: env.APPOINTMENT_REMINDERS_INTERVAL_MS,
    lastTickAt,
    lastTickError,
    lastReport,
  };
}
