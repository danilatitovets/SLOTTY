import { Link } from 'react-router-dom';
import { HiBriefcase, HiUser } from 'react-icons/hi2';
import { ADMIN_PATH, PROFILE_PATH } from '../../app/paths';
import { useIsMasterUser } from '../../features/profile/hooks/useIsMasterUser';

export type CabinetRole = 'master' | 'client';

const TAB_BG_DIR = `/photos/${encodeURIComponent('кнопик')}`;

/** Фоны вкладок (`public/photos/кнопик/`). */
const ROLE_SWITCH_TAB_BG = {
  master: `${TAB_BG_DIR}/${encodeURIComponent('мастера.webp')}`,
  client: `${TAB_BG_DIR}/${encodeURIComponent('услуги.webp')}`,
} as const;

type Props = {
  active: CabinetRole;
  className?: string;
  /** Компактный вариант для мобильной шапки кабинета. */
  compact?: boolean;
};

function tabClass(active: boolean, compact: boolean): string {
  return `relative flex min-h-9 flex-1 items-center justify-center gap-1 overflow-hidden rounded-[10px] font-semibold transition active:scale-[0.98] ${
    compact ? 'min-h-8 px-2.5 text-[12px]' : 'gap-1.5 px-4 text-[13px]'
  } ${
    active
      ? 'bg-[#F47C8C] text-white shadow-[0_1px_3px_rgba(17,24,39,0.08)]'
      : 'bg-white text-[#6B7280] hover:bg-[#FAFAFA] hover:text-[#111827]'
  }`;
}

function RoleTabLink({
  to,
  active,
  compact,
  bg,
  icon: Icon,
  label,
}: {
  to: string;
  active: boolean;
  compact: boolean;
  bg: string;
  icon: typeof HiBriefcase;
  label: string;
}) {
  const iconClass = compact ? 'h-3.5 w-3.5' : 'h-4 w-4';

  return (
    <Link
      to={to}
      role="tab"
      aria-selected={active}
      className={tabClass(active, compact)}
      style={
        active
          ? {
              backgroundImage: `url(${bg})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }
          : undefined
      }
    >
      {active ? (
        <span className="pointer-events-none absolute inset-0 bg-[#F47C8C]/20" aria-hidden />
      ) : null}
      <Icon
        className={`relative z-10 ${iconClass} shrink-0 ${active ? 'text-white drop-shadow-sm' : ''}`}
        aria-hidden
      />
      <span className={`relative z-10 ${active ? 'drop-shadow-sm' : ''}`}>{label}</span>
    </Link>
  );
}

export function CabinetRoleSwitch({
  active,
  className = '',
  compact = false,
}: Props) {
  const isMasterUser = useIsMasterUser();
  if (!isMasterUser) return null;

  return (
    <div
      className={`grid grid-cols-2 gap-1 rounded-[12px] bg-[#F5F5F5] p-1 ${
        compact ? 'w-[min(100%,12.5rem)]' : 'w-[min(100%,15.5rem)]'
      } ${className}`}
      role="tablist"
      aria-label="Режим кабинета"
    >
      <RoleTabLink
        to={ADMIN_PATH}
        active={active === 'master'}
        compact={compact}
        bg={ROLE_SWITCH_TAB_BG.master}
        icon={HiBriefcase}
        label="Мастер"
      />
      <RoleTabLink
        to={PROFILE_PATH}
        active={active === 'client'}
        compact={compact}
        bg={ROLE_SWITCH_TAB_BG.client}
        icon={HiUser}
        label="Клиент"
      />
    </div>
  );
};
