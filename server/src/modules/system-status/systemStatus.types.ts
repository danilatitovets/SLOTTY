export const SYSTEM_COMPONENT_STATUSES = [
  'operational',
  'degraded',
  'partial_outage',
  'major_outage',
  'maintenance',
  'unknown',
] as const;

export type SystemComponentStatus = (typeof SYSTEM_COMPONENT_STATUSES)[number];

export const SYSTEM_INCIDENT_SEVERITIES = ['low', 'medium', 'high', 'critical'] as const;
export type SystemIncidentSeverity = (typeof SYSTEM_INCIDENT_SEVERITIES)[number];

export const SYSTEM_INCIDENT_STATUSES = [
  'investigating',
  'identified',
  'monitoring',
  'resolved',
] as const;
export type SystemIncidentStatus = (typeof SYSTEM_INCIDENT_STATUSES)[number];

export const SYSTEM_MAINTENANCE_STATUSES = [
  'scheduled',
  'in_progress',
  'completed',
  'cancelled',
] as const;
export type SystemMaintenanceStatus = (typeof SYSTEM_MAINTENANCE_STATUSES)[number];

export type OverallStatusKind =
  | 'operational'
  | 'degraded'
  | 'partial_outage'
  | 'major_outage'
  | 'maintenance';

export type MonitoringMode = 'automatic' | 'partial' | 'manual';

export type PublicComponentDto = {
  key: string;
  name: string;
  description: string | null;
  category: string;
  status: SystemComponentStatus;
  lastCheckedAt: string | null;
  lastSuccessAt: string | null;
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
};

export type PublicStatusPageDto = {
  overall: {
    status: OverallStatusKind;
    title: string;
    description: string;
    badgeLabel: string;
  };
  monitoring: {
    mode: MonitoringMode;
    label: string;
    checksEnabled: boolean;
    lastUpdatedAt: string;
  };
  components: PublicComponentDto[];
  activeIncidents: PublicIncidentDto[];
  maintenance: PublicMaintenanceDto[];
  incidentHistory: PublicIncidentHistoryGroup[];
};

export type PublicIncidentDto = {
  id: string;
  incidentCode: string;
  title: string;
  description: string | null;
  severity: SystemIncidentSeverity;
  status: SystemIncidentStatus;
  statusLabel: string;
  affectedComponents: string[];
  affectedLabels: string[];
  startedAt: string;
  updatedAt: string;
  updates: Array<{
    id: string;
    status: SystemIncidentStatus;
    message: string;
    createdAt: string;
  }>;
};

export type PublicMaintenanceDto = {
  id: string;
  title: string;
  description: string | null;
  affectedComponents: string[];
  affectedLabels: string[];
  startsAt: string;
  endsAt: string;
  status: SystemMaintenanceStatus;
  statusLabel: string;
};

export type PublicIncidentHistoryGroup = {
  period: string;
  incidents: Array<{
    id: string;
    incidentCode: string;
    title: string;
    status: SystemIncidentStatus;
    statusLabel: string;
    severity: SystemIncidentSeverity;
    durationLabel: string;
    affectedLabels: string[];
    resolvedAt: string | null;
  }>;
};
