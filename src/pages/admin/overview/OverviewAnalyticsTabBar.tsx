import {
  HiChartBarSquare,
  HiStar,
  HiUsers,
  HiWallet,
} from 'react-icons/hi2';
import { AdminSegmentTabNav } from '../shared/AdminSegmentTabNav';
import type { OverviewAnalyticsTab } from './overviewAnalytics';

const TABS = [
  { id: 'summary' as const, label: 'Обзор', Icon: HiChartBarSquare },
  { id: 'revenue' as const, label: 'Доход', Icon: HiWallet },
  { id: 'clients' as const, label: 'Клиенты', Icon: HiUsers },
  { id: 'reputation' as const, label: 'Репутация', Icon: HiStar },
];

type Props = {
  active: OverviewAnalyticsTab;
  onChange: (tab: OverviewAnalyticsTab) => void;
};

export function OverviewAnalyticsTabBar({ active, onChange }: Props) {
  return (
    <AdminSegmentTabNav
      tabs={TABS}
      active={active}
      onChange={onChange}
      ariaLabel="Разделы аналитики"
    />
  );
}
