import {
  HiChartBarSquare,
  HiStar,
  HiUsers,
  HiWallet,
} from 'react-icons/hi2';
import { AdminSegmentTabNav } from '../shared/AdminSegmentTabNav';
import type { OverviewAnalyticsTab } from './overviewAnalytics';
import { OverviewSectionTabs } from './OverviewSectionTabs';

const TABS = [
  { id: 'summary' as const, label: 'Обзор', Icon: HiChartBarSquare },
  { id: 'revenue' as const, label: 'Доход', Icon: HiWallet },
  { id: 'clients' as const, label: 'Клиенты', Icon: HiUsers },
  { id: 'reputation' as const, label: 'Репутация', Icon: HiStar },
];

type Props = {
  active: OverviewAnalyticsTab;
  onChange: (tab: OverviewAnalyticsTab) => void;
  /** Mobile: фиксированная панель снизу. Desktop: табы в шапке карточки. */
  variant?: 'mobile' | 'desktop';
};

export function OverviewAnalyticsTabBar({ active, onChange, variant = 'mobile' }: Props) {
  if (variant === 'desktop') {
    return <OverviewSectionTabs active={active} onChange={onChange} />;
  }

  return (
    <AdminSegmentTabNav
      tabs={TABS}
      active={active}
      onChange={onChange}
      ariaLabel="Разделы аналитики"
      mode="mobile"
    />
  );
}
