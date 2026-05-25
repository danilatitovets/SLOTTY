import type { ReactNode } from 'react';
import { HiCalendarDays, HiCreditCard, HiScissors } from 'react-icons/hi2';
import { planBadgeLabel } from '../../../features/billing/model/masterPlans';
import type { BillingPeriod, PlanId } from '../../../features/billing/model/masterPlans';
import { OverviewKpiCarousel } from '../overview/OverviewKpiBlocks';
import { NotificationsKpiStatCard } from '../notifications/NotificationsKpiStatCard';
import { BILLING_GRADIENT, billingDesktopCard } from './adminBillingTheme';

type Props = {
  plan: PlanId;
  period: BillingPeriod;
  servicesLabel: string;
  appointmentsLabel: string;
  scheduleDays: number;
  isPro: boolean;
};

function HeroShell({ children, hero }: { children: ReactNode; hero: ReactNode }) {
  return (
    <div className={`overflow-hidden ${billingDesktopCard}`}>
      {hero}
      <div className="bg-white px-3 pb-4 pt-1 sm:px-4">{children}</div>
    </div>
  );
}

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
    : 'Бесплатный старт — перейдите на Pro, когда понадобится больше возможностей.';

  return (
    <HeroShell
      hero={
        <section className={`relative overflow-hidden ${BILLING_GRADIENT} p-6 text-white lg:p-7`}>
          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-[#ff8aa0]/35 blur-3xl" />
          <div className="relative min-w-0">
            <p className="inline-flex items-center gap-2 rounded-full bg-white/12 px-4 py-2 text-[14px] font-black">
              <HiCreditCard className="h-4 w-4" aria-hidden />
              Тариф
            </p>
            <p className="mt-6 text-[52px] font-black leading-none tabular-nums tracking-[-0.08em] lg:text-[64px]">
              {planBadgeLabel(plan)}
            </p>
            <p className="mt-2 text-[15px] font-bold text-white/85">{periodLabel}</p>
            <p className="mt-4 max-w-[560px] text-[15px] font-semibold leading-relaxed text-white/80">
              {description}
            </p>
          </div>
        </section>
      }
    >
      <OverviewKpiCarousel>
        <NotificationsKpiStatCard
          label="Услуги"
          value={servicesLabel}
          hint={isPro ? 'Без ограничений' : 'На тарифе Free'}
          icon={<HiScissors className="h-5 w-5" aria-hidden />}
          accentValue={!isPro}
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
      </OverviewKpiCarousel>
    </HeroShell>
  );
}
