import { useLayoutEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { PROFILE_NOTIFICATIONS_PATH, SERVICES_PATH } from '../../../app/paths';
import { CabinetDesktopHeaderLogo } from '../../../shared/layout/CabinetDesktopHeaderLogo';
import { CabinetRoleSwitch } from '../../../shared/layout/CabinetRoleSwitch';
import {
  ADMIN_DESKTOP_TOPBAR_HEIGHT,
  ADMIN_SIDEBAR_WIDTH,
} from '../../admin/adminCabinetLayout';
import { NotificationBellLink } from '../../admin/notifications/notificationBellUi';

type Props = {
  title: string;
  hasNewNotifications: boolean;
  notificationCount: number;
};

export function ClientProfileDesktopTopBar({
  title,
  hasNewNotifications,
  notificationCount,
}: Props) {
  const headerRef = useRef<HTMLElement>(null);
  const { pathname } = useLocation();
  const isNotifications = pathname === PROFILE_NOTIFICATIONS_PATH;

  useLayoutEffect(() => {
    const el = headerRef.current;
    if (!el) return;

    const syncTopbarHeight = () => {
      document.documentElement.style.setProperty(
        '--slotty-client-desktop-topbar-h',
        `${el.offsetHeight}px`,
      );
      document.documentElement.style.setProperty(
        '--slotty-admin-desktop-topbar-h',
        `${el.offsetHeight}px`,
      );
    };

    syncTopbarHeight();
    const ro = new ResizeObserver(syncTopbarHeight);
    ro.observe(el);
    return () => ro.disconnect();
  }, [title]);

  return (
    <header
      ref={headerRef}
      className="fixed inset-x-0 top-0 z-40 hidden border-b border-[#EAECEF] bg-white lg:flex"
      style={{ height: ADMIN_DESKTOP_TOPBAR_HEIGHT }}
    >
      <div className="flex h-full w-full items-stretch gap-4">
        <div className={`${ADMIN_SIDEBAR_WIDTH} h-full shrink-0 px-5`}>
          <CabinetDesktopHeaderLogo to={SERVICES_PATH} ariaLabel="SLOTTY — каталог услуг" />
        </div>

        <h1 className="min-w-0 flex-1 self-center truncate text-[22px] font-bold tracking-[-0.04em] text-[#111827]">
          {title}
        </h1>

        <div className="self-center">
          <CabinetRoleSwitch active="client" />
        </div>

        <div className="flex shrink-0 items-center self-center px-8">
          <NotificationBellLink
            to={PROFILE_NOTIFICATIONS_PATH}
            isActive={isNotifications}
            hasUnread={hasNewNotifications}
            count={notificationCount}
            variant="desktop"
            ringClass="ring-[#F5F6FA]"
            ariaLabel={
              notificationCount > 0
                ? `Уведомления, ${notificationCount} непрочитанных`
                : hasNewNotifications
                  ? 'Уведомления, есть новые'
                  : 'Уведомления'
            }
          />
        </div>
      </div>
    </header>
  );
}
