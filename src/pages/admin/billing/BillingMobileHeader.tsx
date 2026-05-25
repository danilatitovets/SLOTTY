import { HiCreditCard } from 'react-icons/hi2';
import { planBadgeLabel } from '../../../features/billing/model/masterPlans';
import type { PlanId } from '../../../features/billing/model/masterPlans';
import type { BillingPeriod } from '../../../features/billing/model/masterPlans';
import { BILLING_GRADIENT } from './adminBillingTheme';

type Props = {
  plan: PlanId;
  period: BillingPeriod;
};

export function BillingMobileHeader({ plan, period }: Props) {
  const periodLabel = period === 'year' ? 'оплата за год' : 'оплата за месяц';

  return (
    <section
      className={`overflow-hidden rounded-[22px] ${BILLING_GRADIENT} p-5 text-white shadow-[0_14px_40px_rgba(255,95,122,0.2)] lg:hidden`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[22px] font-black tracking-[-0.04em]">Мой тариф</p>
          <p className="mt-1 text-[14px] font-bold text-white/85">{periodLabel}</p>
        </div>
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] bg-white/15">
          <HiCreditCard className="h-6 w-6" aria-hidden />
        </span>
      </div>
      <p className="mt-5 text-[40px] font-black leading-none tabular-nums tracking-[-0.06em]">
        {planBadgeLabel(plan)}
      </p>
    </section>
  );
}
