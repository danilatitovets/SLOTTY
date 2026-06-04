import type { OverallStatusKind, SystemComponentStatus } from './systemStatus.types.js';

const SEVERITY_RANK: Record<SystemComponentStatus, number> = {
  unknown: 0,
  operational: 1,
  degraded: 2,
  maintenance: 3,
  partial_outage: 4,
  major_outage: 5,
};

export function computeOverallStatus(params: {
  componentStatuses: SystemComponentStatus[];
  hasActiveMaintenance: boolean;
  hasActiveIncident: boolean;
}): OverallStatusKind {
  if (params.hasActiveMaintenance) return 'maintenance';

  const monitored = params.componentStatuses.filter((s) => s !== 'unknown');
  if (monitored.length === 0 && params.hasActiveIncident) return 'partial_outage';

  let worst: SystemComponentStatus = 'operational';
  for (const s of monitored) {
    if (SEVERITY_RANK[s] > SEVERITY_RANK[worst]) worst = s;
  }

  if (worst === 'major_outage') return 'major_outage';
  if (worst === 'partial_outage') return 'partial_outage';
  if (worst === 'degraded') return 'degraded';
  if (params.hasActiveIncident) return 'degraded';
  return 'operational';
}

export function sanitizePublicMetadata(raw: unknown): Record<string, string | number | boolean | null> {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const out: Record<string, string | number | boolean | null> = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    const key = k.toLowerCase();
    if (
      key.includes('secret') ||
      key.includes('token') ||
      key.includes('password') ||
      key.includes('key') ||
      key.includes('apikey') ||
      key.includes('authorization')
    ) {
      continue;
    }
    if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean' || v === null) {
      out[k] = v;
    }
  }
  return out;
}
