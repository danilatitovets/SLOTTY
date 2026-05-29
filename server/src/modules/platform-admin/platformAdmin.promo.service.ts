import { query } from '../../config/db.js';
import { ApiError } from '../../utils/ApiError.js';
import { writeAdminAuditLog } from './auditLog.service.js';

export type PromoCodeAdminDto = {
  id: string;
  code: string;
  title: string | null;
  discountPercent: number;
  appliesToPlan: string;
  billingPeriod: 'month' | 'year' | null;
  maxRedemptions: number | null;
  redemptionCount: number;
  validFrom: string | null;
  validUntil: string | null;
  isActive: boolean;
  createdAt: string;
};

function mapPromoRow(row: {
  id: string;
  code: string;
  title: string | null;
  discount_percent: number;
  applies_to_plan: string;
  billing_period: string | null;
  max_redemptions: number | null;
  redemption_count: number;
  valid_from: Date | string | null;
  valid_until: Date | string | null;
  is_active: boolean;
  created_at: Date | string;
}): PromoCodeAdminDto {
  return {
    id: row.id,
    code: row.code,
    title: row.title,
    discountPercent: row.discount_percent,
    appliesToPlan: row.applies_to_plan,
    billingPeriod: row.billing_period === 'month' || row.billing_period === 'year' ? row.billing_period : null,
    maxRedemptions: row.max_redemptions,
    redemptionCount: row.redemption_count,
    validFrom: row.valid_from ? new Date(row.valid_from).toISOString() : null,
    validUntil: row.valid_until ? new Date(row.valid_until).toISOString() : null,
    isActive: row.is_active,
    createdAt: new Date(row.created_at).toISOString(),
  };
}

export async function listPromoCodesForAdmin(): Promise<PromoCodeAdminDto[]> {
  const r = await query(
    `select id, code, title, discount_percent, applies_to_plan, billing_period::text as billing_period,
            max_redemptions, redemption_count, valid_from, valid_until, is_active, created_at
       from public.promo_codes
      order by created_at desc`,
  );
  return r.rows.map((row) => mapPromoRow(row as Parameters<typeof mapPromoRow>[0]));
}

export async function createPromoCodeForAdmin(
  adminUserId: string,
  body: {
    code: string;
    title?: string | null;
    discountPercent: number;
    billingPeriod?: 'month' | 'year' | null;
    maxRedemptions?: number | null;
    validFrom?: string | null;
    validUntil?: string | null;
  },
): Promise<PromoCodeAdminDto> {
  const code = body.code.trim().toUpperCase();
  if (code.length < 3) throw ApiError.badRequest('Код не короче 3 символов', 'validation_error');
  if (body.discountPercent < 1 || body.discountPercent > 100) {
    throw ApiError.badRequest('Скидка от 1 до 100%', 'validation_error');
  }

  const dup = await query(`select 1 from public.promo_codes where upper(trim(code)) = $1`, [code]);
  if (dup.rowCount) throw ApiError.conflict('Такой промокод уже есть', 'PROMO_EXISTS');

  const ins = await query(
    `insert into public.promo_codes (
       code, title, discount_percent, applies_to_plan, billing_period,
       max_redemptions, valid_from, valid_until, is_active, created_by
     ) values ($1, $2, $3, 'pro', $4::public.billing_period, $5, $6, $7, true, $8)
     returning id, code, title, discount_percent, applies_to_plan, billing_period::text as billing_period,
               max_redemptions, redemption_count, valid_from, valid_until, is_active, created_at`,
    [
      code,
      body.title?.trim() || null,
      body.discountPercent,
      body.billingPeriod ?? null,
      body.maxRedemptions ?? null,
      body.validFrom ? new Date(body.validFrom) : null,
      body.validUntil ? new Date(body.validUntil) : null,
      adminUserId,
    ],
  );
  const row = ins.rows[0]!;
  const mapped = mapPromoRow(row as Parameters<typeof mapPromoRow>[0]);

  await writeAdminAuditLog({
    adminUserId,
    action: 'promo_code_created',
    entityType: 'promo_code',
    entityId: mapped.id,
    reason: mapped.title,
    metadata: { code: mapped.code, discountPercent: mapped.discountPercent },
  });

  return mapped;
}

export async function setPromoCodeActiveForAdmin(
  adminUserId: string,
  promoId: string,
  isActive: boolean,
): Promise<void> {
  const r = await query(
    `update public.promo_codes set is_active = $2, updated_at = now() where id = $1 returning code`,
    [promoId, isActive],
  );
  if (!r.rowCount) throw ApiError.notFound('Промокод не найден');

  await writeAdminAuditLog({
    adminUserId,
    action: isActive ? 'promo_code_activated' : 'promo_code_deactivated',
    entityType: 'promo_code',
    entityId: promoId,
    metadata: { code: r.rows[0]?.code },
  });
}
