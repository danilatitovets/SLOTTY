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
import { PAYMENT_METHODS } from '../../../shared/ui/PaymentLogos/paymentLogosConfig';
import { BillingPeriodSwitch } from './BillingPeriodSwitch';
import { BillingUsagePanel } from './BillingUsagePanel';
import { billingDesktopCard } from './adminBillingTheme';

const BEPAID_METHOD = PAYMENT_METHODS.find((m) => m.id === 'bepaid')!;

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
  const showBePaidOnCta = showPaymentLogos && useLiveBilling && !proActive;

  return (
    <section className={`${billingDesktopCard} w-full min-w-0 p-4 sm:p-5 lg:p-6`}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-[18px] font-bold tracking-[-0.03em] text-[#111827] sm:text-[20px]">
            Выберите тариф
          </h2>
          <p className="mt-1 max-w-xl text-[14px] font-medium leading-snug text-[#6B7280]">
            Сравните Free и Pro — период оплаты в карточке Pro, использование — в Free.
          </p>
        </div>
      </div>

      {liveBillingNote ? <div className="mt-4">{liveBillingNote}</div> : null}

      {proPaymentPendingBanner || demoNote ? (
        <div className="mt-4 space-y-3">
          {proPaymentPendingBanner}
          {demoNote}
        </div>
      ) : null}

      <div className="mt-5 grid w-full min-w-0 grid-cols-1 gap-4 lg:grid-cols-2 lg:items-stretch lg:gap-5">
        <LandingPricingCard
          className="order-2 h-full lg:order-1"
          name="Free"
          priceValue={freePriceValue}
          priceUnit={freePriceUnit}
          features={LANDING_MASTER_FREE_FEATURES}
          badge={freeActive ? 'Активен' : undefined}
          highlighted={freeActive}
          footer={
            <div className="flex flex-col gap-5">
              <button
                type="button"
                disabled={freeActive}
                onClick={onSelectFree}
                className={landingPlanCtaClass(freeActive, freeActive)}
              >
                {freeActive ? 'Текущий тариф' : 'Перейти на Free'}
              </button>
              {isFree && !proActive ? (
                <div className="border-t border-[#F3F4F6] pt-5">
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
          }
        />

        <div className="order-1 flex h-full min-w-0 flex-col lg:order-2">
          <LandingProTariffCard
            className="h-full"
            priceValue={proPriceValue}
            priceUnit={proPriceUnit}
            features={LANDING_MASTER_PRO_FEATURES}
            description={LANDING_PRO_DESCRIPTION}
            topBadge={proActive ? 'Активен' : 'Популярный'}
            denseCta
            slotAfterTitle={
              !proActive ? (
                <BillingPeriodSwitch
                  period={billingPeriod}
                  onPeriod={onPeriodChange}
                  variant="proCard"
                />
              ) : undefined
            }
            footer={
              <button
                type="button"
                disabled={proActive}
                onClick={onSelectPro}
                className={`${landingProCtaClass(proActive)} gap-2.5`}
              >
                {proActive ? (
                  'Текущий тариф'
                ) : (
                  <>
                    <span>Оплатить картой</span>
                    {showBePaidOnCta ? (
                      <PaymentLogoImage
                        method={BEPAID_METHOD}
                        logoHeightClass="h-5 w-auto max-w-[5.5rem] object-contain sm:h-6 sm:max-w-[6rem]"
                        className="shrink-0"
                      />
                    ) : null}
                  </>
                )}
              </button>
            }
          />
        </div>
      </div>
    </section>
  );
}
