import { useEffect, useMemo, useRef, useState } from 'react';
import type { DemoMasterAppointment } from '../../../features/master/model/demoMasterAppointments';
import {
  fetchOverviewBundle,
  fetchOverviewClients,
  fetchOverviewReputation,
  fetchOverviewRevenue,
  fetchOverviewSummary,
  type OverviewSummaryApiDto,
} from '../../../features/admin/api/masterOverviewApi';
import {
  readOverviewBundleCache,
  writeOverviewBundleCache,
} from './adminOverviewSessionCache';
import {
  computeClientAnalytics,
  computeRevenueAnalytics,
  overviewPeriodRange,
  overviewSummaryMetrics,
  type ClientAnalytics,
  type OverviewAnalyticsTab,
  type OverviewPeriodPreset,
  type RevenueAnalytics,
} from './overviewAnalytics';
import {
  computeReputationFromReviews,
  type ReputationAnalyticsPayload,
} from './overviewReputationDemo';

type SummaryMetrics = {
  totalRevenue: number;
  totalVisits: number;
  nearest: DemoMasterAppointment | null;
  hasAny: boolean;
};

export function useOverviewTabData({
  activeTab,
  periodPreset,
  appointments,
  useCabinetApi,
}: {
  activeTab: OverviewAnalyticsTab;
  periodPreset: OverviewPeriodPreset;
  appointments: DemoMasterAppointment[];
  useCabinetApi: boolean;
}) {
  const initialBundle = useCabinetApi ? readOverviewBundleCache(periodPreset) : null;

  const localRange = useMemo(
    () => overviewPeriodRange(periodPreset, appointments),
    [appointments, periodPreset],
  );

  const localSummary = useMemo(
    () => overviewSummaryMetrics(appointments, localRange.start, localRange.end),
    [appointments, localRange.end, localRange.start],
  );
  const localRevenue = useMemo(
    () => computeRevenueAnalytics(appointments, localRange.start, localRange.end),
    [appointments, localRange.end, localRange.start],
  );
  const localClients = useMemo(
    () => computeClientAnalytics(appointments, localRange.start, localRange.end),
    [appointments, localRange.end, localRange.start],
  );
  const localReputation = useMemo(
    () => computeReputationFromReviews(localRange.start, localRange.end),
    [localRange.end, localRange.start],
  );

  const [fetching, setFetching] = useState(false);
  const [tabFetching, setTabFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiPeriodRange, setApiPeriodRange] = useState<{ start: string; end: string } | null>(
    () =>
      initialBundle
        ? { start: initialBundle.periodStart, end: initialBundle.periodEnd }
        : null,
  );
  const [apiSummary, setApiSummary] = useState<OverviewSummaryApiDto | null>(
    () => initialBundle?.summary ?? null,
  );
  const [apiRevenue, setApiRevenue] = useState<RevenueAnalytics | null>(
    () => initialBundle?.revenue ?? null,
  );
  const [apiClients, setApiClients] = useState<ClientAnalytics | null>(
    () => initialBundle?.clients ?? null,
  );
  const [apiReputation, setApiReputation] = useState<ReputationAnalyticsPayload | null>(
    () => initialBundle?.reputation ?? null,
  );
  const [reputationTick, setReputationTick] = useState(0);
  const hasApiDataRef = useRef(false);
  hasApiDataRef.current = apiSummary !== null;

  /** Полная сводка при смене периода. */
  useEffect(() => {
    if (!useCabinetApi) {
      setFetching(false);
      setTabFetching(false);
      setError(null);
      setApiSummary(null);
      setApiRevenue(null);
      setApiClients(null);
      setApiReputation(null);
      setApiPeriodRange(null);
      hasApiDataRef.current = false;
      return;
    }

    let cancelled = false;
    if (!hasApiDataRef.current) {
      setFetching(true);
    }
    setError(null);

    void (async () => {
      try {
        const bundle = await fetchOverviewBundle(periodPreset);
        if (cancelled) return;
        writeOverviewBundleCache(periodPreset, bundle);
        setApiSummary(bundle.summary);
        setApiRevenue(bundle.revenue);
        setApiClients(bundle.clients);
        setApiReputation(bundle.reputation);
        setApiPeriodRange({ start: bundle.periodStart, end: bundle.periodEnd });
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Не удалось загрузить аналитику');
        }
      } finally {
        if (!cancelled) setFetching(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [periodPreset, useCabinetApi]);

  /** Актуализация активной вкладки с бэкенда (отдельный endpoint). */
  useEffect(() => {
    if (!useCabinetApi || fetching) return;

    let cancelled = false;
    setTabFetching(true);

    void (async () => {
      try {
        switch (activeTab) {
          case 'summary': {
            const summary = await fetchOverviewSummary(periodPreset);
            if (cancelled) return;
            setApiSummary(summary);
            setApiPeriodRange({ start: summary.periodStart, end: summary.periodEnd });
            break;
          }
          case 'revenue': {
            const revenue = await fetchOverviewRevenue(periodPreset);
            if (cancelled) return;
            setApiRevenue(revenue);
            break;
          }
          case 'clients': {
            const clients = await fetchOverviewClients(periodPreset);
            if (cancelled) return;
            setApiClients(clients);
            break;
          }
          case 'reputation': {
            const reputation = await fetchOverviewReputation(periodPreset);
            if (cancelled) return;
            setApiReputation(reputation);
            break;
          }
          default:
            break;
        }
        if (!cancelled) setError(null);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Не удалось загрузить аналитику');
        }
      } finally {
        if (!cancelled) setTabFetching(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [activeTab, periodPreset, reputationTick, useCabinetApi, fetching]);

  const refreshReputation = () => setReputationTick((n) => n + 1);

  const reportRange = useCabinetApi && apiPeriodRange ? apiPeriodRange : localRange;

  const summary: SummaryMetrics =
    useCabinetApi && apiSummary
      ? {
          totalRevenue: apiSummary.totalRevenue,
          totalVisits: apiSummary.totalVisits,
          nearest: apiSummary.nearest,
          hasAny: apiSummary.hasAny,
        }
      : localSummary;

  const dayStats = useCabinetApi && apiSummary ? apiSummary.dayStats : localRevenue.dayStats;

  const revenue = useCabinetApi && apiRevenue ? apiRevenue : localRevenue;
  const clients = useCabinetApi && apiClients ? apiClients : localClients;
  const reputation = useCabinetApi && apiReputation ? apiReputation : localReputation;

  const loading = useCabinetApi && fetching && apiSummary === null;

  return {
    loading,
    tabRefreshing: useCabinetApi && tabFetching,
    error: useCabinetApi ? error : null,
    reportRange,
    summary,
    dayStats,
    revenue,
    clients,
    reputation,
    refreshReputation,
    useCabinetApi,
  };
}
