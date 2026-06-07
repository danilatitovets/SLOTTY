import { useCallback, useEffect, useMemo, useState } from 'react';
import type { MasterSubscriptionDto } from '../admin/api/adminBillingApi';
import { useAdminMasterCabinet } from '../../pages/admin/AdminMasterCabinetContext';
import { isDevDemoAllowed } from '../../shared/lib/appMode';
import { getMyMasterEntitlements, type MasterEntitlementsDto } from './api/masterEntitlementsApi';
import type { PlanId, PlanLimits } from './model/masterPlans';
import {
  canCreateMoreAppointments,
  countAppointmentsInCurrentMonth,
  getCurrentMasterPlan,
  getPlanLimits,
  isFreeAppointmentLimitReached as isFreeAppointmentLimitReachedLocal,
  isFreeServiceLimitReached as isFreeServiceLimitReachedLocal,
} from './model/masterPlans';

function limitsFromEntitlements(ent: MasterEntitlementsDto): PlanLimits {
  return {
    maxServices: ent.limits.maxServices,
    maxMonthlyAppointments: ent.limits.maxMonthlyAppointments,
    scheduleHorizonDays: ent.limits.scheduleHorizonDays,
  };
}

function limitsFromSubscription(sub: MasterSubscriptionDto): PlanLimits {
  return {
    maxServices: sub.plan.maxServices,
    maxMonthlyAppointments: sub.plan.maxMonthlyAppointments,
    scheduleHorizonDays: sub.plan.maxScheduleDaysAhead,
  };
}

function isProFromSubscription(sub: MasterSubscriptionDto | null): boolean {
  if (!sub) return false;
  if (sub.plan.maxServices == null) return true;
  return sub.plan.code === 'pro';
}

/** Entitlements с API — единственный источник прав в live mode. */
export function useMasterEntitlements(): {
  entitlements: MasterEntitlementsDto | null;
  loading: boolean;
  refresh: () => Promise<void>;
} {
  const { useCabinetApi, subscription } = useAdminMasterCabinet();
  const [entitlements, setEntitlements] = useState<MasterEntitlementsDto | null>(null);
  const [loading, setLoading] = useState(useCabinetApi);

  const refresh = useCallback(async () => {
    if (!useCabinetApi) {
      setEntitlements(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      setEntitlements(await getMyMasterEntitlements());
    } catch {
      setEntitlements(null);
    } finally {
      setLoading(false);
    }
  }, [useCabinetApi]);

  useEffect(() => {
    void refresh();
  }, [refresh, subscription?.status, subscription?.currentPeriodEnd]);

  return { entitlements, loading, refresh };
}

/** Лимиты и счётчики тарифа: entitlements API в кабинете, localStorage только в dev demo. */
export function useMasterPlanEntitlements() {
  const { useCabinetApi, subscription, draft, appointments, cabinetLoading } = useAdminMasterCabinet();
  const { entitlements, loading: entitlementsLoading } = useMasterEntitlements();

  return useMemo(() => {
    const demoPlanAllowed = isDevDemoAllowed();
    const localPlan =
      demoPlanAllowed && !useCabinetApi
        ? getCurrentMasterPlan()
        : { plan: 'free' as PlanId, billingPeriod: 'month' as const, updatedAt: '' };

    const planStatePending =
      useCabinetApi &&
      entitlements == null &&
      subscription == null &&
      (cabinetLoading || entitlementsLoading);

    const isProEntitled = Boolean(
      entitlements?.isProEntitled ?? (useCabinetApi ? isProFromSubscription(subscription) : false),
    );

    const planId: PlanId = isProEntitled
      ? 'pro'
      : useCabinetApi && entitlements
        ? 'free'
        : useCabinetApi && subscription
          ? subscription.plan.code === 'pro'
            ? 'pro'
            : 'free'
          : localPlan.plan;

    const limits: PlanLimits =
      useCabinetApi && entitlements
        ? limitsFromEntitlements(entitlements)
        : useCabinetApi && subscription
          ? limitsFromSubscription(subscription)
          : getPlanLimits(planId);

    const servicesCount =
      useCabinetApi && subscription ? subscription.usage.activeServices : draft.services.length;
    const monthlyAppointments =
      useCabinetApi && subscription
        ? subscription.usage.monthlyAppointments
        : countAppointmentsInCurrentMonth(appointments);

    const freeServiceLimitReached =
      !planStatePending &&
      !isProEntitled &&
      typeof limits.maxServices === 'number' &&
      servicesCount >= limits.maxServices;

    const freeAppointmentLimitReached =
      !planStatePending &&
      !isProEntitled &&
      !canCreateMoreAppointments('free', monthlyAppointments);

    const freeApptCap = limits.maxMonthlyAppointments;
    const freeAppointmentLimitAlmostReached =
      !planStatePending &&
      !isProEntitled &&
      typeof freeApptCap === 'number' &&
      monthlyAppointments >= freeApptCap - 2 &&
      monthlyAppointments < freeApptCap;

    return {
      planId,
      effectivePlan: entitlements?.effectivePlan ?? (planId === 'pro' ? 'pro' : 'free'),
      isProEntitled,
      entitlements,
      entitlementsLoading,
      subscriptionPending: planStatePending,
      billingPeriod:
        useCabinetApi && subscription
          ? subscription.billingPeriod === 'year'
            ? 'year'
            : 'month'
          : localPlan.billingPeriod,
      limits,
      servicesCount,
      monthlyAppointments,
      canUseBundlesAndPromotions: entitlements?.features.bundlesAndPromotions ?? planId === 'pro',
      canUseAdvancedAnalytics: entitlements?.features.advancedAnalytics ?? planId === 'pro',
      canUseDataExport: entitlements?.features.dataExport ?? planId === 'pro',
      freeServiceLimitReached,
      freeAppointmentLimitReached,
      freeAppointmentLimitAlmostReached,
      isFreeServiceLimitReached: (count: number) =>
        useCabinetApi
          ? !planStatePending &&
            !isProEntitled &&
            typeof limits.maxServices === 'number' &&
            count >= limits.maxServices
          : isFreeServiceLimitReachedLocal(count),
      isFreeAppointmentLimitReached: (count: number) =>
        useCabinetApi
          ? !planStatePending && !isProEntitled && !canCreateMoreAppointments('free', count)
          : isFreeAppointmentLimitReachedLocal(count),
    };
  }, [
    appointments,
    cabinetLoading,
    draft.services.length,
    entitlements,
    entitlementsLoading,
    subscription,
    useCabinetApi,
  ]);
}
