import { apiFetch, getApiBaseUrl, getStoredAuthToken } from '../../../../../shared/api/backendClient';
import { readSlottyApiErrorMessage } from '../../../../../shared/api/slottyApiErrorMessage';
import type { DataExportJobSummary } from './dataExportConstants';

export type DataExportCapabilities = {
  available: boolean;
};

async function readErr(res: Response): Promise<string> {
  return readSlottyApiErrorMessage(res);
}

export function isDataExportApiAvailable(): boolean {
  return Boolean(getApiBaseUrl());
}

export async function fetchDataExportCapabilities(): Promise<DataExportCapabilities> {
  const res = await apiFetch('/api/me/data-export/capabilities');
  if (!res.ok) throw new Error(await readErr(res));
  return (await res.json()) as DataExportCapabilities;
}

export async function requestDataExportArchive(): Promise<DataExportJobSummary> {
  const res = await apiFetch('/api/me/data-export/request', { method: 'POST' });
  if (!res.ok) throw new Error(await readErr(res));
  const body = (await res.json()) as { job: DataExportJobSummary };
  return body.job;
}

export async function fetchDataExportJobs(): Promise<DataExportJobSummary[]> {
  const res = await apiFetch('/api/me/data-export/jobs');
  if (!res.ok) throw new Error(await readErr(res));
  const body = (await res.json()) as { jobs: DataExportJobSummary[] };
  return body.jobs;
}

export async function retryDataExportJob(jobId: string): Promise<DataExportJobSummary> {
  const res = await apiFetch(`/api/me/data-export/jobs/${jobId}/retry`, { method: 'POST' });
  if (!res.ok) throw new Error(await readErr(res));
  const body = (await res.json()) as { job: DataExportJobSummary };
  return body.job;
}

export async function downloadDataExportArchive(jobId: string): Promise<void> {
  const base = getApiBaseUrl();
  if (!base) throw new Error('NO_API_URL');
  const token = getStoredAuthToken();
  const res = await fetch(`${base}/api/me/data-export/jobs/${jobId}/download`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error(await readErr(res));
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `slotty-export-${jobId.slice(0, 8)}.zip`;
  a.click();
  URL.revokeObjectURL(url);
}
