import type { ComponentType } from 'react';
import {
  HiChartBarSquare,
  HiStar,
  HiUsers,
  HiWallet,
} from 'react-icons/hi2';
import {
  adminSectionTabIconClass,
  adminSectionTabIconToneClass,
  adminSectionTabIndicatorClass,
  adminSectionTabLabelClass,
  adminSectionTabsNavClass,
  adminSectionTabTextClass,
} from '../shared/adminSectionTabsTheme';
import type { OverviewAnalyticsTab } from './overviewAnalytics';

const TABS: Array<{
  id: OverviewAnalyticsTab;
  label: string;
  Icon: ComponentType<{ className?: string }>;
}> = [
  { id: 'summary', label: 'Сегодня', Icon: HiChartBarSquare },
  { id: 'revenue', label: 'Доход', Icon: HiWallet },
  { id: 'clients', label: 'Клиенты', Icon: HiUsers },
  { id: 'reputation', label: 'Репутация', Icon: HiStar },
];

type Props = {
  active: OverviewAnalyticsTab;
  onChange: (tab: OverviewAnalyticsTab) => void;
  className?: string;
  reputationAlertCount?: number;
};

export function OverviewSectionTabs({
  active,
  onChange,
  className = '',
  reputationAlertCount = 0,
}: Props) {
  return (
    <nav
      className={`${adminSectionTabsNavClass} ${className}`.trim()}
      aria-label="Разделы сводки"
    >
      {TABS.map((tab) => {
        const selected = active === tab.id;
        const Icon = tab.Icon;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={adminSectionTabTextClass(selected)}
          >
            <Icon
              className={`${adminSectionTabIconClass} ${adminSectionTabIconToneClass(selected)}`}
              aria-hidden
            />
            <span className={`flex min-w-0 items-center gap-1.5 ${adminSectionTabLabelClass}`}>
              {tab.label}
              {tab.id === 'reputation' && reputationAlertCount > 0 ? (
                <span className="flex h-[18px] min-w-[18px] shrink-0 animate-pulse items-center justify-center rounded-full bg-[#ff5f7a] px-1 text-[10px] font-bold text-white shadow-[0_0_10px_rgba(255,95,122,0.45)]">
                  {reputationAlertCount > 9 ? '9+' : reputationAlertCount}
                </span>
              ) : null}
            </span>
            {selected ? <span className={adminSectionTabIndicatorClass()} aria-hidden /> : null}
          </button>
        );
      })}
    </nav>
  );
}
