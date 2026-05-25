import { ScheduleDesktopHero } from './ScheduleDesktopHero';
import type { ScheduleTabMetrics } from './scheduleTabMetrics';
import type { SchedulePageTab } from './scheduleTypes';

type Props = {
  activeTab: SchedulePageTab;
  metrics: ScheduleTabMetrics;
};

export function SchedulePageHeader({ activeTab, metrics }: Props) {
  return (
    <>
      <div className="pb-4 lg:hidden">
        <ScheduleDesktopHero tab={activeTab} metrics={metrics} />
      </div>
      <div className="hidden lg:block">
        <ScheduleDesktopHero tab={activeTab} metrics={metrics} />
      </div>
    </>
  );
}
