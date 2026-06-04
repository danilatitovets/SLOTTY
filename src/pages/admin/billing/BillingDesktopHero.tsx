import { HiCalendarDays, HiCreditCard, HiScissors } from 'react-icons/hi2';
import { planBadgeLabel } from '../../../features/billing/model/masterPlans';
import type { BillingPeriod, PlanId } from '../../../features/billing/model/masterPlans';
import { NotificationsKpiStatCard } from '../notifications/NotificationsKpiStatCard';
import { billingDesktopCard } from './adminBillingTheme';

type Props = {
  plan: PlanId;
  period: BillingPeriod;
  servicesLabel: string;
  appointmentsLabel: string;
  scheduleDays: number;
  isPro: boolean;
};

export function BillingDesktopHero({
  plan,
  period,
  servicesLabel,
  appointmentsLabel,
  scheduleDays,
  isPro,
}: Props) {
  const periodLabel = period === 'year' ? 'Годовая оплата' : 'Ежемесячная оплата';
  const description = isPro
    ? 'Полный доступ к кабинету: безлимит услуг и записей, расширенная сводка.'
    : null;

  return (
    <section className={`${billingDesktopCard} p-4 sm:p-5 lg:p-6`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-[22px] font-bold tracking-[-0.03em] text-[#111827] sm:text-[24px]">
            Мой тариф
          </h1>
          <p className="mt-1 text-[15px] font-semibold text-[#111827]">
            {planBadgeLabel(plan)}
            <span className="font-medium text-[#6B7280]"> · {periodLabel}</span>
          </p>
          {description ? (
            <p className="mt-1.5 text-[14px] font-medium leading-snug text-[#6B7280]">{description}</p>
          ) : null}
        </div>
        <span className="shrink-0 rounded-full bg-[#FFF1F4] px-3 py-1.5 text-[13px] font-semibold text-[#F47C8C] ring-1 ring-[#FDE8ED]">
          {planBadgeLabel(plan)}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-3 sm:gap-3">
        <NotificationsKpiStatCard
          label="Услуги"
          value={servicesLabel}
          hint={isPro ? 'Без ограничений' : 'На тарифе Free'}
          accentValue={!isPro}
          icon={<HiScissors className="h-5 w-5" aria-hidden />}
        />
        <NotificationsKpiStatCard
          label="Записи"
          value={appointmentsLabel}
          hint="В текущем месяце"
          icon={<HiCalendarDays className="h-5 w-5" aria-hidden />}
          accentValue={!isPro}
        />
        <NotificationsKpiStatCard
          label="График"
          value={`${scheduleDays} дн.`}
          hint="Горизонт расписания"
          icon={<HiCreditCard className="h-5 w-5" aria-hidden />}
        />
      </div>
    </section>
  );
}
