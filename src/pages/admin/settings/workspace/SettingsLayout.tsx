import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { AdminMobileCabinetHeader } from '../../shared/AdminMobileCabinetHeader';
import { ADMIN_MOBILE_TAB_BAR_HEIGHT } from '../../shared/adminMobileTabBarTheme';
import { SettingsIconRail } from './SettingsIconRail';
import { SettingsMobileDrawer } from './SettingsMobileDrawer';
import { SettingsSidebar } from './SettingsSidebar';
import { SETTINGS_WORKSPACE_BG } from './settingsWorkspaceTheme';

export function SettingsLayout() {
  const [search, setSearch] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const stickyShellRef = useRef<HTMLDivElement>(null);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  useLayoutEffect(() => {
    const el = stickyShellRef.current;
    if (!el) return;

    const syncHeaderHeight = () => {
      document.documentElement.style.setProperty('--slotty-admin-header-h', `${el.offsetHeight}px`);
    };

    syncHeaderHeight();
    const ro = new ResizeObserver(syncHeaderHeight);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!sidebarOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSidebarOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [sidebarOpen]);

  const mobileTabBarPad = `pb-[calc(${ADMIN_MOBILE_TAB_BAR_HEIGHT}+1.25rem+env(safe-area-inset-bottom,0px))] lg:pb-0`;

  return (
    <div className={`flex min-h-dvh ${SETTINGS_WORKSPACE_BG} text-[#111827]`}>
      <div className="sticky top-0 hidden h-dvh max-w-full shrink-0 overflow-x-hidden lg:flex">
        <SettingsIconRail />
        <SettingsSidebar search={search} onSearchChange={setSearch} />
      </div>

      <div className={`flex min-h-dvh min-w-0 flex-1 flex-col ${mobileTabBarPad}`}>
        <AdminMobileCabinetHeader
          shellRef={stickyShellRef}
          menuOpen={sidebarOpen}
          onMenuOpen={() => setSidebarOpen(true)}
          menuLabel="Меню настроек"
        />

        <main className="min-w-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6 lg:px-10 lg:py-8">
          <div className="mx-auto w-full max-w-5xl min-w-0 pb-8">
            <Outlet />
          </div>
        </main>
      </div>

      <SettingsMobileDrawer
        open={sidebarOpen}
        onClose={closeSidebar}
        search={search}
        onSearchChange={setSearch}
      />
    </div>
  );
}
