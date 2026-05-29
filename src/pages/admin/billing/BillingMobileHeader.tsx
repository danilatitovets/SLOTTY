import { planBadgeLabel } from '../../../features/billing/model/masterPlans';
import type { PlanId } from '../../../features/billing/model/masterPlans';
import type { BillingPeriod } from '../../../features/billing/model/masterPlans';

type Props = {
  plan: PlanId;
  period: BillingPeriod;
};

export function BillingMobileHeader({ plan, period }: Props) {
  const periodLabel = period === 'year' ? 'Годовая оплата' : 'Ежемесячная оплата';

  return (
    <header className="lg:hidden">
      <h1 className="text-[22px] font-bold tracking-[-0.03em] text-[#111827]">Мой тариф</h1>
      <p className="mt-1 text-[15px] font-semibold text-[#111827]">
        {planBadgeLabel(plan)}
        <span className="font-medium text-[#6B7280]"> · {periodLabel}</span>
      </p>
    </header>
  );
}
