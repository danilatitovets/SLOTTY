import { apiFetch } from '../../../shared/api/backendClient';
import { readSlottyApiErrorMessage } from '../../../shared/api/slottyApiErrorMessage';

async function readErr(res: Response): Promise<string> {
  return readSlottyApiErrorMessage(res);
}

export type ProManualPaymentStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';
export type MasterProCabinetStatus = 'free' | 'pending' | 'active' | 'expired';

export type ManualPaymentConfigDto = {
  configured: boolean;
  recipientFullName: string;
  bankName: string;
  iban: string | null;
  bic: string;
  currency: string;
  proAmount: number;
  paymentPurposeTemplate: string;
  paymentPurpose: string;
  feeCoveredBy: 'slotty';
  configMessage: string | null;
};

export type ProManualPaymentRequestDto = {
  id: string;
  status: ProManualPaymentStatus;
  payerFullName: string;
  tariffAmount: number;
  declaredPaidAmount: number;
  receivedAmount: number | null;
  bankFeeAmount: number | null;
  feeCoveredBy: string;
  currency: string;
  billingPeriod: 'month' | 'year';
  paidAt: string | null;
  paymentComment: string;
  receiptUrl: string | null;
  receiptFilePath: string | null;
  adminNote: string | null;
  rejectionReason: string | null;
  taxReceiptCreated: boolean;
  taxReceiptNote: string | null;
  createdAt: string;
  reviewedAt: string | null;
};

export type ProManualPaymentCabinetState = {
  pendingRequest: ProManualPaymentRequestDto | null;
  lastResolvedRequest: ProManualPaymentRequestDto | null;
  requestHistory: ProManualPaymentRequestDto[];
  canSubmitNew: boolean;
  tariffAmount: number;
  currency: string;
  billingPeriod: 'month' | 'year';
  paymentConfig: ManualPaymentConfigDto;
  subscriptionMockAllowed: boolean;
  proStatus: MasterProCabinetStatus;
  proExpiresAt: string | null;
  proStartedAt: string | null;
  planCode: string;
};

export async function getManualPaymentConfig(): Promise<ManualPaymentConfigDto> {
  const res = await apiFetch('/api/masters/me/billing/manual-payment-config');
  if (!res.ok) throw new Error(await readErr(res));
  const j = (await res.json()) as { config: ManualPaymentConfigDto };
  return j.config;
}

export async function getProManualPaymentState(
  billingPeriod: 'month' | 'year',
): Promise<ProManualPaymentCabinetState> {
  const q = new URLSearchParams({ billingPeriod });
  const res = await apiFetch(`/api/masters/me/pro-payment/state?${q}`);
  if (!res.ok) throw new Error(await readErr(res));
  return (await res.json()) as ProManualPaymentCabinetState;
}

export type CreateProManualPaymentBody = {
  payerFullName: string;
  declaredPaidAmount: number;
  billingPeriod: 'month' | 'year';
  paidAt: string;
  paymentComment: string;
  receiptUrl?: string | null;
  receiptFilePath?: string | null;
  confirmationChecked: true;
};

export async function createProManualPaymentRequest(
  body: CreateProManualPaymentBody,
): Promise<ProManualPaymentRequestDto> {
  const res = await apiFetch('/api/masters/me/billing/manual-payment-requests', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await readErr(res));
  const j = (await res.json()) as { request: ProManualPaymentRequestDto };
  return j.request;
}

export async function uploadProPaymentReceipt(file: File): Promise<{ publicUrl: string; storagePath: string }> {
  const form = new FormData();
  form.append('receipt', file);
  const res = await apiFetch('/api/masters/me/billing/manual-payment-requests/receipt', {
    method: 'POST',
    body: form,
  });
  if (!res.ok) throw new Error(await readErr(res));
  const j = (await res.json()) as { receipt: { publicUrl: string; storagePath: string } };
  return j.receipt;
}

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export { todayIsoDate };
