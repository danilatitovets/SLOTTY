import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { BillingPeriod } from '../../../features/billing/model/masterPlans';
import { createBePaidPayment } from '../../../features/payments/api/bepaidApi';
import { LEGAL_PAYMENT_PATH, LEGAL_REFUND_PATH, PAYMENT_SUCCESS_PATH } from '../../../app/paths';
import { readPublicAppOrigin } from '../../../shared/lib/masterBookingLink';
import { billingPinkBtn, billingSoftNote } from './adminBillingTheme';

type Props = {
  billingPeriod: BillingPeriod;
  disabled?: boolean;
};

export function ProBePaidPaymentBlock({ billingPeriod, disabled }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePay() {
    setLoading(true);
    setError(null);
    try {
      const origin = readPublicAppOrigin();
      const returnUrl = `${origin}${PAYMENT_SUCCESS_PATH}?from=pro`;
      const result = await createBePaidPayment({
        type: 'MASTER_PRO_PLAN',
        billingPeriod,
        currency: 'BYN',
        returnUrl,
      });
      const url = result.checkout?.redirectUrl?.trim();
      if (!url) {
        setError('Не получена ссылка на оплату. Попробуйте позже.');
        return;
      }
      window.location.assign(url);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Не удалось создать платёж';
      if (msg.includes('временно недоступна') || msg.includes('BEPAID_DISABLED')) {
        setError('Онлайн-оплата временно недоступна');
      } else if (msg.includes('уже активен') || msg.includes('PRO_ALREADY_ACTIVE')) {
        setError('Тариф Pro уже активен');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="space-y-3 rounded-[20px] bg-[#F9FAFB] p-4 ring-1 ring-[#E5E7EB]">
      <h4 className="text-[15px] font-bold text-[#111827]">Оплата картой (bePaid)</h4>
      <p className="text-[14px] leading-relaxed text-[#374151]">
        Оплатите Pro банковской картой на защищённой странице bePaid. Тариф активируется после
        подтверждения платежа автоматически (webhook), а не сразу после возврата на сайт.
      </p>
      <button
        type="button"
        disabled={disabled || loading}
        onClick={() => void handlePay()}
        className={`w-full min-h-12 ${billingPinkBtn} disabled:opacity-50`}
      >
        {loading ? 'Создаём платёж…' : 'Оплатить Pro через bePaid'}
      </button>
      {error ? (
        <p className="rounded-[14px] bg-[#FEF2F2] px-3 py-2 text-[13px] font-medium text-[#DC2626]">
          {error}
        </p>
      ) : null}
      <p className={billingSoftNote}>
        <Link to={LEGAL_PAYMENT_PATH} className="font-semibold text-[#E29595] hover:underline">
          Правила оплаты
        </Link>
        {' · '}
        <Link to={LEGAL_REFUND_PATH} className="font-semibold text-[#E29595] hover:underline">
          Возврат средств
        </Link>
      </p>
    </section>
  );
}
