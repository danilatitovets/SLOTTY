import type { CSSProperties, Ref } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { HEADER_LOGO_SRC } from '../../../app/headerLogo';
import { PROFILE_NOTIFICATIONS_PATH, SERVICES_PATH } from '../../../app/paths';
import { useIsMasterUser } from '../../../features/profile/hooks/useIsMasterUser';
import { CabinetRoleSwitch } from '../../../shared/layout/CabinetRoleSwitch';
import { SlottyImg } from '../../../shared/ui/SlottyImg';
import { ADMIN_CABINET_SHELL_MAX } from '../../admin/overview/adminOverviewTheme';
import { NotificationBellLink } from '../../admin/notifications/notificationBellUi';

function IconBurger({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
    </svg>
  );
}

type Props = {
  shellRef?: Ref<HTMLDivElement>;
  menuOpen: boolean;
  onMenuOpen: () => void;
  hasNewNotifications: boolean;
  notificationCount: number;
};

function HeaderActions({
  isNotifications,
  hasNewNotifications,
  notificationCount,
  menuOpen,
  onMenuOpen,
}: {
  isNotifications: boolean;
  hasNewNotifications: boolean;
  notificationCount: number;
  menuOpen: boolean;
  onMenuOpen: () => void;
}) {
  return (
    <div className="flex shrink-0 items-center gap-2 sm:gap-3">
      <NotificationBellLink
        to={PROFILE_NOTIFICATIONS_PATH}
        isActive={isNotifications}
        hasUnread={hasNewNotifications}
        count={notificationCount}
        variant="mobile"
        ringClass="ring-[#F47C8C]"
        ariaLabel={
          notificationCount > 0
            ? `Уведомления, ${notificationCount} непрочитанных`
            : hasNewNotifications
              ? 'Уведомления, есть новые'
              : 'Уведомления'
        }
      />
      <button
        type="button"
        onClick={onMenuOpen}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#F3F4F6] text-[#111827] transition hover:bg-[#E4E7EC] active:scale-[0.97]"
        aria-label="Меню разделов"
        aria-expanded={menuOpen}
      >
        <IconBurger className="text-neutral-800" />
      </button>
    </div>
  );
}

function HeaderLogo({ compact }: { compact?: boolean }) {
  return (
    <Link
      to={SERVICES_PATH}
      aria-label="SLOTTY — каталог услуг"
      className={`inline-flex shrink-0 items-center overflow-visible outline-none ring-0 transition hover:opacity-60 active:scale-[0.99] ${
        compact
          ? 'h-14 min-h-14 max-w-[5.5rem] sm:h-16 sm:min-h-16 sm:max-w-[6.5rem]'
          : 'h-20 min-h-20 sm:h-[5.5rem] sm:min-h-[5.5rem]'
      }`}
    >
      <SlottyImg
        src={HEADER_LOGO_SRC}
        alt=""
        decoding="async"
        fetchPriority="low"
        className={
          compact
            ? 'h-[3.875rem] w-auto max-w-none scale-[1.1] -translate-x-6 translate-y-[2px] object-contain object-left sm:h-[4.25rem] sm:scale-[1.1] sm:-translate-x-7'
            : 'h-20 w-auto max-w-[min(20rem,70vw)] -translate-x-10 translate-y-[5px] object-contain object-left sm:h-[5.5rem] sm:max-w-[22rem] sm:-translate-x-12 sm:translate-y-[7px]'
        }
      />
    </Link>
  );
}

export function ClientMobileCabinetHeader({
  shellRef,
  menuOpen,
  onMenuOpen,
  hasNewNotifications,
  notificationCount,
}: Props) {
  const { pathname } = useLocation();
  const isNotifications = pathname === PROFILE_NOTIFICATIONS_PATH;
  const isMasterUser = useIsMasterUser();

  return (
    <div
      ref={shellRef}
      className="w-full min-w-0 shrink-0 bg-white lg:hidden"
      style={
        {
          '--slotty-client-mobile-header-h': '5.25rem',
        } as CSSProperties
      }
    >
      <div
        className={`mx-auto w-full min-w-0 ${ADMIN_CABINET_SHELL_MAX} px-4 pb-1 pt-[calc(0.25rem+env(safe-area-inset-top,0px))]`}
      >
        {isMasterUser ? (
          <div className="grid w-full grid-cols-[1fr_auto_1fr] items-center gap-2">
            <div className="min-w-0 justify-self-start">
              <HeaderLogo compact />
            </div>
            <CabinetRoleSwitch active="client" compact className="justify-self-center" />
            <div className="justify-self-end">
              <HeaderActions
                isNotifications={isNotifications}
                hasNewNotifications={hasNewNotifications}
                notificationCount={notificationCount}
                menuOpen={menuOpen}
                onMenuOpen={onMenuOpen}
              />
            </div>
          </div>
        ) : (
          <div className="flex w-full items-center justify-between gap-3">
            <HeaderLogo />
            <HeaderActions
              isNotifications={isNotifications}
              hasNewNotifications={hasNewNotifications}
              notificationCount={notificationCount}
              menuOpen={menuOpen}
              onMenuOpen={onMenuOpen}
            />
          </div>
        )}
      </div>
      <div className="w-full border-b-2 border-[#F47C8C]" aria-hidden />
    </div>
  );
}
