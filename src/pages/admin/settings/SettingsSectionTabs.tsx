import type { ComponentType } from 'react';
import { NavLink } from 'react-router-dom';
import {
  ADMIN_SETTINGS_LOGIN_METHODS_PATH,
  ADMIN_SETTINGS_SPONSOR_PATH,
  ADMIN_SETTINGS_SUPPORT_PATH,
} from '../../../app/paths';
import { IconNavProfile, IconNavSponsor, IconNavSupport } from '../adminCabinetNav';
import {
  adminSectionTabIconClass,
  adminSectionTabIconToneClass,
  adminSectionTabIndicatorClass,
  adminSectionTabLabelClass,
  adminSectionTabsNavClass,
  adminSectionTabTextClass,
} from '../shared/adminSectionTabsTheme';

const TABS: Array<{
  to: string;
  label: string;
  Icon: ComponentType<{ className?: string }>;
}> = [
  { to: ADMIN_SETTINGS_LOGIN_METHODS_PATH, label: 'Способы входа', Icon: IconNavProfile },
  { to: ADMIN_SETTINGS_SUPPORT_PATH, label: 'Справка', Icon: IconNavSupport },
  { to: ADMIN_SETTINGS_SPONSOR_PATH, label: 'Спонсор SLOTTY', Icon: IconNavSponsor },
];

type Props = {
  className?: string;
};

export function SettingsSectionTabs({ className = '' }: Props) {
  return (
    <nav
      className={`${adminSectionTabsNavClass} hidden lg:flex ${className}`.trim()}
      aria-label="Разделы настроек"
    >
      {TABS.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          className={({ isActive }) => adminSectionTabTextClass(isActive)}
        >
          {({ isActive }) => (
            <>
              <tab.Icon
                className={`${adminSectionTabIconClass} ${adminSectionTabIconToneClass(isActive)}`}
                aria-hidden
              />
              <span className={adminSectionTabLabelClass}>{tab.label}</span>
              {isActive ? <span className={adminSectionTabIndicatorClass()} aria-hidden /> : null}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
