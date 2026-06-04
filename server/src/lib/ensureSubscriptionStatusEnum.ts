import { query } from '../config/db.js';

const EXTENDED_STATUSES = [
  'canceled_at_period_end',
  'payment_failed',
  'expired',
] as const;

let ensured = false;

/** Добавляет значения SaaS-подписки в enum (миграция 060), если БД ещё на базовой схеме. */
export async function ensureSubscriptionStatusEnum(): Promise<void> {
  if (ensured) return;
  for (const value of EXTENDED_STATUSES) {
    await query(
      `alter type public.subscription_status add value if not exists '${value}'`,
    );
  }
  ensured = true;
}
