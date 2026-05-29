import { query } from '../../config/db.js';
import { ApiError } from '../../utils/ApiError.js';

export type PromoCodeRow = {
  id: string;
  code: string;
  title: string | null;
  discount_percent: number;
  applies_to_plan: string;
  billing_period: 'month' | 'year' | null;
  max_redemptions: number | null;
  redemption_count: number;
  valid_from: Date | string | null;
  valid_until: Date | string | null;
  is_active: boolean;
  created_at: Date | string;
};

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

function normalizeCode(raw: string): string {
  return raw.trim().toUpperCase();
}

export async function getProPlanPrices(): Promise<{ priceMonth: number; priceYear: number }> {
  const r = await query<{ price_month: string; price_year: string }>(
    `select price_month::text, price_year::text
       from public.subscription_plans
      where code = 'pro' and is_active = true
      limit 1`,
  );
  const row = r.rows[0];
  if (!row) throw ApiError.internal('Тариф Pro не найден');
  return { priceMonth: Number(row.price_month), priceYear: Number(row.price_year) };
}

function baseAmountForPeriod(prices: { priceMonth: number; priceYear: number }, period: 'month' | 'year') {
  return period === 'year' ? prices.priceYear : prices.priceMonth;
}

function computeDiscount(base: number, percent: number): { discount: number; final: number } {
  const discount = Math.round(base * (percent / 100) * 100) / 100;
  const final = Math.max(0, Math.round((base - discount) * 100) / 100);
  return { discount, final };
}

export async function loadPromoByCode(codeRaw: string): Promise<PromoCodeRow | null> {
  const code = normalizeCode(codeRaw);
  if (!code) return null;
  const r = await query<PromoCodeRow>(
    `select id, code, title, discount_percent, applies_to_plan, billing_period::text as billing_period,
            max_redemptions, redemption_count, valid_from, valid_until, is_active, created_at
       from public.promo_codes
      where upper(trim(code)) = $1`,
    [code],
  );
  return r.rows[0] ?? null;
}

export function assertPromoApplicable(
  row: PromoCodeRow,
  billingPeriod: 'month' | 'year',
  planCode: string = 'pro',
): void {
  if (!row.is_active) {
    throw ApiError.badRequest('Промокод недействителен', 'PROMO_INACTIVE');
  }
  const now = Date.now();
  if (row.valid_from && new Date(row.valid_from).getTime() > now) {
    throw ApiError.badRequest('Промокод ещё не активен', 'PROMO_NOT_STARTED');
  }
  if (row.valid_until && new Date(row.valid_until).getTime() < now) {
    throw ApiError.badRequest('Срок действия промокода истёк', 'PROMO_EXPIRED');
  }
  if (row.applies_to_plan !== planCode) {
    throw ApiError.badRequest('Промокод не подходит к этому тарифу', 'PROMO_WRONG_PLAN');
  }
  if (row.billing_period && row.billing_period !== billingPeriod) {
    throw ApiError.badRequest(
      `Промокод действует только для оплаты за ${row.billing_period === 'year' ? 'год' : 'месяц'}`,
      'PROMO_WRONG_PERIOD',
    );
  }
  if (row.max_redemptions != null && row.redemption_count >= row.max_redemptions) {
    throw ApiError.badRequest('Лимит использований промокода исчерпан', 'PROMO_LIMIT_REACHED');
  }
}

export async function quotePromoForCheckout(
  codeRaw: string,
  billingPeriod: 'month' | 'year',
  planCode: 'pro' = 'pro',
): Promise<PromoQuoteDto> {
  const row = await loadPromoByCode(codeRaw);
  if (!row) {
    throw ApiError.badRequest('Промокод не найден', 'PROMO_NOT_FOUND');
  }
  assertPromoApplicable(row, billingPeriod, planCode);

  const prices = await getProPlanPrices();
  const baseAmount = baseAmountForPeriod(prices, billingPeriod);
  const { discount, final } = computeDiscount(baseAmount, row.discount_percent);

  return {
    promoCodeId: row.id,
    code: row.code,
    title: row.title,
    discountPercent: row.discount_percent,
    billingPeriod,
    baseAmount,
    discountAmount: discount,
    finalAmount: final,
    currency: 'BYN',
  };
}

export async function recordPromoRedemption(params: {
  promoCodeId: string;
  masterId: string;
  billingPeriod: 'month' | 'year';
  baseAmount: number;
  discountAmount: number;
  finalAmount: number;
}): Promise<string> {
  const ins = await query<{ id: string }>(
    `insert into public.promo_code_redemptions (
       promo_code_id, master_id, billing_period, base_amount, discount_amount, final_amount
     ) values ($1, $2, $3::public.billing_period, $4, $5, $6)
     returning id`,
    [
      params.promoCodeId,
      params.masterId,
      params.billingPeriod,
      params.baseAmount,
      params.discountAmount,
      params.finalAmount,
    ],
  );
  await query(
    `update public.promo_codes
        set redemption_count = redemption_count + 1, updated_at = now()
      where id = $1`,
    [params.promoCodeId],
  );
  const id = ins.rows[0]?.id;
  if (!id) throw ApiError.internal('Не удалось сохранить применение промокода');
  return id;
}
