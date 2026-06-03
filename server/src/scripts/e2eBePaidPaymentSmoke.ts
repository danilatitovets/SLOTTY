/**
 * Smoke: создание платежа + симуляция webhook SUCCESS (без реального bePaid API при BEPAID_ENABLED=false).
 * Запуск: npm run e2e:bepaid-payment --prefix server
 */
import { randomUUID } from 'crypto';
import { query } from '../config/db.js';
import { processBePaidWebhook } from '../modules/payments/payments.service.js';

async function main() {
  const row = await query<{ profile_id: string; master_id: string }>(
    `select mp.master_id, mp.master_id as profile_id
       from public.master_profiles mp
      limit 1`,
  );
  const masterId = row.rows[0]?.master_id;
  const profileId = row.rows[0]?.profile_id;
  if (!masterId || !profileId) {
    console.error('No master profile — skip');
    process.exit(1);
  }

  const paymentId = randomUUID();
  await query(
    `insert into public.payments (
       id, profile_id, provider, payment_type, status, amount_minor, currency,
       master_id, billing_period, tracking_id
     ) values ($1::uuid, $2::uuid, 'bepaid', 'master_pro_plan', 'pending', 3000, 'BYN', $3::uuid, 'month', $4)`,
    [paymentId, profileId, masterId, paymentId],
  );

  const webhookBody = {
    transaction: {
      uid: `test-${paymentId}`,
      status: 'successful',
      tracking_id: paymentId,
      payment_method_type: 'credit_card',
      credit_card: { brand: 'visa' },
      paid_at: new Date().toISOString(),
    },
  };

  const r1 = await processBePaidWebhook(webhookBody);
  const r2 = await processBePaidWebhook(webhookBody);

  const statusRow = await query<{ status: string }>(
    `select status from public.payments where id = $1`,
    [paymentId],
  );

  console.log('webhook runs', r1, r2, 'final status', statusRow.rows[0]?.status);
  await query(`delete from public.payment_status_events where payment_id = $1`, [paymentId]);
  await query(`delete from public.payments where id = $1`, [paymentId]);
  process.exit(statusRow.rows[0]?.status === 'success' ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
