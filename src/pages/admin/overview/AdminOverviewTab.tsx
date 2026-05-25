import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { preloadTabIntroImages } from '../useTabIntroImage';
import type { MasterDraft } from '../../../features/profile/lib/demoMasterStorage';
import type { DemoMasterAppointment } from '../../../features/master/model/demoMasterAppointments';
import { postOverviewReviewReply } from '../../../features/admin/api/masterOverviewApi';
import {
  OVERVIEW_TAB_BAR_HEIGHT,
  overviewDesktopCard,
  overviewDesktopTabsSticky,
  overviewShellCard,
} from './adminOverviewTheme';
import { OverviewAnalyticsTabBar } from './OverviewAnalyticsTabBar';
import { OverviewPeriodFilter } from './OverviewPeriodFilter';
import { OVERVIEW_TAB_INTRO_IMAGES } from './OverviewTabIntro';
import type { OverviewAnalyticsTab, OverviewPeriodPreset } from './overviewAnalytics';
import { OverviewClientsPanel } from './OverviewClientsPanel';
import { OverviewReputationPanel } from './OverviewReputationPanel';
import { OverviewRevenuePanel } from './OverviewRevenuePanel';
import { OverviewSummaryPanel } from './OverviewTabPanels';
import { useOverviewTabData } from './useOverviewTabData';
import { AdminTabContentTransition } from '../shared/AdminTabContentTransition';
import { LoadingPanel } from '../../../shared/ui/LoadingVideo';

type Props = {
  draft: MasterDraft;
  appointments: DemoMasterAppointment[];
  appointmentsPath: string;
  onOpenAppointment: (a: DemoMasterAppointment) => void;
  useCabinetApi: boolean;
};

function OverviewPanelContent({
  loading,
  tabRefreshing,
  error,
  activeTab,
  draft,
  summary,
  serviceCount,
  appointmentsPath,
  dayStats,
  revenue,
  clients,
  reputation,
  periodPreset,
  onPeriodChange,
  periodStart,
  periodEnd,
  appointments,
  useCabinetApi,
  onOpenNearest,
  refreshReputation,
}: {
  loading: boolean;
  tabRefreshing?: boolean;
  error: string | null;
  activeTab: OverviewAnalyticsTab;
  draft: MasterDraft;
  summary: ReturnType<typeof useOverviewTabData>['summary'];
  serviceCount: number;
  appointmentsPath: string;
  dayStats: ReturnType<typeof useOverviewTabData>['dayStats'];
  revenue: ReturnType<typeof useOverviewTabData>['revenue'];
  clients: ReturnType<typeof useOverviewTabData>['clients'];
  reputation: ReturnType<typeof useOverviewTabData>['reputation'];
  periodPreset: OverviewPeriodPreset;
  onPeriodChange: (preset: OverviewPeriodPreset) => void;
  periodStart: string;
  periodEnd: string;
  appointments: DemoMasterAppointment[];
  useCabinetApi: boolean;
  onOpenNearest: () => void;
  refreshReputation: () => void;
}) {
  if (loading) {
    return (
      <LoadingPanel
        className="border-[#F3F4F6] lg:border-0 lg:shadow-none"
        minHeight="min-h-[min(56vh,28rem)]"
      />
    );
  }

  let content: ReactNode;

  if (error) {
    content = (
      <div className="rounded-[24px] border border-[#FEE2E2] bg-[#FEF2F2] p-5">
        <p className="text-[14px] font-semibold text-[#B91C1C]">{error}</p>
      </div>
    );
  } else {
    switch (activeTab) {
      case 'revenue':
        content = (
          <OverviewRevenuePanel
            data={revenue}
            periodPreset={periodPreset}
            onPeriodChange={onPeriodChange}
            appointments={appointments}
            periodStart={periodStart}
            periodEnd={periodEnd}
          />
        );
        break;
      case 'clients':
        content = <OverviewClientsPanel data={clients} />;
        break;
      case 'reputation':
        content = (
          <OverviewReputationPanel
            data={reputation}
            useApi={useCabinetApi}
            onReplied={refreshReputation}
            onReply={async (reviewId, text) => {
              await postOverviewReviewReply(reviewId, text);
              refreshReputation();
            }}
          />
        );
        break;
      default:
        content = (
          <OverviewSummaryPanel
            draft={draft}
            metrics={summary}
            serviceCount={serviceCount}
            appointmentsPath={appointmentsPath}
            dayStats={dayStats}
            onOpenNearest={onOpenNearest}
          />
        );
    }
  }

  return (
    <div className="relative min-w-0">
      {tabRefreshing ? (
        <div
          className="pointer-events-none absolute inset-x-0 top-0 z-10 hidden h-0.5 overflow-hidden rounded-full bg-[#F3F4F6] lg:block"
          aria-hidden
        >
          <div className="h-full w-1/3 animate-pulse rounded-full bg-[#F47C8C]" />
        </div>
      ) : null}
      {content}
    </div>
  );
}

export function AdminOverviewTab({
  draft,
  appointments,
  appointmentsPath,
  onOpenAppointment,
  useCabinetApi,
}: Props) {
  const [activeTab, setActiveTab] = useState<OverviewAnalyticsTab>('summary');
  const [periodPreset, setPeriodPreset] = useState<OverviewPeriodPreset>('month');

  useEffect(() => {
    preloadTabIntroImages(OVERVIEW_TAB_INTRO_IMAGES);
  }, []);

  const {
    loading,
    tabRefreshing,
    error,
    summary,
    dayStats,
    revenue,
    clients,
    reputation,
    reportRange,
    refreshReputation,
  } = useOverviewTabData({
    activeTab,
    periodPreset,
    appointments,
    useCabinetApi,
  });

  const serviceCount = draft.services?.length ?? 0;

  const panel = useMemo(
    () => (
      <OverviewPanelContent
        loading={loading}
        tabRefreshing={tabRefreshing}
        error={error}
        activeTab={activeTab}
        draft={draft}
        summary={summary}
        serviceCount={serviceCount}
        appointmentsPath={appointmentsPath}
        dayStats={dayStats}
        revenue={revenue}
        clients={clients}
        reputation={reputation}
        periodPreset={periodPreset}
        onPeriodChange={setPeriodPreset}
        periodStart={reportRange.start}
        periodEnd={reportRange.end}
        appointments={appointments}
        useCabinetApi={useCabinetApi}
        onOpenNearest={() => {
          if (summary.nearest) onOpenAppointment(summary.nearest);
        }}
        refreshReputation={refreshReputation}
      />
    ),
    [
      activeTab,
      appointmentsPath,
      appointments,
      clients,
      dayStats,
      draft,
      error,
      loading,
      tabRefreshing,
      onOpenAppointment,
      periodPreset,
      setPeriodPreset,
      reportRange.end,
      reportRange.start,
      refreshReputation,
      revenue,
      reputation,
      serviceCount,
      summary,
      useCabinetApi,
    ],
  );

  const transitionKey = `${activeTab}-${periodPreset}-${useCabinetApi ? 'api' : 'local'}`;

  return (
    <>
      {/* Mobile: период, контент, таббар снизу */}
      <section
        className={`min-w-0 space-y-4 overflow-x-hidden pb-[calc(${OVERVIEW_TAB_BAR_HEIGHT}+1.25rem)] lg:hidden`}
      >
        <OverviewPeriodFilter value={periodPreset} onChange={setPeriodPreset} />
        <AdminTabContentTransition activeKey={transitionKey} className="min-w-0 space-y-4">
          {panel}
        </AdminTabContentTransition>
      </section>
      <OverviewAnalyticsTabBar variant="mobile" active={activeTab} onChange={setActiveTab} />

      {/* Desktop: как кабинет мастера — серое полотно, белые/серые блоки без ring */}
      <div className={`${overviewShellCard} space-y-6`}>
        <div className={`${overviewDesktopCard} ${overviewDesktopTabsSticky}`}>
          <OverviewAnalyticsTabBar variant="desktop" active={activeTab} onChange={setActiveTab} />
        </div>
        <OverviewPeriodFilter value={periodPreset} onChange={setPeriodPreset} />
        <AdminTabContentTransition activeKey={transitionKey} className="min-w-0 space-y-6">
          {panel}
        </AdminTabContentTransition>
      </div>
    </>
  );
}
