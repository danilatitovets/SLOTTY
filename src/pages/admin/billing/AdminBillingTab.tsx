import { useCallback, useEffect, useMemo, useState } from 'react';
import type { BillingPeriod, MasterPlanState, PlanId } from '../../../features/billing/model/masterPlans';
import {
  countAppointmentsInCurrentMonth,
  formatPlanPrice,
  getCurrentMasterPlan,
  getPlanLimits,
  priceForPlan,
  saveCurrentMasterPlan,
} from '../../../features/billing/model/masterPlans';
import {
  getBillingPlans,
  quotePromoForCheckout,
  recordBillingCheckoutStarted,
  switchMySubscriptionMock,
  type BillingPlanDto,
  type PromoQuoteDto,
} from '../../../features/admin/api/adminBillingApi';
import { getMasterDraft } from '../../../features/master/model/masterDraftStorage';
import { ensureDemoAppointmentsSeeded } from '../../../features/master/model/demoMasterAppointments';
import { AdminBottomSheet } from '../shared/AdminBottomSheet';
import { AdminToast } from '../shared/AdminToast';
import { useAdminToast } from '../shared/useAdminToast';
import { LoadingVideo } from '../../../shared/ui/LoadingVideo';
import { useAdminMasterCabinet } from '../AdminMasterCabinetContext';
import { BillingDesktopHero } from './BillingDesktopHero';
import {
  LANDING_MASTER_PRO_FEATURES,
  LANDING_PRO_DESCRIPTION,
  LandingPricingCard,
  LandingProTariffCard,
  landingPlanCtaClass,
  landingProCtaClass,
} from '../../../features/billing/ui/landingTariffCards';
import { BillingMobileHeader } from './BillingMobileHeader';
import { BillingPeriodSwitch } from './BillingPeriodSwitch';
import { BillingUsagePanel } from './BillingUsagePanel';
import {
  billingErrorBanner,
  billingListTray,
  billingOutlineBtn,
  billingPinkBtn,
  billingShellCard,
  billingSoftNote,
  BILLING_PAGE_BG,
} from './adminBillingTheme';

function planCodeToPlanId(code: string): PlanId {
  return code === 'pro' ? 'pro' : 'free';
}

function formatPriceFromPlans(plans: BillingPlanDto[], planId: PlanId, period: BillingPeriod): string {
  const p = plans.find((x) => x.code === planId);
  if (!p) return formatPlanPrice(planId, period);
  if (p.code === 'free') return '0 BYN / месяц';
  const n = period === 'year' ? p.priceYear : p.priceMonth;
  const unit = period === 'year' ? 'год' : 'месяц';
  return `${n} BYN / ${unit}`;
}

function splitPlanPrice(line: string): { value: string; unit: string } {
  const idx = line.indexOf(' / ');
  if (idx === -1) return { value: line, unit: '' };
  return { value: line.slice(0, idx), unit: line.slice(idx + 1) };
}

const PLAN_UI: Record<
  PlanId,
  {
    name: string;
    tagline: string;
    includes: string[];
    limits: string[];
  }
> = {
  free: {
    name: 'Free',
    tagline: 'Попробуйте SLOTTY бесплатно',
    includes: [
      'Профиль мастера',
      'До 3 услуг',
      'До 20 записей в месяц',
      'График работы на 30 дней',
      'Базовая сводка',
      'Заявки клиентов',
      'Ручное управление записями',
    ],
    limits: [
      'Не больше 3 услуг',
      'После 20 записей в месяц — предложение перейти на Pro',
      'Нет расширенной аналитики',
      'Нет командной работы',
    ],
  },
  pro: {
    name: 'Мастер Pro',
    tagline: 'Для активной работы: безлимит записей, расширенная сводка и полный кабинет.',
    includes: [
      'Всё из Free',
      'Безлимит услуг и записей',
      'График работы на 365 дней',
      'Расширенная сводка',
      'История клиентов',
      'Напоминания клиентам',
      'Приоритет в поиске',
      'Предпросмотр профиля',
      'Быстрые действия с заявками',
    ],
    limits: [],
  },
};

export function AdminBillingTab() {
  const { useCabinetApi, subscription, applySubscription, cabinetLoading } = useAdminMasterCabinet();

  const [planState, setPlanState] = useState<MasterPlanState>(() => getCurrentMasterPlan());
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>(() => getCurrentMasterPlan().billingPeriod);
  const [mockProOpen, setMockProOpen] = useState(false);
  const { toast, showToast, showErrorToast, clearToast } = useAdminToast();

  const [plansError, setPlansError] = useState(false);
  const [apiLoading, setApiLoading] = useState(() => Boolean(useCabinetApi));
  const [apiPlans, setApiPlans] = useState<BillingPlanDto[] | null>(null);

  useEffect(() => {
    if (!useCabinetApi) {
      setApiLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setApiLoading(true);
      try {
        const plans = await getBillingPlans();
        if (cancelled) return;
        setApiPlans(plans);
        setPlansError(false);
      } catch {
        if (cancelled) return;
        setPlansError(true);
      } finally {
        if (!cancelled) setApiLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [useCabinetApi]);

  useEffect(() => {
    if (!subscription) return;
    setBillingPeriod(subscription.billingPeriod === 'year' ? 'year' : 'month');
  }, [subscription?.id]);

  const apiSub = subscription;
  const useLiveBilling = Boolean(useCabinetApi && apiSub);

  const appointments = useMemo(() => ensureDemoAppointmentsSeeded(), []);
  const monthlyCountDemo = useMemo(() => countAppointmentsInCurrentMonth(appointments), [appointments]);

  const planStateView: MasterPlanState = useLiveBilling && apiSub
    ? {
        plan: planCodeToPlanId(apiSub.plan.code),
        billingPeriod: (apiSub.billingPeriod === 'year' ? 'year' : 'month') as BillingPeriod,
        updatedAt: apiSub.currentPeriodStart,
      }
    : planState;

  const billingPeriodView: BillingPeriod = billingPeriod;

  const limits = useLiveBilling && apiSub
    ? {
        maxServices: apiSub.plan.maxServices,
        maxMonthlyAppointments: apiSub.plan.maxMonthlyAppointments,
        scheduleHorizonDays: apiSub.plan.maxScheduleDaysAhead,
      }
    : getPlanLimits(planStateView.plan);

  const servicesLen = useLiveBilling && apiSub ? apiSub.usage.activeServices : getMasterDraft().services.length;
  const monthlyCount = useLiveBilling && apiSub ? apiSub.usage.monthlyAppointments : monthlyCountDemo;

  const persistPeriod = useCallback(
    (next: BillingPeriod) => {
      if (next === billingPeriod) return;
      setBillingPeriod(next);
      if (useLiveBilling) return;
      const merged: MasterPlanState = {
        ...planState,
        billingPeriod: next,
        updatedAt: new Date().toISOString(),
      };
      saveCurrentMasterPlan(merged);
      setPlanState(merged);
    },
    [billingPeriod, planState, useLiveBilling],
  );

  const applyPlan = useCallback(
    async (plan: PlanId) => {
      if (useLiveBilling) {
        try {
          const updated = await switchMySubscriptionMock(plan, billingPeriodView);
          applySubscription(updated);
          setBillingPeriod(updated.billingPeriod === 'year' ? 'year' : 'month');
          showToast(plan === 'free' ? 'Тариф Free' : 'Тариф обновлён');
        } catch (e) {
          showErrorToast(e instanceof Error ? e.message : 'Не удалось сменить тариф');
        }
        return;
      }
      const next: MasterPlanState = {
        plan,
        billingPeriod,
        updatedAt: new Date().toISOString(),
      };
      saveCurrentMasterPlan(next);
      setPlanState(next);
    },
    [applySubscription, billingPeriod, billingPeriodView, showErrorToast, showToast, useLiveBilling],
  );

  const confirmMockDemo = useCallback(() => {
    const next: MasterPlanState = {
      plan: 'pro',
      billingPeriod,
      updatedAt: new Date().toISOString(),
    };
    saveCurrentMasterPlan(next);
    setPlanState(next);
    setMockProOpen(false);
    showToast('Тариф Pro подключён');
  }, [billingPeriod, showToast]);

  const confirmMock = useCallback(
    async (promoCode?: string | null) => {
      if (useLiveBilling) {
        try {
          const updated = await switchMySubscriptionMock('pro', billingPeriodView, {
            promoCode: promoCode ?? null,
          });
          applySubscription(updated);
          setBillingPeriod(updated.billingPeriod === 'year' ? 'year' : 'month');
          setMockProOpen(false);
          showToast('Тариф Pro подключён');
        } catch (e) {
          showErrorToast(e instanceof Error ? e.message : 'Не удалось подключить Pro');
        }
        return;
      }
      confirmMockDemo();
    },
    [applySubscription, billingPeriodView, confirmMockDemo, showErrorToast, showToast, useLiveBilling],
  );

  const maxSvc = Math.max(1, limits.maxServices ?? 3);
  const maxAppt = Math.max(1, limits.maxMonthlyAppointments ?? 20);
  const isPro = planStateView.plan === 'pro';
  const servicesHeroLabel = isPro ? '∞' : `${servicesLen}/${maxSvc}`;
  const appointmentsHeroLabel = isPro ? '∞' : `${monthlyCount}/${maxAppt}`;

  const freePriceLine =
    useLiveBilling && apiPlans
      ? formatPriceFromPlans(apiPlans, 'free', billingPeriodView)
      : formatPlanPrice('free', billingPeriodView);

  const proPriceLine =
    useLiveBilling && apiPlans
      ? formatPriceFromPlans(apiPlans, 'pro', billingPeriodView)
      : formatPlanPrice('pro', billingPeriodView);

  const proPriceParts = splitPlanPrice(proPriceLine);

  const statusBanners = (
    <>
      {apiLoading || (useCabinetApi && cabinetLoading) ? (
        <div className="flex min-h-[10rem] items-center justify-center rounded-[22px] border border-[#FDE8ED] bg-white py-8 shadow-[0_8px_28px_rgba(255,95,122,0.06)]">
          <LoadingVideo size="md" label="Загрузка тарифов…" />
        </div>
      ) : null}

      {useCabinetApi && !cabinetLoading && !subscription ? (
        <p className={billingErrorBanner}>
          Не удалось загрузить подписку. Обновите страницу или повторите позже.
        </p>
      ) : null}

      {plansError ? (
        <p className={billingErrorBanner}>Не удалось загрузить список тарифов.</p>
      ) : null}
    </>
  );

  const periodTray = (
    <div className={billingListTray}>
      <BillingPeriodSwitch
        period={billingPeriodView}
        onPeriod={persistPeriod}
      />
    </div>
  );

  const usageBlock = (
    <BillingUsagePanel
      plan={planStateView.plan}
      servicesLen={servicesLen}
      maxSvc={maxSvc}
      monthlyCount={monthlyCount}
      maxAppt={maxAppt}
      scheduleHorizonDays={limits.scheduleHorizonDays}
    />
  );

  const freeActive = planStateView.plan === 'free';
  const proActive = planStateView.plan === 'pro';
  const freePriceValue = freePriceLine.split(' / ')[0] ?? freePriceLine;
  const freePriceUnit = freePriceLine.includes(' / ') ? ` / ${freePriceLine.split(' / ')[1]}` : '';
  const proPriceUnit =
    proPriceParts.unit && proPriceParts.unit.startsWith('/')
      ? proPriceParts.unit
      : proPriceParts.unit
        ? ` / ${proPriceParts.unit}`
        : '/ месяц';

  const planCards = (
    <div className="grid grid-cols-1 items-stretch gap-5 md:grid-cols-2 md:gap-4 lg:gap-5">
      <LandingPricingCard
        name={PLAN_UI.free.name}
        priceValue={freePriceValue}
        priceUnit={freePriceUnit}
        includesLabel="Включено:"
        features={PLAN_UI.free.includes}
        badge={freeActive ? 'Активен' : undefined}
        footer={
          <button
            type="button"
            disabled={freeActive}
            onClick={() => void applyPlan('free')}
            className={landingPlanCtaClass(false, freeActive)}
          >
            {freeActive ? 'Текущий тариф' : 'Перейти на Free'}
          </button>
        }
      />
      <LandingProTariffCard
        priceValue={proPriceParts.value}
        priceUnit={proPriceUnit}
        features={LANDING_MASTER_PRO_FEATURES}
        description={LANDING_PRO_DESCRIPTION}
        topBadge={proActive ? 'Активен' : 'Популярный'}
        footer={
          <button
            type="button"
            disabled={proActive}
            onClick={() => {
              if (useLiveBilling) {
                void recordBillingCheckoutStarted(billingPeriodView).catch(() => {});
              }
              setMockProOpen(true);
            }}
            className={landingProCtaClass(proActive)}
          >
            {proActive ? 'Текущий тариф' : 'Открыть Pro'}
          </button>
        }
      />
    </div>
  );

  const demoNote = !isPro ? (
    <p className={billingSoftNote}>
      Оплата картой появится позже. Сейчас Pro можно активировать в demo-режиме для проверки кабинета.
    </p>
  ) : null;

  return (
    <>
      <section className={`-mx-4 min-w-0 space-y-4 overflow-x-hidden px-4 pb-8 lg:hidden ${BILLING_PAGE_BG}`}>
        <BillingMobileHeader plan={planStateView.plan} period={billingPeriodView} />
        {statusBanners}
        {!apiLoading && !(useCabinetApi && cabinetLoading) ? (
          <>
            {periodTray}
            {usageBlock}
            {demoNote}
            {planCards}
          </>
        ) : null}
      </section>

      <div className={`${billingShellCard} space-y-5`}>
        <BillingDesktopHero
          plan={planStateView.plan}
          period={billingPeriodView}
          servicesLabel={servicesHeroLabel}
          appointmentsLabel={appointmentsHeroLabel}
          scheduleDays={limits.scheduleHorizonDays}
          isPro={isPro}
        />
        <div className="space-y-5 px-4 pb-6 sm:px-5">
          {statusBanners}
          {!apiLoading && !(useCabinetApi && cabinetLoading) ? (
            <>
              {periodTray}
              {usageBlock}
              {demoNote}
              {planCards}
            </>
          ) : null}
        </div>
      </div>

      <AdminBottomSheet
        open={mockProOpen}
        onClose={() => setMockProOpen(false)}
        title="Подключить Pro"
        variant="catalog"
      >
        <MockPaymentBody
          billingPeriod={billingPeriodView}
          proPrice={proPriceLine}
          useCabinetApi={useLiveBilling}
          onBack={() => setMockProOpen(false)}
          onDemo={confirmMock}
        />
      </AdminBottomSheet>

      <AdminToast toast={toast} onDismiss={clearToast} />
    </>
  );
}

function MockPaymentBody({
  billingPeriod,
  proPrice,
  useCabinetApi,
  onBack,
  onDemo,
}: {
  billingPeriod: BillingPeriod;
  proPrice: string;
  useCabinetApi: boolean;
  onBack: () => void;
  onDemo: (promoCode?: string | null) => void | Promise<void>;
}) {
  const meta = PLAN_UI.pro;
  const [promoInput, setPromoInput] = useState('');
  const [quote, setQuote] = useState<PromoQuoteDto | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [promoBusy, setPromoBusy] = useState(false);

  const amountLabel = quote
    ? `${quote.finalAmount} BYN (скидка ${quote.discountPercent}%, было ${quote.baseAmount} BYN)`
    : proPrice || `${priceForPlan('pro', billingPeriod)} BYN`;

  async function applyPromo() {
    if (!useCabinetApi || !promoInput.trim()) return;
    setPromoBusy(true);
    setPromoError(null);
    try {
      const q = await quotePromoForCheckout(promoInput.trim(), billingPeriod);
      setQuote(q);
      setPromoInput(q.code);
    } catch (e) {
      setQuote(null);
      setPromoError(e instanceof Error ? e.message : 'Промокод не применился');
    } finally {
      setPromoBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-[16px] font-semibold text-[#111827]">{meta.name}</p>
      <p className="text-[14px] text-[#6B7280]">
        Период:{' '}
        <span className="font-semibold text-[#111827]">{billingPeriod === 'year' ? 'год' : 'месяц'}</span>
        {' · '}
        <span className="font-semibold text-[#111827]">{amountLabel}</span>
      </p>

      {useCabinetApi ? (
        <div className="space-y-2 rounded-[18px] bg-[#F9FAFB] p-4 ring-1 ring-[#F3F4F6]">
          <p className="text-[13px] font-semibold text-[#374151]">Есть промокод?</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={promoInput}
              onChange={(e) => {
                setPromoInput(e.target.value.toUpperCase());
                setQuote(null);
                setPromoError(null);
              }}
              placeholder="КОД"
              className="min-h-11 flex-1 rounded-xl border border-[#E5E7EB] bg-white px-3 text-[14px] uppercase outline-none focus:border-[#F47C8C]/50"
            />
            <button
              type="button"
              disabled={promoBusy || !promoInput.trim()}
              onClick={() => void applyPromo()}
              className={`shrink-0 px-4 ${billingOutlineBtn}`}
            >
              {promoBusy ? '…' : 'Применить'}
            </button>
          </div>
          {promoError ? <p className="text-[13px] text-[#DC2626]">{promoError}</p> : null}
          {quote?.title ? <p className="text-[13px] text-[#059669]">{quote.title}</p> : null}
        </div>
      ) : null}
      <ul className="space-y-1.5 text-[14px] text-[#374151]">
        {meta.includes.slice(0, 6).map((x) => (
          <li key={x} className="flex gap-2">
            <span className="text-[#F47C8C]" aria-hidden>
              •
            </span>
            <span>{x}</span>
          </li>
        ))}
      </ul>
      <p className="rounded-[18px] bg-[#F9FAFB] px-4 py-3 text-[13px] leading-relaxed text-[#6B7280] ring-1 ring-[#F3F4F6]">
        Оплата будет подключена позже. Сейчас тариф активируется в demo-режиме.
      </p>
      <div className="flex gap-2 pt-1">
        <button type="button" onClick={onBack} className={`min-h-12 flex-1 ${billingOutlineBtn}`}>
          Назад
        </button>
        <button
          type="button"
          onClick={() => void Promise.resolve(onDemo(quote?.code ?? (promoInput.trim() || null)))}
          className={`min-h-12 flex-[1.15] ${billingPinkBtn}`}
        >
          Подключить в demo
        </button>
      </div>
    </div>
  );
}
