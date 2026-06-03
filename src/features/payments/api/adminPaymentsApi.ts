import { apiFetch } from '../../../shared/api/backendClient';
import { readSlottyApiErrorMessage } from '../../../shared/api/slottyApiErrorMessage';

export type AdminPaymentRow = {
  id: string;
  profileId: string;
  provider: string;
  paymentType: string;
  status: string;
  amountMinor: number;
  amount: number;
  currency: string;
  masterId: string | null;
  appointmentId: string | null;
  trackingId: string;
  bepaidTransactionUid: string | null;
  userDisplayName: string | null;
  userEmail: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AdminPaymentListResult = {
  payments: AdminPaymentRow[];
  total: number;
};

export async function listAdminPayments(params: {
  status?: string;
  type?: string;
  page?: number;
  pageSize?: number;
}): Promise<AdminPaymentListResult> {
  const q = new URLSearchParams();
  if (params.status) q.set('status', params.status);
  if (params.type) q.set('type', params.type);
  if (params.page) q.set('page', String(params.page));
  if (params.pageSize) q.set('pageSize', String(params.pageSize));
  const res = await apiFetch(`/api/admin/payments?${q}`);
  if (!res.ok) throw new Error(await readSlottyApiErrorMessage(res));
  return (await res.json()) as AdminPaymentListResult;
}

export async function getAdminPaymentDetail(id: string): Promise<{
  payment: AdminPaymentRow & { errorMessage?: string | null; providerPayload?: unknown };
  events: { id: string; fromStatus: string | null; toStatus: string; source: string; createdAt: string }[];
}> {
  const res = await apiFetch(`/api/admin/payments/${id}`);
  if (!res.ok) throw new Error(await readSlottyApiErrorMessage(res));
  return (await res.json()) as {
    payment: AdminPaymentRow & { errorMessage?: string | null; providerPayload?: unknown };
    events: { id: string; fromStatus: string | null; toStatus: string; source: string; createdAt: string }[];
  };
}
