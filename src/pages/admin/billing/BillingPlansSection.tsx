import type { ReactNode } from 'react';
import type { BillingPeriod, PlanId } from '../../../features/billing/model/masterPlans';
import {
  LANDING_MASTER_FREE_FEATURES,
  LANDING_MASTER_PRO_FEATURES,
  LANDING_PRO_DESCRIPTION,
  LandingPricingCard,
  LandingProTariffCard,
  landingPlanCtaClass,
  landingProCtaClass,
} from '../../../features/billing/ui/landingTariffCards';
import { PaymentLogoImage } from '../../../shared/ui/PaymentLogos/PaymentLogoImage';
import { PAYMENT_METHODS, type PaymentMethodId } from '../../../shared/ui/PaymentLogos/paymentLogosConfig';
import { BillingPeriodSwitch } from './BillingPeriodSwitch';
import { BillingUsagePanel } from './BillingUsagePanel';
import { billingDesktopCard, billingSoftNote } from './adminBillingTheme';

const BILLING_PAYMENT_METHODS: PaymentMethodId[] = ['bepaid', 'visa', 'mastercard', 'belkart'];

export type BillingPlansSectionProps = {
  plan: PlanId;
  billingPeriod: BillingPeriod;
  onPeriodChange: (period: BillingPeriod) => void;
  servicesLen: number;
  maxSvc: number;
  monthlyCount: number;
  maxAppt: number;
  scheduleHorizonDays: number;
  freePriceValue: string;
  freePriceUnit: string;
  proPriceValue: string;
  proPriceUnit: string;
  freeActive: boolean;
  proActive: boolean;
  useLiveBilling: boolean;
  showPaymentLogos?: boolean;
  proPaymentPendingBanner?: ReactNode;
  liveBillingNote?: ReactNode;
  demoNote?: ReactNode;
  onSelectFree: () => void;
  onSelectPro: () => void;
};

export function BillingPlansSection({
  plan,
  billingPeriod,
  onPeriodChange,
  servicesLen,
  maxSvc,
  monthlyCount,
  maxAppt,
  scheduleHorizonDays,
  freePriceValue,
  freePriceUnit,
  proPriceValue,
  proPriceUnit,
  freeActive,
  proActive,
  useLiveBilling,
  showPaymentLogos = false,
  proPaymentPendingBanner,
  liveBillingNote,
  demoNote,
  onSelectFree,
  onSelectPro,
}: BillingPlansSectionProps) {
  const isFree = plan === 'free';

  return (
    <section className={`${billingDesktopCard} w-full min-w-0 p-4 sm:p-5 lg:p-6`}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-[18px] font-bold tracking-[-0.03em] text-[#111827] sm:text-[20px]">
            Выберите тариф
          </h2>
          <p className="mt-1 max-w-xl text-[14px] font-medium leading-snug text-[#6B7280]">
            Сравните Free и Мастер Pro. Период оплаты и текущее использование — для перехода на Pro.
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {proPaymentPendingBanner}
        {liveBillingNote}
        {demoNote}
      </div>

      <div className="mt-5 grid w-full min-w-0 grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-5 lg:items-start">
        <LandingPricingCard
          name="Free"
          priceValue={freePriceValue}
          priceUnit={freePriceUnit}
          features={LANDING_MASTER_FREE_FEATURES}
          badge={freeActive ? 'Активен' : undefined}
          highlighted={freeActive}
          footer={
            <button
              type="button"
              disabled={freeActive}
              onClick={onSelectFree}
              className={landingPlanCtaClass(freeActive, freeActive)}
            >
              {freeActive ? 'Текущий тариф' : 'Перейти на Free'}
            </button>
          }
        />

        <div className="flex min-w-0 flex-col gap-4">
          {!proActive ? (
            <div className="w-full min-w-0 rounded-[20px] bg-white p-4 ring-1 ring-[#EEEEEE] sm:p-5">
              <BillingPeriodSwitch period={billingPeriod} onPeriod={onPeriodChange} />
              {isFree ? (
                <div className="mt-5 border-t border-[#F3F4F6] pt-5">
                  <BillingUsagePanel
                    plan="free"
                    servicesLen={servicesLen}
                    maxSvc={maxSvc}
                    monthlyCount={monthlyCount}
                    maxAppt={maxAppt}
                    scheduleHorizonDays={scheduleHorizonDays}
                    variant="compact"
                  />
                </div>
              ) : null}
            </div>
          ) : null}

          <LandingProTariffCard
            priceValue={proPriceValue}
            priceUnit={proPriceUnit}
            features={LANDING_MASTER_PRO_FEATURES}
            description={LANDING_PRO_DESCRIPTION}
            topBadge={proActive ? 'Активен' : 'Популярный'}
            denseCta
            footer={
              <button
                type="button"
                disabled={proActive}
                onClick={onSelectPro}
                className={landingProCtaClass(proActive)}
              >
                {proActive ? 'Текущий тариф' : 'Оплатить картой'}
              </button>
            }
          />

          {showPaymentLogos && useLiveBilling && !proActive ? (
            <div className={`${billingSoftNote} text-center`}>
              <p className="text-[13px] font-medium leading-snug text-[#6B7280]">
                Оплата картой · защищённая страница bePaid
              </p>
              <div className="mt-3 flex flex-wrap items-center justify-center gap-2.5">
                {PAYMENT_METHODS.filter((m) => BILLING_PAYMENT_METHODS.includes(m.id)).map((method) => (
                  <div
                    key={method.id}
                    className="flex h-10 min-w-[4.75rem] items-center justify-center rounded-xl bg-white px-3 ring-1 ring-inset ring-[#E8EAED]"
                    title={method.caption}
                  >
                    <PaymentLogoImage method={method} logoHeightClass="h-6 w-auto max-w-[5.25rem]" />
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
