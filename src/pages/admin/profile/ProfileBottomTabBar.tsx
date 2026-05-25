import { HiDocumentText, HiMapPin, HiPhoto, HiUser } from 'react-icons/hi2';
import { AdminSegmentTabNav } from '../shared/AdminSegmentTabNav';
import type { ProfileSectionId } from './ProfileSectionTabs';

const TABS = [
  { id: 'main' as const, label: 'Профиль', Icon: HiUser },
  { id: 'portfolio' as const, label: 'Портфолио', Icon: HiPhoto },
  { id: 'address' as const, label: 'Адрес', Icon: HiMapPin },
  { id: 'rules' as const, label: 'Правила', Icon: HiDocumentText },
];

type Props = {
  active: ProfileSectionId;
  onChange: (section: ProfileSectionId) => void;
};

export function ProfileBottomTabBar({ active, onChange }: Props) {
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
