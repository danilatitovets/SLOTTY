import { query } from '../../config/db.js';

export type BillingEventType =
  | 'checkout_started'
  | 'checkout_cancelled'
  | 'plan_changed'
  | 'pro_interest'
  | 'payment_failed';

export type BillingEventTypeInput = BillingEventType | string;

export type RecordBillingEventParams = {
  masterId: string;
  eventType: BillingEventTypeInput;
  planCode?: string | null;
  billingPeriod?: 'month' | 'year' | null;
  amount?: number | null;
  status?: string;
  source?: string;
  errorMessage?: string | null;
  metadata?: Record<string, unknown> | null;
};

export async function recordBillingEvent(params: RecordBillingEventParams): Promise<void> {
  await query(
    `insert into public.subscription_billing_events (
       master_id, event_type, plan_code, billing_period, amount, status, source, error_message, metadata
     ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb)`,
    [
      params.masterId,
      params.eventType,
      params.planCode ?? null,
      params.billingPeriod ?? null,
      params.amount ?? null,
      params.status ?? 'recorded',
      params.source ?? 'system',
      params.errorMessage ?? null,
      params.metadata ? JSON.stringify(params.metadata) : null,
    ],
  );
}

export async function listBillingEventsForMaster(
  masterId: string,
  limit = 50,
): Promise<
  Array<{
    id: string;
    eventType: string;
    planCode: string | null;
    billingPeriod: string | null;
    amount: number | null;
    currency: string;
    status: string;
    source: string;
    errorMessage: string | null;
    metadata: Record<string, unknown> | null;
    createdAt: string;
  }>
> {
  const r = await query<{
    id: string;
    event_type: string;
    plan_code: string | null;
    billing_period: string | null;
    amount: string | null;
    currency: string;
    status: string;
    source: string;
    error_message: string | null;
    metadata: Record<string, unknown> | null;
    created_at: Date | string;
  }>(
    `select id, event_type, plan_code, billing_period, amount::text, currency, status, source,
            error_message, metadata, created_at
       from public.subscription_billing_events
      where master_id = $1
      order by created_at desc
      limit $2`,
    [masterId, limit],
  );
  return r.rows.map((row) => ({
    id: row.id,
    eventType: row.event_type,
    planCode: row.plan_code,
    billingPeriod: row.billing_period,
    amount: row.amount != null ? Number(row.amount) : null,
    currency: row.currency,
    status: row.status,
    source: row.source,
    errorMessage: row.error_message,
    metadata: row.metadata,
    createdAt: new Date(row.created_at).toISOString(),
  }));
}
