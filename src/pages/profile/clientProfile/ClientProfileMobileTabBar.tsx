import { HiBell, HiCalendarDays, HiHeart, HiUser } from 'react-icons/hi2';
import { AdminSegmentTabNav } from '../../admin/shared/AdminSegmentTabNav';
import type { ClientProfileMainTab } from './clientCabinetMobileTabs';

const TABS = [
  { id: 'appointments' as const, label: 'Записи', Icon: HiCalendarDays },
  { id: 'favorites' as const, label: 'Избранное', Icon: HiHeart },
  { id: 'notifications' as const, label: 'Уведомления', Icon: HiBell },
  { id: 'profile' as const, label: 'Профиль', Icon: HiUser },
];

type Props = {
  active: ClientProfileMainTab;
  onChange: (tab: ClientProfileMainTab) => void;
};

export function ClientProfileMobileTabBar({ active, onChange }: Props) {
  return (
    <AdminSegmentTabNav
      tabs={TABS}
      active={active}
      onChange={onChange}
      ariaLabel="Разделы профиля"
      mode="mobile"
    />
  );
}
