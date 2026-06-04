import { env } from '../../config/env.js';
import {
  claimPendingExportJobs,
  expireOldExportJobs,
  processDataExportJob,
} from './dataExport.service.js';

let timer: ReturnType<typeof setInterval> | null = null;
let running = false;

async function tick(): Promise<void> {
  if (running) return;
  running = true;
  try {
    await expireOldExportJobs();
    const ids = await claimPendingExportJobs(2);
    for (const id of ids) {
      await processDataExportJob(id);
    }
  } catch (e) {
    console.error('[data-export] worker tick failed:', e instanceof Error ? e.message : e);
  } finally {
    running = false;
  }
}

export function startDataExportWorker(): void {
  if (!env.DATA_EXPORT_ENABLED || !env.DATA_EXPORT_WORKER_ENABLED) {
    console.log('[data-export] worker disabled');
    return;
  }

  const intervalMs = env.DATA_EXPORT_WORKER_INTERVAL_MS;
  console.log(`[data-export] worker started, interval ${Math.round(intervalMs / 1000)}s`);
  void tick();
  timer = setInterval(() => {
    void tick();
  }, intervalMs);
}

export function stopDataExportWorker(): void {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}
