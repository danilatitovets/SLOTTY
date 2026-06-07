import { useEffect, useState } from 'react';
import { getMyMasterEntitlements } from '../../../features/billing/api/masterEntitlementsApi';
import { getCurrentMasterPlan, type PlanId } from '../../../features/billing/model/masterPlans';
import { getApiBaseUrl } from '../../../shared/api/backendClient';
import { isDevDemoAllowed } from '../../../shared/lib/appMode';

export function useClientMasterProStatus(isMasterCabinet: boolean): {
  planId: PlanId;
  showProBadge: boolean;
  loading: boolean;
} {
  const [planId, setPlanId] = useState<PlanId>('free');
  const [showProBadge, setShowProBadge] = useState(false);
  const [loading, setLoading] = useState(isMasterCabinet);

  useEffect(() => {
    if (!isMasterCabinet) {
      setPlanId('free');
      setShowProBadge(false);
      setLoading(false);
      return;
    }

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        if (getApiBaseUrl()) {
          const ent = await getMyMasterEntitlements();
          if (cancelled) return;
          const pro = ent.isProEntitled;
          setPlanId(pro ? 'pro' : 'free');
          setShowProBadge(pro && ent.features.proBadge);
          return;
        }
        if (isDevDemoAllowed()) {
          const demo = getCurrentMasterPlan().plan;
          if (cancelled) return;
          setPlanId(demo);
          setShowProBadge(demo === 'pro');
          return;
        }
        if (!cancelled) {
          setPlanId('free');
          setShowProBadge(false);
        }
      } catch {
        if (!cancelled) {
          setPlanId('free');
          setShowProBadge(false);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [isMasterCabinet]);

  return { planId, showProBadge, loading };
}
