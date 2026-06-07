import { CabinetIcon, type CabinetIconName } from './cabinetIcons';
import {
  adminSectionTabIndicatorClass,
  adminSectionTabLabelClass,
  adminSectionTabsNavClass,
  adminSectionTabTextClass,
} from '../shared/adminSectionTabsTheme';

export type ProfileSectionId = 'main' | 'address' | 'portfolio' | 'rules';

const TABS: Array<{ id: ProfileSectionId; label: string; icon: CabinetIconName }> = [
  { id: 'main', label: 'Профиль', icon: 'user' },
  { id: 'portfolio', label: 'Портфолио', icon: 'photo' },
  { id: 'address', label: 'Адрес', icon: 'map-pin' },
  { id: 'rules', label: 'Правила', icon: 'rules' },
];

type Props = {
  active: ProfileSectionId;
  onChange: (section: ProfileSectionId) => void;
  className?: string;
};

export function ProfileSectionTabs({ active, onChange, className = '' }: Props) {
  return (
    <nav
      className={`${adminSectionTabsNavClass} hidden lg:flex ${className}`.trim()}
      aria-label="Разделы профиля"
    >
      {TABS.map((tab) => {
        const selected = active === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={adminSectionTabTextClass(selected)}
          >
            <CabinetIcon
              name={tab.icon}
              size={20}
              className={selected ? 'text-[#ff5f7a]' : 'text-[#9CA3AF]'}
            />
            <span className={adminSectionTabLabelClass}>{tab.label}</span>
            {selected ? <span className={adminSectionTabIndicatorClass()} aria-hidden /> : null}
          </button>
        );
      })}
    </nav>
  );
}
