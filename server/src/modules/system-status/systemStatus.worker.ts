import { query } from '../../config/db.js';
import { env } from '../../config/env.js';
import { isAutomatedComponentKey, runComponentCheck } from './systemStatus.checks.js';
import type { SystemComponentStatus } from './systemStatus.types.js';

let timer: ReturnType<typeof setInterval> | null = null;

async function persistCheck(
  componentId: string,
  result: {
    status: SystemComponentStatus;
    responseTimeMs: number | null;
    errorMessage: string | null;
    metadata: Record<string, unknown>;
  },
): Promise<void> {
  await query(
    `insert into public.system_status_checks (
       component_id, status, response_time_ms, error_message, metadata
     ) values ($1, $2::public.system_component_status, $3, $4, $5::jsonb)`,
    [
      componentId,
      result.status,
      result.responseTimeMs,
      result.errorMessage,
      JSON.stringify(result.metadata),
    ],
  );

  const successAt =
    result.status === 'operational' || result.status === 'degraded' ? new Date().toISOString() : null;

  await query(
    `update public.system_status_components
        set status = $2::public.system_component_status,
            last_checked_at = now(),
            last_success_at = coalesce($3::timestamptz, last_success_at),
            response_time_ms = $4,
            metadata = coalesce(metadata, '{}'::jsonb) || $5::jsonb,
            updated_at = now()
      where id = $1`,
    [
      componentId,
      result.status,
      successAt,
      result.responseTimeMs,
      JSON.stringify(result.metadata),
    ],
  );
}

export async function runSystemStatusChecksBatch(): Promise<{
  ok: number;
  failed: number;
  skipped: number;
}> {
  const rows = await query<{ id: string; key: string }>(
    `select id, key from public.system_status_components order by sort_order`,
  );
  let ok = 0;
  let failed = 0;
  let skipped = 0;

  for (const row of rows.rows) {
    if (!isAutomatedComponentKey(row.key)) {
      skipped += 1;
      continue;
    }
    try {
      const result = await runComponentCheck(row.key);
      if (!result) {
        skipped += 1;
        continue;
      }
      await persistCheck(row.id, result);
      if (result.status === 'operational' || result.status === 'degraded') {
        console.info('[status.check.ok]', row.key, result.status);
        ok += 1;
      } else if (result.status === 'unknown') {
        console.info('[status.check.ok]', row.key, 'unknown');
        ok += 1;
      } else {
        console.warn('[status.component.degraded]', row.key, result.status, result.errorMessage);
        ok += 1;
      }
    } catch (e) {
      failed += 1;
      const msg = e instanceof Error ? e.message : String(e);
      console.warn('[status.check.failed]', row.key, msg);
      await persistCheck(row.id, {
        status: 'degraded',
        responseTimeMs: null,
        errorMessage: msg,
        metadata: {},
      });
    }
  }

  return { ok, failed, skipped };
}

export function startSystemStatusWorker(): void {
  if (!env.SYSTEM_STATUS_CHECKS_ENABLED) {
    console.log('[status-worker] disabled (SYSTEM_STATUS_CHECKS_ENABLED=false)');
    return;
  }
  const intervalMs = env.SYSTEM_STATUS_CHECK_INTERVAL_MS;
  console.log(`[status-worker] started, interval ${Math.round(intervalMs / 1000)}s`);
  void runSystemStatusChecksBatch();
  timer = setInterval(() => void runSystemStatusChecksBatch(), intervalMs);
}

export function isSystemStatusWorkerRunning(): boolean {
  return timer != null;
}
