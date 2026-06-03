export type PaymentProvider = 'bepaid';

export type PaymentType = 'master_pro_plan' | 'appointment_prepayment';

export type PaymentStatus =
  | 'pending'
  | 'success'
  | 'failed'
  | 'expired'
  | 'cancelled'
  | 'refunded';

export type PaymentDto = {
  id: string;
  profileId: string;
  provider: PaymentProvider;
  paymentType: PaymentType;
  status: PaymentStatus;
  amountMinor: number;
  amount: number;
  currency: string;
  masterId: string | null;
  appointmentId: string | null;
  planId: string | null;
  billingPeriod: 'month' | 'year' | null;
  trackingId: string;
  bepaidCheckoutToken: string | null;
  bepaidTransactionUid: string | null;
  bepaidRedirectUrl: string | null;
  paymentMethodBrand: string | null;
  paymentMethodType: string | null;
  errorMessage: string | null;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
  /** Только для admin detail — санитизированный payload. */
  providerPayload?: unknown;
};

export type PaymentStatusEventDto = {
  id: string;
  fromStatus: PaymentStatus | null;
  toStatus: PaymentStatus;
  source: string;
  note: string | null;
  createdAt: string;
};

export type CreateBePaidPaymentResult = {
  paymentId: string;
  provider: 'bepaid';
  status: PaymentStatus;
  checkout: {
    token: string;
    redirectUrl: string;
  };
};
