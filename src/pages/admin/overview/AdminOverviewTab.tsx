import { useMemo, useState } from 'react';
import { HiCalendar } from 'react-icons/hi2';
import type { MasterDraft } from '../../../features/profile/lib/demoMasterStorage';
import type { DemoMasterAppointment } from '../../../features/master/model/demoMasterAppointments';
import { OverviewAnalyticsTabBar } from './OverviewAnalyticsTabBar';
import { OverviewPeriodFilter } from './OverviewPeriodFilter';
import {
  computeClientAnalytics,
  computeReputationAnalytics,
  computeRevenueAnalytics,
  overviewPeriodRange,
  overviewSummaryMetrics,
  type OverviewAnalyticsTab,
  type OverviewPeriodPreset,
} from './overviewAnalytics';
import {
  OverviewClientsPanel,
  OverviewReputationPanel,
  OverviewRevenuePanel,
  OverviewSummaryPanel,
} from './OverviewTabPanels';

type Props = {
  draft: MasterDraft;
  appointments: DemoMasterAppointment[];
  appointmentsPath: string;
  onOpenAppointment: (a: DemoMasterAppointment) => void;
};

const isLoading = false;

export function AdminOverviewTab({ draft, appointments, appointmentsPath, onOpenAppointment }: Props) {
  const [activeTab, setActiveTab] = useState<OverviewAnalyticsTab>('summary');
  const [periodPreset, setPeriodPreset] = useState<OverviewPeriodPreset>('month');

  const reportRange = useMemo(
    () => overviewPeriodRange(periodPreset, appointments),
    [appointments, periodPreset],
  );

  const summary = useMemo(
    () => overviewSummaryMetrics(appointments, reportRange.start, reportRange.end),
    [appointments, reportRange.end, reportRange.start],
  );

  const revenue = useMemo(
    () => computeRevenueAnalytics(appointments, reportRange.start, reportRange.end),
    [appointments, reportRange.end, reportRange.start],
  );

  const clients = useMemo(
    () => computeClientAnalytics(appointments, reportRange.start, reportRange.end),
    [appointments, reportRange.end, reportRange.start],
  );

  const reputation = useMemo(() => computeReputationAnalytics(), []);

  const serviceCount = draft.services?.length ?? 0;

  const cyclePeriod = () => {
    const order: OverviewPeriodPreset[] = ['today', 'week', 'month', 'all'];
    const idx = order.indexOf(periodPreset);
    setPeriodPreset(order[(idx + 1) % order.length]!);
  };

  const panel = useMemo(() => {
    if (isLoading) return null;

    switch (activeTab) {
      case 'revenue':
        return <OverviewRevenuePanel data={revenue} />;
      case 'clients':
        return <OverviewClientsPanel data={clients} />;
      case 'reputation':
        return <OverviewReputationPanel data={reputation} />;
      default:
        return (
          <OverviewSummaryPanel
            metrics={summary}
            serviceCount={serviceCount}
            appointmentsPath={appointmentsPath}
            onOpenNearest={() => {
              if (summary.nearest) onOpenAppointment(summary.nearest);
            }}
          />
        );
    }
  }, [
    activeTab,
    appointmentsPath,
    clients,
    onOpenAppointment,
    reputation,
    revenue,
    serviceCount,
    summary,
  ]);

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-2 pb-0.5">
          <div className="w-11 shrink-0" aria-hidden />
          <h1 className="flex-1 text-center text-[18px] font-semibold tracking-[-0.03em] text-[#111827]">
            Сводка
          </h1>
          <button
            type="button"
            onClick={cyclePeriod}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-[#111827] shadow-[0_4px_16px_rgba(17,24,39,0.06)] transition hover:bg-[#F7F7F8] active:scale-[0.97]"
            aria-label="Сменить период"
          >
            <HiCalendar className="h-5 w-5" aria-hidden />
          </button>
        </div>

        <OverviewPeriodFilter value={periodPreset} onChange={setPeriodPreset} />

        <div key={`${activeTab}-${periodPreset}`} className="pb-2 transition-opacity duration-200">
          {panel}
        </div>
      </div>

      <OverviewAnalyticsTabBar active={activeTab} onChange={setActiveTab} />
    </>
  );
}
