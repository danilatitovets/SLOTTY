import { apiFetch } from '../../../shared/api/backendClient';
import { readSlottyApiErrorMessage } from '../../../shared/api/slottyApiErrorMessage';
import type {
  CategoryChangeRequestAdmin,
  PlatformAdminOverview,
  PlatformAuditLogItem,
  PlatformBookingDetail,
  PlatformBookingListItem,
  PlatformClientBookingStats,
  PlatformMasterDetail,
  PlatformMasterListItem,
  PlatformMasterPickerItem,
  PlatformServiceListItem,
  PlatformUserDetail,
  PlatformUserListItem,
} from './platformAdmin.types';

async function readErr(res: Response): Promise<string> {
  return readSlottyApiErrorMessage(res);
}

export async function getPlatformAdminOverview(): Promise<PlatformAdminOverview> {
  const res = await apiFetch('/api/platform-admin/overview');
  if (!res.ok) throw new Error(await readErr(res));
  return (await res.json()) as PlatformAdminOverview;
}

export type PlatformPagedResult<T> = {
  items: T[];
  total: number;
  limit: number;
  offset: number;
};

const PAGE_SIZE = 50;

export async function getCategoryChangeRequests(
  status: 'all' | 'pending' | 'approved' | 'rejected' = 'pending',
  params?: { limit?: number; offset?: number },
): Promise<PlatformPagedResult<CategoryChangeRequestAdmin> & { requests: CategoryChangeRequestAdmin[] }> {
  const q = new URLSearchParams();
  if (status !== 'all') q.set('status', status);
  q.set('limit', String(params?.limit ?? PAGE_SIZE));
  q.set('offset', String(params?.offset ?? 0));
  const res = await apiFetch(`/api/platform-admin/category-change-requests?${q}`);
  if (!res.ok) throw new Error(await readErr(res));
  const data = (await res.json()) as {
    requests: CategoryChangeRequestAdmin[];
    items?: CategoryChangeRequestAdmin[];
    total: number;
    limit: number;
    offset: number;
  };
  const items = data.items ?? data.requests;
  return { requests: items, items, total: data.total, limit: data.limit, offset: data.offset };
}

export async function approveCategoryChangeRequest(id: string): Promise<void> {
  const res = await apiFetch(`/api/platform-admin/category-change-requests/${id}/approve`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
  if (!res.ok) throw new Error(await readErr(res));
}

export async function rejectCategoryChangeRequest(id: string, adminComment: string): Promise<void> {
  const res = await apiFetch(`/api/platform-admin/category-change-requests/${id}/reject`, {
    method: 'POST',
    body: JSON.stringify({ adminComment }),
  });
  if (!res.ok) throw new Error(await readErr(res));
}

export async function getPlatformUsers(params?: {
  q?: string;
  role?: string;
  status?: string;
  limit?: number;
  offset?: number;
}): Promise<PlatformPagedResult<PlatformUserListItem> & { users: PlatformUserListItem[] }> {
  const q = new URLSearchParams();
  if (params?.q) q.set('q', params.q);
  if (params?.role) q.set('role', params.role);
  if (params?.status) q.set('status', params.status);
  q.set('limit', String(params?.limit ?? PAGE_SIZE));
  q.set('offset', String(params?.offset ?? 0));
  const qs = q.toString();
  const res = await apiFetch(`/api/platform-admin/users?${qs}`);
  if (!res.ok) throw new Error(await readErr(res));
  const data = (await res.json()) as {
    users: PlatformUserListItem[];
    items?: PlatformUserListItem[];
    total: number;
    limit: number;
    offset: number;
  };
  const items = data.items ?? data.users;
  return { users: items, items, total: data.total, limit: data.limit, offset: data.offset };
}

export async function getPlatformUser(id: string): Promise<PlatformUserDetail> {
  const res = await apiFetch(`/api/platform-admin/users/${id}`);
  if (!res.ok) throw new Error(await readErr(res));
  const data = (await res.json()) as { user: PlatformUserDetail };
  return data.user;
}

export async function blockUser(id: string, reason: string): Promise<void> {
  const res = await apiFetch(`/api/platform-admin/users/${id}/block`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
  if (!res.ok) throw new Error(await readErr(res));
}

export async function unblockUser(id: string): Promise<void> {
  const res = await apiFetch(`/api/platform-admin/users/${id}/unblock`, { method: 'POST' });
  if (!res.ok) throw new Error(await readErr(res));
}

export async function restrictUser(id: string, reason: string, until?: string): Promise<void> {
  const res = await apiFetch(`/api/platform-admin/users/${id}/restrict`, {
    method: 'POST',
    body: JSON.stringify({ reason, until: until ?? null }),
  });
  if (!res.ok) throw new Error(await readErr(res));
}

export async function unrestrictUser(id: string): Promise<void> {
  const res = await apiFetch(`/api/platform-admin/users/${id}/unrestrict`, { method: 'POST' });
  if (!res.ok) throw new Error(await readErr(res));
}

export async function getPlatformMasters(params?: {
  filter?: string;
  q?: string;
  limit?: number;
  offset?: number;
}): Promise<PlatformPagedResult<PlatformMasterListItem> & { masters: PlatformMasterListItem[] }> {
  const q = new URLSearchParams();
  if (params?.filter) q.set('filter', params.filter);
  if (params?.q) q.set('q', params.q);
  q.set('limit', String(params?.limit ?? PAGE_SIZE));
  q.set('offset', String(params?.offset ?? 0));
  const res = await apiFetch(`/api/platform-admin/masters?${q}`);
  if (!res.ok) throw new Error(await readErr(res));
  const data = (await res.json()) as {
    masters: PlatformMasterListItem[];
    items?: PlatformMasterListItem[];
    total: number;
    limit: number;
    offset: number;
  };
  const items = data.items ?? data.masters;
  return { masters: items, items, total: data.total, limit: data.limit, offset: data.offset };
}

export async function getPlatformMasterPicker(q?: string): Promise<PlatformMasterPickerItem[]> {
  const qs = q?.trim() ? `?q=${encodeURIComponent(q.trim())}` : '';
  const res = await apiFetch(`/api/platform-admin/masters-picker${qs}`);
  if (!res.ok) throw new Error(await readErr(res));
  const data = (await res.json()) as { masters: PlatformMasterPickerItem[] };
  return data.masters;
}

export async function getPlatformMaster(id: string): Promise<PlatformMasterDetail> {
  const res = await apiFetch(`/api/platform-admin/masters/${id}`);
  if (!res.ok) throw new Error(await readErr(res));
  const data = (await res.json()) as { master: PlatformMasterDetail };
  return data.master;
}

export async function hideMaster(id: string, reason: string): Promise<void> {
  const res = await apiFetch(`/api/platform-admin/masters/${id}/hide`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
  if (!res.ok) throw new Error(await readErr(res));
}

export async function unhideMaster(id: string): Promise<void> {
  const res = await apiFetch(`/api/platform-admin/masters/${id}/unhide`, { method: 'POST' });
  if (!res.ok) throw new Error(await readErr(res));
}

export async function pauseMaster(id: string, reason: string): Promise<void> {
  const res = await apiFetch(`/api/platform-admin/masters/${id}/pause`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
  if (!res.ok) throw new Error(await readErr(res));
}

export async function unpauseMaster(id: string): Promise<void> {
  const res = await apiFetch(`/api/platform-admin/masters/${id}/unpause`, { method: 'POST' });
  if (!res.ok) throw new Error(await readErr(res));
}

export async function getPlatformServices(params?: {
  filter?: string;
  q?: string;
  masterId?: string;
  limit?: number;
  offset?: number;
}): Promise<PlatformPagedResult<PlatformServiceListItem> & { services: PlatformServiceListItem[] }> {
  const q = new URLSearchParams();
  if (params?.filter) q.set('filter', params.filter);
  if (params?.q) q.set('q', params.q);
  if (params?.masterId) q.set('masterId', params.masterId);
  q.set('limit', String(params?.limit ?? PAGE_SIZE));
  q.set('offset', String(params?.offset ?? 0));
  const res = await apiFetch(`/api/platform-admin/services?${q}`);
  if (!res.ok) throw new Error(await readErr(res));
  const data = (await res.json()) as {
    services: PlatformServiceListItem[];
    items?: PlatformServiceListItem[];
    total: number;
    limit: number;
    offset: number;
  };
  const items = data.items ?? data.services;
  return { services: items, items, total: data.total, limit: data.limit, offset: data.offset };
}

export async function hideService(id: string, reason: string): Promise<void> {
  const res = await apiFetch(`/api/platform-admin/services/${id}/hide`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
  if (!res.ok) throw new Error(await readErr(res));
}

export async function unhideService(id: string): Promise<void> {
  const res = await apiFetch(`/api/platform-admin/services/${id}/unhide`, { method: 'POST' });
  if (!res.ok) throw new Error(await readErr(res));
}

export async function getPlatformBookings(params?: {
  status?: string;
  period?: string;
  q?: string;
  clientId?: string;
  limit?: number;
  offset?: number;
}): Promise<PlatformPagedResult<PlatformBookingListItem> & { bookings: PlatformBookingListItem[] }> {
  const q = new URLSearchParams();
  if (params?.status) q.set('status', params.status);
  if (params?.period) q.set('period', params.period);
  if (params?.q) q.set('q', params.q);
  if (params?.clientId) q.set('clientId', params.clientId);
  q.set('limit', String(params?.limit ?? PAGE_SIZE));
  q.set('offset', String(params?.offset ?? 0));
  const res = await apiFetch(`/api/platform-admin/bookings?${q}`);
  if (!res.ok) throw new Error(await readErr(res));
  const data = (await res.json()) as {
    bookings: PlatformBookingListItem[];
    items?: PlatformBookingListItem[];
    total: number;
    limit: number;
    offset: number;
  };
  const items = data.items ?? data.bookings;
  return { bookings: items, items, total: data.total, limit: data.limit, offset: data.offset };
}

export async function getPlatformBooking(id: string): Promise<PlatformBookingDetail> {
  const res = await apiFetch(`/api/platform-admin/bookings/${id}`);
  if (!res.ok) throw new Error(await readErr(res));
  const data = (await res.json()) as { booking: PlatformBookingDetail };
  return data.booking;
}

export async function getClientBookingStats(params?: {
  period?: 'all' | 'week' | 'month';
  minCancellations?: number;
}): Promise<PlatformClientBookingStats[]> {
  const q = new URLSearchParams();
  if (params?.period) q.set('period', params.period);
  if (params?.minCancellations != null) q.set('minCancellations', String(params.minCancellations));
  const qs = q.toString();
  const res = await apiFetch(`/api/platform-admin/bookings-clients/stats${qs ? `?${qs}` : ''}`);
  if (!res.ok) throw new Error(await readErr(res));
  const data = (await res.json()) as { clients: PlatformClientBookingStats[] };
  return data.clients;
}

export async function getAuditLogs(params?: {
  limit?: number;
  offset?: number;
}): Promise<PlatformPagedResult<PlatformAuditLogItem> & { logs: PlatformAuditLogItem[] }> {
  const q = new URLSearchParams();
  q.set('limit', String(params?.limit ?? PAGE_SIZE));
  q.set('offset', String(params?.offset ?? 0));
  const res = await apiFetch(`/api/platform-admin/audit-logs?${q}`);
  if (!res.ok) throw new Error(await readErr(res));
  const data = (await res.json()) as {
    logs: PlatformAuditLogItem[];
    items?: PlatformAuditLogItem[];
    total: number;
    limit: number;
    offset: number;
  };
  const items = data.items ?? data.logs;
  return { logs: items, items, total: data.total, limit: data.limit, offset: data.offset };
}
