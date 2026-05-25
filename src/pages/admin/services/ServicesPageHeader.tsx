import { ServicesDesktopHero } from './ServicesDesktopHero';
import type { ServicesTabMetrics } from './servicesTabMetrics';
import type { ServicesTabId } from './servicesTypes';

type Props = {
  activeTab: ServicesTabId;
  metrics: ServicesTabMetrics;
};

export function ServicesPageHeader({ activeTab, metrics }: Props) {
  return (
    <>
      <div className="pb-4 lg:hidden">
        <ServicesDesktopHero tab={activeTab} metrics={metrics} />
      </div>
      <div className="hidden lg:block">
        <ServicesDesktopHero tab={activeTab} metrics={metrics} />
      </div>
    </>
  );
}
