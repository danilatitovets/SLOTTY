import type { OverviewDayStat } from '../../../features/master/model/demoMasterAppointments';
import { OverviewInteractiveBarChart } from './OverviewInteractiveBarChart';

export function OverviewRevenueBarChart({
  stats,
  emptyHint = 'Дохода за период нет',
}: {
  stats: OverviewDayStat[];
  emptyHint?: string;
}) {
  return (
    <OverviewInteractiveBarChart stats={stats} mode="revenue" emptyHint={emptyHint} size="large" />
  );
}
