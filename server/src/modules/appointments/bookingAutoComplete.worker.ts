import { env } from '../../config/env.js';
import { logNotification } from '../notifications/notificationLog.js';
import {
  claimDueBookingCompletionJobs,
  markBookingCompletionJobDone,
  markBookingCompletionJobFailed,
} from './bookingCompletionJobs.service.js';
import { processAutoCompleteAppointment } from './appointments.completion.service.js';

let timer: ReturnType<typeof setInterval> | null = null;
let running = false;
let lastTickAt: string | null = null;
let lastProcessed = 0;
let lastError: string | null = null;

async function tick(): Promise<void> {
  if (running) return;
  running = true;
  try {
    const ids = await claimDueBookingCompletionJobs(15);
    for (const id of ids) {
      try {
        const ok = await processAutoCompleteAppointment(id);
        if (ok) await markBookingCompletionJobDone(id);
        else await markBookingCompletionJobFailed(id, 'skipped');
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        await markBookingCompletionJobFailed(id, msg);
        logNotification('booking.auto_complete.failed', { bookingId: id, error: msg });
      }
    }
    lastTickAt = new Date().toISOString();
    lastProcessed = ids.length;
    lastError = null;
    if (ids.length) {
      logNotification('booking.auto_complete.tick', { count: ids.length });
    }
  } catch (e) {
    lastError = e instanceof Error ? e.message : String(e);
    logNotification('booking.auto_complete.tick_error', { error: lastError });
  } finally {
    running = false;
  }
}

export function startBookingAutoCompleteWorker(): void {
  if (env.NODE_ENV === 'test') return;
  const intervalMs = Math.min(env.NOTIFICATION_JOBS_INTERVAL_MS, 120_000);
  console.log(`[booking-auto-complete] worker started, interval ${Math.round(intervalMs / 1000)}s`);
  void tick();
  timer = setInterval(() => void tick(), intervalMs);
}

export function stopBookingAutoCompleteWorker(): void {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}

export function getBookingAutoCompleteWorkerStatus(): {
  running: boolean;
  lastTickAt: string | null;
  lastProcessed: number;
  lastError: string | null;
} {
  return {
    running: timer != null,
    lastTickAt,
    lastProcessed,
    lastError,
  };
}
