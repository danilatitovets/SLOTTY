import { NavLink } from 'react-router-dom';
import { HiScissors, HiUserGroup } from 'react-icons/hi2';
import { MASTERS_PATH, SERVICES_PATH } from '../../../app/paths';
import { CATALOG_SECTION_TAB_BG } from './catalogSectionTabAssets';
import { catalogSectionTabActive, catalogSectionTabIdle } from './servicesCatalogTheme';

const SECTIONS = [
  {
    id: 'services' as const,
    label: 'Услуги',
    to: SERVICES_PATH,
    icon: HiScissors,
    bg: CATALOG_SECTION_TAB_BG.services,
  },
  {
    id: 'masters' as const,
    label: 'Мастера',
    to: MASTERS_PATH,
    icon: HiUserGroup,
    bg: CATALOG_SECTION_TAB_BG.masters,
  },
];

type Props = {
  className?: string;
  compact?: boolean;
};

export function CatalogSectionTabs({ className = '', compact = false }: Props) {
  const tabClass = compact
    ? 'relative flex w-full min-h-11 items-center justify-center gap-2 overflow-hidden rounded-[10px] px-3 py-2 text-[14px] font-semibold transition'
    : 'relative flex w-full min-h-12 items-center justify-center gap-2 overflow-hidden rounded-[12px] px-4 py-2.5 text-[15px] font-semibold transition';

  return (
    <nav
      className={`grid w-full grid-cols-2 gap-1.5 rounded-[14px] bg-[#F5F5F5] p-1 ${className}`}
      aria-label="Каталог: услуги или мастера"
    >
      {SECTIONS.map(({ id, label, to, icon: Icon, bg }) => (
        <NavLink
          key={id}
          to={to}
          end={id === 'services'}
          className={({ isActive }) =>
            `${tabClass} ${isActive ? `${catalogSectionTabActive} bg-[#F47C8C]` : catalogSectionTabIdle}`
          }
          style={({ isActive }) =>
            isActive
              ? {
                  backgroundImage: `url(${bg})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }
              : undefined
          }
        >
          {({ isActive }) => (
            <>
              {isActive ? (
                <span
                  className="pointer-events-none absolute inset-0 bg-[#F47C8C]/20"
                  aria-hidden
                />
              ) : null}
              <Icon
                className={`relative z-10 ${compact ? 'h-4 w-4' : 'h-[18px] w-[18px]'} shrink-0 ${
                  isActive ? 'text-white drop-shadow-sm' : 'text-[#6B7280]'
                }`}
                aria-hidden
              />
              <span className={`relative z-10 ${isActive ? 'drop-shadow-sm' : ''}`}>{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
