import { Link } from 'react-router-dom';
import type { IconType } from 'react-icons';
import { setProfileRole } from '../../../features/profile/lib/setProfileRole';
import { ACCOUNT_MENU_ICON_CLASS } from './accountMenuIcons';
import { LANDING_ACCOUNT_PANEL_CLASS } from './landingHeaderTheme';

function AccountMenuIcon({ icon: Icon }: { icon: IconType }) {
  return (
    <span className="flex h-5 w-5 shrink-0 items-center justify-center" aria-hidden>
      <Icon className={ACCOUNT_MENU_ICON_CLASS} />
    </span>
  );
}

export type AccountDropdownItem = {
  title: string;
  to: string;
  icon: IconType;
  badge?: string;
};

export type AccountDropdownColumn = {
  label: string;
  items: AccountDropdownItem[];
};

type Props = {
  id?: string;
  columns: AccountDropdownColumn[];
  isOpen: boolean;
  align?: 'left' | 'right';
  onForceClose: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
};

function AccountDropdownLink({
  item,
  onForceClose,
}: {
  item: AccountDropdownItem;
  onForceClose: () => void;
}) {
  return (
    <Link
      to={item.to}
      className="group flex min-h-[36px] items-center gap-2.5 rounded-[10px] px-2 py-1.5 text-left transition hover:bg-[#F5F5F5] focus:outline-none focus-visible:bg-[#F5F5F5]"
      onClick={() => {
        onForceClose();
        void setProfileRole('client');
      }}
    >
      <AccountMenuIcon icon={item.icon} />
      <span className="min-w-0 flex-1 text-[13px] font-medium leading-tight text-[#111827]">
        {item.title}
      </span>
      {item.badge ? (
        <span className="shrink-0 rounded-full bg-[#FFF1F4] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[#F47C8C]">
          {item.badge}
        </span>
      ) : null}
    </Link>
  );
}

export function AccountDropdownPanel({
  id,
  columns,
  isOpen,
  align = 'right',
  onForceClose,
  onMouseEnter,
  onMouseLeave,
}: Props) {
  const visibleColumns = columns.filter((col) => col.items.length > 0);
  if (visibleColumns.length === 0) return null;

  return (
    <div
      id={id}
      className={`absolute top-full z-[70] hidden pt-2 lg:block ${align === 'right' ? 'right-0' : 'left-0'} ${
        isOpen
          ? 'pointer-events-auto opacity-100 translate-y-0'
          : 'pointer-events-none opacity-0 -translate-y-1'
      } transition-[opacity,transform] duration-200 ease-out motion-reduce:transition-none`}
      aria-hidden={!isOpen}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div
        className={`grid w-[min(23.5rem,calc(100vw-2rem))] grid-cols-2 divide-x divide-[#F0F0F0] ${LANDING_ACCOUNT_PANEL_CLASS}`}
      >
        {visibleColumns.map((column) => (
          <div key={column.label} className="min-w-0 px-2.5 py-3">
            <p className="mb-1.5 px-2 text-[12px] font-medium text-[#9CA3AF]">{column.label}</p>
            <ul className="flex flex-col gap-0.5">
              {column.items.map((item) => (
                <li key={item.to}>
                  <AccountDropdownLink item={item} onForceClose={onForceClose} />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
