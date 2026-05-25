import { Outlet } from 'react-router-dom';
import { SETTINGS_PAGE_BG, settingsShellCard } from './adminSettingsTheme';
import { SettingsBottomTabBar } from './SettingsBottomTabBar';
import { SettingsSectionTabs } from './SettingsSectionTabs';

export function AdminSettingsLayout() {
  return (
    <>
      <div
        className={`mx-auto w-full min-w-0 max-w-6xl pt-1 lg:max-w-none lg:pb-10 lg:pt-2 ${SETTINGS_PAGE_BG} lg:bg-transparent`}
      >
        <h1 className="text-[22px] font-black tracking-[-0.04em] text-[#111827] lg:hidden">Настройки</h1>
        <div className={`${settingsShellCard} mt-4 lg:mt-0`}>
          <SettingsSectionTabs />
          <Outlet />
        </div>
      </div>
      <SettingsBottomTabBar />
    </>
  );
}
