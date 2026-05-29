import { apiFetch } from '../../../shared/api/backendClient';
import { readSlottyApiErrorMessage } from '../../../shared/api/slottyApiErrorMessage';

async function readErr(res: Response): Promise<string> {
  return readSlottyApiErrorMessage(res);
}

export type BillingPlanDto = {
  id: string;
  code: string;
  name: string;
  priceMonth: number;
  priceYear: number;
  maxServices: number | null;
  maxMonthlyAppointments: number | null;
  maxScheduleDaysAhead: number;
  canUseAnalytics: boolean;
  canUsePdf: boolean;
  canUsePriorityListing: boolean;
  sortOrder: number;
};

export type MasterSubscriptionPlanDto = {
  code: string;
  name: string;
  priceMonth: number;
  priceYear: number;
  maxServices: number | null;
  maxMonthlyAppointments: number | null;
  maxScheduleDaysAhead: number;
  canUseAnalytics: boolean;
  canUsePdf: boolean;
  canUsePriorityListing: boolean;
};

export type MasterSubscriptionDto = {
  id: string;
  masterId: string;
  status: string;
  billingPeriod: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  plan: MasterSubscriptionPlanDto;
  usage: {
    activeServices: number;
    monthlyAppointments: number;
  };
};

export async function getBillingPlans(): Promise<BillingPlanDto[]> {
  const res = await apiFetch('/api/billing/plans', { skipAuth: true });
  if (!res.ok) throw new Error(await readErr(res));
  const j = (await res.json()) as { plans?: BillingPlanDto[] };
  return j.plans ?? [];
}

export async function getMySubscription(): Promise<MasterSubscriptionDto> {
  const res = await apiFetch('/api/masters/me/subscription');
  if (!res.ok) throw new Error(await readErr(res));
  const j = (await res.json()) as { subscription: MasterSubscriptionDto };
  return j.subscription;
}

export type PromoQuoteDto = {
  promoCodeId: string;
  code: string;
  title: string | null;
  discountPercent: number;
  billingPeriod: 'month' | 'year';
  baseAmount: number;
  discountAmount: number;
  finalAmount: number;
  currency: 'BYN';
};

export async function quotePromoForCheckout(
  code: string,
  billingPeriod: 'month' | 'year',
): Promise<PromoQuoteDto> {
  const res = await apiFetch('/api/masters/me/promo-codes/quote', {
    method: 'POST',
    body: JSON.stringify({ code, billingPeriod }),
  });
  if (!res.ok) throw new Error(await readErr(res));
  const j = (await res.json()) as { quote: PromoQuoteDto };
  return j.quote;
}

export async function switchMySubscriptionMock(
  planCode: 'free' | 'pro',
  billingPeriod: 'month' | 'year',
  options?: { promoCode?: string | null },
): Promise<MasterSubscriptionDto> {
  const res = await apiFetch('/api/masters/me/subscription/mock', {
    method: 'PATCH',
    body: JSON.stringify({
      planCode,
      billingPeriod,
      promoCode: options?.promoCode?.trim() || null,
    }),
  });
  if (!res.ok) throw new Error(await readErr(res));
  const j = (await res.json()) as { subscription: MasterSubscriptionDto };
  return j.subscription;
}

export async function recordBillingCheckoutStarted(billingPeriod: 'month' | 'year'): Promise<void> {
  const res = await apiFetch('/api/masters/me/billing/checkout-started', {
    method: 'POST',
    body: JSON.stringify({ billingPeriod }),
  });
  if (!res.ok) throw new Error(await readErr(res));
}
