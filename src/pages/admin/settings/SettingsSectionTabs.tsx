import type { ComponentType } from 'react';
import { NavLink } from 'react-router-dom';
import {
  ADMIN_SETTINGS_LOGIN_METHODS_PATH,
  ADMIN_SETTINGS_SPONSOR_PATH,
  ADMIN_SETTINGS_SUPPORT_PATH,
} from '../../../app/paths';
import { IconNavProfile, IconNavSponsor, IconNavSupport } from '../adminCabinetNav';

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
      className={`hidden w-full border-b border-[#eef0f5] lg:flex ${className}`.trim()}
      aria-label="Разделы настроек"
    >
      {TABS.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          className={({ isActive }) =>
            `relative flex min-w-0 flex-1 items-center justify-center gap-2 px-1 pb-3.5 pt-1 transition active:scale-[0.98] ${
              isActive ? 'text-[#ff5f7a]' : 'text-[#6B7280] hover:text-[#374151]'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <tab.Icon
                className={`h-[18px] w-[18px] shrink-0 ${isActive ? 'text-[#ff5f7a]' : 'text-[#9CA3AF]'}`}
                aria-hidden
              />
              <span className="truncate text-[13px] font-semibold sm:text-[14px]">{tab.label}</span>
              {isActive ? (
                <span
                  className="absolute inset-x-1 bottom-0 h-0.5 rounded-full bg-gradient-to-r from-[#ff6f88] to-[#ff5f7a]"
                  aria-hidden
                />
              ) : null}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
