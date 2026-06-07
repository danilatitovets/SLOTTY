import { Link } from 'react-router-dom';
import { IconNavNotifications } from '../adminCabinetNav';

type BellVariant = 'mobile' | 'desktop';

const BELL_BG = `/photos/${encodeURIComponent('кнопик')}/${encodeURIComponent('услуги.webp')}`;

export function NotificationBellBadge({ count, ringClass = 'ring-white' }: { count: number; ringClass?: string }) {
  if (count <= 0) return null;
  const label = count > 9 ? '9+' : String(count);

  return (
    <span
      className={`absolute right-0 top-0 z-20 flex h-[18px] min-w-[18px] translate-x-1/2 -translate-y-1/2 animate-pulse items-center justify-center rounded-full bg-[#ff5f7a] px-1 text-[10px] font-bold leading-none text-white shadow-[0_0_10px_rgba(255,95,122,0.55)] ring-2 ${ringClass}`}
      aria-hidden
    >
      {label}
    </span>
  );
}

export function notificationBellLinkClass(
  isActive: boolean,
  hasUnread: boolean,
  _variant: BellVariant = 'mobile',
): string {
  const base =
    'relative flex h-11 w-11 shrink-0 items-center justify-center overflow-visible rounded-2xl text-white transition active:scale-[0.97]';

  if (isActive) {
    return `${base} bg-[#F47C8C] shadow-[0_4px_14px_rgba(244,124,140,0.35)] ring-2 ring-[#F47C8C]/35`;
  }

  if (hasUnread) {
    return `${base} bg-[#F47C8C] shadow-[0_0_0_2px_rgba(255,95,122,0.22),0_4px_14px_rgba(244,124,140,0.3)] hover:brightness-105`;
  }

  return `${base} bg-[#F47C8C] shadow-[0_1px_3px_rgba(17,24,39,0.08)] hover:brightness-105`;
}

function notificationBellLinkStyle(): React.CSSProperties {
  return {
    backgroundImage: `url(${BELL_BG})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  };
}

type NotificationBellLinkProps = {
  to: string;
  isActive: boolean;
  hasUnread: boolean;
  count: number;
  variant?: BellVariant;
  ringClass?: string;
  ariaLabel: string;
};

export function NotificationBellLink({
  to,
  isActive,
  hasUnread,
  count,
  variant = 'mobile',
  ringClass = 'ring-white',
  ariaLabel,
}: NotificationBellLinkProps) {
  const photoStyle = notificationBellLinkStyle();

  return (
    <Link
      to={to}
      className={notificationBellLinkClass(isActive, hasUnread, variant)}
      aria-label={ariaLabel}
    >
      <span
        className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl bg-cover bg-center"
        style={photoStyle}
        aria-hidden
      />
      <span
        className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl bg-[#F47C8C]/20"
        aria-hidden
      />
      <IconNavNotifications className="relative z-10 drop-shadow-sm" />
      <NotificationBellBadge count={count} ringClass={ringClass} />
    </Link>
  );
}
