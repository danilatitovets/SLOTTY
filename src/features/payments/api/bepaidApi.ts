import { apiFetch } from '../../../shared/api/backendClient';
import { readSlottyApiErrorMessage } from '../../../shared/api/slottyApiErrorMessage';

export type CreateBePaidPaymentBody = {
  type: 'MASTER_PRO_PLAN' | 'APPOINTMENT_PREPAYMENT';
  amount?: number;
  currency?: string;
  appointmentId?: string;
  planId?: string;
  billingPeriod?: 'month' | 'year';
  returnUrl?: string;
};

export type CreateBePaidPaymentResponse = {
  paymentId: string;
  provider: 'bepaid';
  status: string;
  checkout: {
    token: string;
    redirectUrl: string;
  };
};

export async function createBePaidPayment(
  body: CreateBePaidPaymentBody,
): Promise<CreateBePaidPaymentResponse> {
  const res = await apiFetch('/api/payments/bepaid/create', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await readSlottyApiErrorMessage(res));
  return (await res.json()) as CreateBePaidPaymentResponse;
}

export type PaymentDto = {
  id: string;
  status: string;
  paymentType: string;
  amount: number;
  currency: string;
  bepaidRedirectUrl: string | null;
};

export async function getPaymentById(paymentId: string): Promise<{ payment: PaymentDto }> {
  const res = await apiFetch(`/api/payments/${paymentId}`);
  if (!res.ok) throw new Error(await readSlottyApiErrorMessage(res));
  return (await res.json()) as { payment: PaymentDto };
}
