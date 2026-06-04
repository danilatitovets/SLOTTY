import { apiFetch, getApiBaseUrl } from '../../../../../shared/api/backendClient';
import { readSlottyApiErrorMessage } from '../../../../../shared/api/slottyApiErrorMessage';

export type SupportSystemStatusResponse = {
  status: 'operational' | 'degraded' | 'partial_outage' | 'maintenance';
  label: string;
  static: boolean;
  checkedAt: string;
  affectedCount?: number;
};

export type SupportAccountContext = {
  userId: string;
  email: string | null;
  masterProfileName: string;
  plan: string;
  planCode: string;
  subscriptionStatus: string | null;
  telegramLinked: boolean;
  telegramUsername: string | null;
  linkedProviders: { telegram: boolean; google: boolean; email: boolean };
};

export type SupportTicketSummary = {
  id: string;
  ticketCode: string;
  category: string;
  severity: string;
  subject: string;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export type SupportTicketDetail = SupportTicketSummary & {
  message: string;
  affectedServices: string[];
  preferredContactChannel: string;
  contactEmail: string | null;
  events: Array<{
    id: string;
    eventType: string;
    actorRole: string;
    message: string | null;
    createdAt: string;
  }>;
  attachments: Array<{ id: string; fileName: string; mimeType: string; sizeBytes: number }>;
};

export type CreateSupportTicketPayload = {
  category: string;
  severity: string;
  subject: string;
  affectedServices: string[];
  relatedBookingCode?: string | null;
  relatedPaymentId?: string | null;
  message: string;
  preferredContactChannel: string;
  contactEmail?: string | null;
  consentAccepted: true;
  clientMetadata?: Record<string, unknown>;
};

async function readErr(res: Response): Promise<string> {
  return readSlottyApiErrorMessage(res);
}

export function isSupportApiAvailable(): boolean {
  return Boolean(getApiBaseUrl());
}

export async function fetchSupportSystemStatus(): Promise<SupportSystemStatusResponse> {
  const res = await apiFetch('/api/support/status');
  if (!res.ok) throw new Error(await readErr(res));
  return (await res.json()) as SupportSystemStatusResponse;
}

export async function fetchSupportAccountContext(): Promise<SupportAccountContext> {
  const res = await apiFetch('/api/support/account-context');
  if (!res.ok) throw new Error(await readErr(res));
  return (await res.json()) as SupportAccountContext;
}

export async function fetchSupportTickets(params?: { limit?: number; offset?: number }) {
  const q = new URLSearchParams();
  if (params?.limit) q.set('limit', String(params.limit));
  if (params?.offset) q.set('offset', String(params.offset));
  const res = await apiFetch(`/api/support/tickets?${q}`);
  if (!res.ok) throw new Error(await readErr(res));
  return (await res.json()) as {
    tickets: SupportTicketSummary[];
    total: number;
    limit: number;
    offset: number;
  };
}

export async function fetchSupportTicket(ticketCode: string): Promise<SupportTicketDetail> {
  const res = await apiFetch(`/api/support/tickets/${encodeURIComponent(ticketCode)}`);
  if (!res.ok) throw new Error(await readErr(res));
  const data = (await res.json()) as { ticket: SupportTicketDetail };
  return data.ticket;
}

export async function createSupportTicket(payload: CreateSupportTicketPayload): Promise<SupportTicketDetail> {
  const res = await apiFetch('/api/support/tickets', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await readErr(res));
  const data = (await res.json()) as { ticket: SupportTicketDetail };
  return data.ticket;
}

export function buildSupportClientMetadata(): Record<string, unknown> {
  if (typeof window === 'undefined') return {};
  return {
    currentRoute: window.location.pathname,
    frontendUrl: window.location.href,
    userAgent: navigator.userAgent,
    appVersion: import.meta.env.VITE_APP_VERSION ?? null,
    build: import.meta.env.MODE,
    language: navigator.language,
    viewport: `${window.innerWidth}x${window.innerHeight}`,
  };
}
