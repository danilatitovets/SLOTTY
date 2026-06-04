import { apiFetch, getApiBaseUrl } from '../../shared/api/backendClient';

export type SystemComponentStatus =
  | 'operational'
  | 'degraded'
  | 'partial_outage'
  | 'major_outage'
  | 'maintenance'
  | 'unknown';

export type PublicStatusPage = {
  overall: {
    status: 'operational' | 'degraded' | 'partial_outage' | 'major_outage' | 'maintenance';
    title: string;
    description: string;
    badgeLabel: string;
  };
  monitoring: {
    mode: 'automatic' | 'partial' | 'manual';
    label: string;
    checksEnabled: boolean;
    lastUpdatedAt: string;
  };
  components: Array<{
    key: string;
    name: string;
    description: string | null;
    category: string;
    status: SystemComponentStatus;
    lastCheckedAt: string | null;
    responseTimeMs: number | null;
    display: {
      statusLabel: string;
      lastCheckLabel: string | null;
      issueHint: string | null;
      extras: Array<{ label: string; value: string }>;
    };
    uptime: {
      hasHistory: boolean;
      days: number;
      bars: Array<{ date: string; status: SystemComponentStatus | 'no_data' }>;
      message: string | null;
    };
  }>;
  activeIncidents: Array<{
    id: string;
    incidentCode: string;
    title: string;
    description: string | null;
    severity: string;
    status: string;
    statusLabel: string;
    affectedLabels: string[];
    startedAt: string;
    updatedAt: string;
    updates: Array<{ id: string; status: string; message: string; createdAt: string }>;
  }>;
  maintenance: Array<{
    id: string;
    title: string;
    description: string | null;
    affectedLabels: string[];
    startsAt: string;
    endsAt: string;
    statusLabel: string;
  }>;
  incidentHistory: Array<{
    period: string;
    incidents: Array<{
      incidentCode: string;
      title: string;
      statusLabel: string;
      durationLabel: string;
      affectedLabels: string[];
    }>;
  }>;
};

export async function fetchPublicStatus(): Promise<PublicStatusPage> {
  const base = getApiBaseUrl();
  const url = base ? `${base}/api/public/status` : '/api/public/status';
  const res = await fetch(url);
  if (!res.ok) throw new Error('Не удалось загрузить статус');
  return (await res.json()) as PublicStatusPage;
}

export async function fetchMasterStatus(): Promise<PublicStatusPage> {
  const res = await apiFetch('/api/me/system-status');
  if (!res.ok) throw new Error('Не удалось загрузить статус');
  return (await res.json()) as PublicStatusPage;
}

export const COMPONENT_TO_AFFECTED_SERVICE: Record<string, string> = {
  website: 'web_cabinet',
  master_cabinet: 'web_cabinet',
  api: 'web_cabinet',
  auth: 'web_cabinet',
  catalog: 'catalog',
  booking: 'appointments',
  telegram_bot: 'telegram_bot',
  email_notifications: 'email_notifications',
  payments_bepaid: 'payments',
  pro_subscription: 'pro_subscription',
  maps: 'map_address',
};
