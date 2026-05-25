import { AppointmentsDesktopHero, type AppointmentsTabStats } from './AppointmentsDesktopHero';
import type { AppointmentsTabId } from './appointmentsTypes';

type Props = {
  tab: AppointmentsTabId;
  stats: AppointmentsTabStats;
};

export function AppointmentsPageHeader({ tab, stats }: Props) {
  const showMobileHero = tab !== 'history';

  return (
    <>
      {showMobileHero ? (
        <div className="pb-4 lg:hidden">
          <AppointmentsDesktopHero tab={tab} stats={stats} />
        </div>
      ) : null}
      <div className="hidden lg:block">
        <AppointmentsDesktopHero tab={tab} stats={stats} />
      </div>
    </>
  );
}
