import { useCallback, useEffect, useState } from 'react';
import { HiSparkles } from 'react-icons/hi2';
import { Link } from 'react-router-dom';
import { MASTER_SETTINGS_BILLING_PATH } from '../../../../app/paths';
import { planBadgeLabel, type PlanId } from '../../../../features/billing/model/masterPlans';
import {
  getBillingSubscription,
  type BillingSubscriptionResponse,
  type SubscriptionUiState,
} from '../../../../features/billing/api/masterBillingApi';
import { getApiBaseUrl } from '../../../../shared/api/backendClient';
import { useMasterPlanEntitlements } from '../../../../features/billing/useMasterPlanEntitlements';
import { useAdminMasterCabinet } from '../../AdminMasterCabinetContext';
import { formatBillingDate } from '../../billing/billingFormat';
import {
  adminSidebarFooterCardAccent,
  ADMIN_SIDEBAR_TARIFF_BG,
} from '../../adminCabinetLayout';

type Props = {
  onNavigate?: () => void;
};

function resolvePlanId(
  uiState: SubscriptionUiState,
  billing: BillingSubscriptionResponse | null,
  demoPlan: PlanId,
): PlanId {
  if (!billing) return demoPlan;
  if (
    uiState === 'pro_active' ||
    uiState === 'pro_canceled_at_period_end' ||
    uiState === 'past_due'
  ) {
    return 'pro';
  }
  return 'free';
}

function sidebarTariffSubtitle(
  uiState: SubscriptionUiState,
  billing: BillingSubscriptionResponse | null,
  demoPlan: PlanId,
): string {
  if (!billing && demoPlan === 'pro') {
    return 'Подписка активна (demo)';
  }
  if (!billing) {
    return 'До 3 услуг · 20 записей/мес';
  }

  const periodEnd = formatBillingDate(billing.currentPeriodEnd);
  const nextCharge = formatBillingDate(billing.nextChargeAt);

  switch (uiState) {
    case 'pro_active':
      return nextCharge ? `Следующее списание: ${nextCharge}` : 'Управление подпиской и лимитами';
    case 'pro_canceled_at_period_end':
      return periodEnd
        ? `Активен до ${periodEnd} · автопродление выкл.`
        : 'Автопродление отключено';
    case 'past_due':
      return 'Платёж не прошёл — обновите карту';
    case 'expired':
      return 'Pro закончился — подключите снова';
    default:
      return 'До 3 услуг · 20 записей/мес';
  }
}

export function SettingsSidebarTariffCard({ onNavigate }: Props) {
  const { planId } = useMasterPlanEntitlements();
  const { useCabinetApi } = useAdminMasterCabinet();
  const [billing, setBilling] = useState<BillingSubscriptionResponse | null>(null);
  const [loading, setLoading] = useState(Boolean(useCabinetApi && getApiBaseUrl()));

  const reload = useCallback(async () => {
    if (!useCabinetApi || !getApiBaseUrl()) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      setBilling(await getBillingSubscription());
    } catch {
      setBilling(null);
    } finally {
      setLoading(false);
    }
  }, [useCabinetApi]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const uiState: SubscriptionUiState =
    billing?.uiState ?? (planId === 'pro' ? 'pro_active' : 'free');
  const effectivePlan = resolvePlanId(uiState, billing, planId);
  const subtitle = sidebarTariffSubtitle(uiState, billing, planId);

  return (
    <Link
      to={MASTER_SETTINGS_BILLING_PATH}
      onClick={onNavigate}
      className={`${adminSidebarFooterCardAccent} hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff5f7a]/40`}
      aria-label="Управление тарифом"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${ADMIN_SIDEBAR_TARIFF_BG})` }}
        aria-hidden
      />
      <div className="pointer-events-none absolute inset-0 bg-black/45" aria-hidden />

      {loading ? (
        <div className="relative z-10 flex w-full animate-pulse items-center gap-3">
          <div className="h-10 w-10 shrink-0 rounded-[12px] bg-white/20" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-4 w-24 rounded bg-white/25" />
            <div className="h-3 w-full rounded bg-white/20" />
          </div>
        </div>
      ) : (
        <>
          <span className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-white/95 text-[#ff5f7a] shadow-sm">
            <HiSparkles className="h-5 w-5" aria-hidden />
          </span>
          <div className="relative z-10 min-w-0 flex-1 text-left">
            <p className="text-[14px] font-semibold tracking-[-0.02em] text-white">
              Тариф {planBadgeLabel(effectivePlan)}
            </p>
            <p className="mt-0.5 text-[12px] leading-snug text-white/80">{subtitle}</p>
          </div>
        </>
      )}
    </Link>
  );
}
