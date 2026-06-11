import { useLayoutEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { ADMIN_NOTIFICATIONS_PATH, MASTER_SETTINGS_PATH } from '../../app/paths';
import { CabinetDesktopHeaderLogo } from '../../shared/layout/CabinetDesktopHeaderLogo';
import { CabinetRoleSwitch } from '../../shared/layout/CabinetRoleSwitch';
import { useAdminNotifications } from './notifications/AdminNotificationsContext';
import { NotificationBellLink } from './notifications/notificationBellUi';
import { ADMIN_HUB_PATH, ADMIN_PAGE_TITLES, resolveAdminSectionMeta } from './adminCabinetNav';
import { ProfileCompletionHeaderCard } from './profile/ProfileCompletionHeaderCard';
import { ADMIN_DESKTOP_TOPBAR_HEIGHT, ADMIN_SIDEBAR_WIDTH } from './adminCabinetLayout';

export function AdminDesktopTopBar() {
  const headerRef = useRef<HTMLElement>(null);
  const { pathname } = useLocation();
  const { hasAttention, bellCount } = useAdminNotifications();
  const title = pathname.startsWith(MASTER_SETTINGS_PATH)
    ? (resolveAdminSectionMeta(pathname)?.title ?? 'Настройки')
    : (ADMIN_PAGE_TITLES[pathname] ?? 'Кабинет мастера');
  const isNotifications = pathname === ADMIN_NOTIFICATIONS_PATH;

  useLayoutEffect(() => {
    const el = headerRef.current;
    if (!el) return;

    const syncTopbarHeight = () => {
      document.documentElement.style.setProperty(
        '--slotty-admin-desktop-topbar-h',
        `${el.offsetHeight}px`,
      );
    };

    syncTopbarHeight();
    const ro = new ResizeObserver(syncTopbarHeight);
    ro.observe(el);
    return () => ro.disconnect();
  }, [pathname]);

  return (
    <header
      ref={headerRef}
      className="fixed inset-x-0 top-0 z-40 hidden border-b border-[#EAECEF] bg-white lg:flex"
      style={{ height: ADMIN_DESKTOP_TOPBAR_HEIGHT }}
    >
      <div className="flex h-full w-full items-stretch gap-4">
        <div
          className={`${ADMIN_SIDEBAR_WIDTH} h-full shrink-0 border-r border-[#eef0f5] px-5`}
        >
          <CabinetDesktopHeaderLogo to={ADMIN_HUB_PATH} />
        </div>

        <h1 className="min-w-0 flex-1 self-center truncate text-[22px] font-bold tracking-[-0.04em] text-[#111827]">
          {title}
        </h1>

        <div className="self-center">
          <CabinetRoleSwitch active="master" />
        </div>

        <div className="flex shrink-0 items-center gap-4 self-center px-8">
          <ProfileCompletionHeaderCard variant="header" className="max-w-[14rem]" />

          <NotificationBellLink
            to={ADMIN_NOTIFICATIONS_PATH}
            isActive={isNotifications}
            hasUnread={hasAttention}
            count={bellCount}
            variant="desktop"
            ringClass="ring-[#F5F6FA]"
            ariaLabel={
              bellCount > 0
                ? `Уведомления, ${bellCount} непрочитанных`
                : hasAttention
                  ? 'Уведомления, есть задачи'
                  : 'Уведомления'
            }
          />
        </div>
      </div>
    </header>
  );
}
