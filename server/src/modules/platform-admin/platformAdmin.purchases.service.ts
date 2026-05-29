import { query } from '../../config/db.js';

export type PlatformPurchaseRow = {
  id: string;
  masterId: string;
  masterName: string;
  eventType: string;
  planCode: string | null;
  billingPeriod: string | null;
  amount: number | null;
  currency: string;
  status: string;
  source: string;
  promoCode: string | null;
  baseAmount: number | null;
  discountAmount: number | null;
  createdAt: string;
};

export type PlatformPurchasesSummary = {
  totalRevenue: number;
  purchasesCount: number;
  withPromoCount: number;
  totalDiscountGiven: number;
  revenueThisMonth: number;
  purchasesThisMonth: number;
};

function parseMetaAmount(meta: Record<string, unknown> | null, key: string): number | null {
  const v = meta?.[key];
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  return null;
}

function parseMetaString(meta: Record<string, unknown> | null, key: string): string | null {
  const v = meta?.[key];
  return typeof v === 'string' && v.trim() ? v.trim() : null;
}

export async function listPlatformPurchases(params?: {
  limit?: number;
  offset?: number;
}): Promise<{ purchases: PlatformPurchaseRow[]; total: number }> {
  const limit = Math.min(params?.limit ?? 50, 100);
  const offset = params?.offset ?? 0;

  const countR = await query<{ total: string }>(
    `select count(*)::text as total
       from public.subscription_billing_events e
      where e.event_type in ('subscription_purchased', 'plan_changed')
        and coalesce(e.amount, 0) > 0`,
  );
  const total = Number(countR.rows[0]?.total ?? 0);

  const r = await query<
    {
      id: string;
      master_id: string;
      display_name: string;
      event_type: string;
      plan_code: string | null;
      billing_period: string | null;
      amount: string | null;
      currency: string;
      status: string;
      source: string;
      metadata: Record<string, unknown> | null;
      created_at: Date | string;
    }
  >(
    `select e.id, e.master_id, coalesce(mp.display_name, 'Мастер') as display_name,
            e.event_type, e.plan_code, e.billing_period, e.amount::text, e.currency, e.status, e.source,
            e.metadata, e.created_at
       from public.subscription_billing_events e
       join public.master_profiles mp on mp.master_id = e.master_id
      where e.event_type in ('subscription_purchased', 'plan_changed')
        and coalesce(e.amount, 0) > 0
      order by e.created_at desc
      limit $1 offset $2`,
    [limit, offset],
  );

  const purchases: PlatformPurchaseRow[] = r.rows.map((row) => {
    const meta = row.metadata;
    return {
      id: row.id,
      masterId: row.master_id,
      masterName: row.display_name,
      eventType: row.event_type,
      planCode: row.plan_code,
      billingPeriod: row.billing_period,
      amount: row.amount != null ? Number(row.amount) : null,
      currency: row.currency,
      status: row.status,
      source: row.source,
      promoCode: parseMetaString(meta, 'promoCode'),
      baseAmount: parseMetaAmount(meta, 'baseAmount'),
      discountAmount: parseMetaAmount(meta, 'discountAmount'),
      createdAt: new Date(row.created_at).toISOString(),
    };
  });

  return { purchases, total };
}

export async function getPlatformPurchasesSummary(): Promise<PlatformPurchasesSummary> {
  const paidR = await query<{
    total_revenue: string;
    purchases_count: string;
    with_promo: string;
    revenue_month: string;
    purchases_month: string;
  }>(
    `select
       coalesce(sum(e.amount) filter (where e.status = 'succeeded'), 0)::text as total_revenue,
       count(*) filter (where e.status = 'succeeded')::text as purchases_count,
       count(*) filter (
         where e.status = 'succeeded' and e.metadata ? 'promoCode'
       )::text as with_promo,
       coalesce(sum(e.amount) filter (
         where e.status = 'succeeded'
           and e.created_at >= date_trunc('month', now())
       ), 0)::text as revenue_month,
       count(*) filter (
         where e.status = 'succeeded'
           and e.created_at >= date_trunc('month', now())
       )::text as purchases_month
     from public.subscription_billing_events e
    where e.event_type in ('subscription_purchased', 'plan_changed')
      and coalesce(e.amount, 0) > 0`,
  );
  const row = paidR.rows[0]!;

  const discountR = await query<{ total: string }>(
    `select coalesce(sum(discount_amount), 0)::text as total
       from public.promo_code_redemptions`,
  );

  return {
    totalRevenue: Number(row.total_revenue),
    purchasesCount: Number(row.purchases_count),
    withPromoCount: Number(row.with_promo),
    totalDiscountGiven: Number(discountR.rows[0]?.total ?? 0),
    revenueThisMonth: Number(row.revenue_month),
    purchasesThisMonth: Number(row.purchases_month),
  };
}
