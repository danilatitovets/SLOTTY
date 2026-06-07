import type { ComponentType, ReactNode } from 'react';
import { ADMIN_SEGMENT_NAV_DESKTOP, ADMIN_SEGMENT_NAV_MOBILE } from '../adminCabinetLayout';
import { sheetSegmentClass } from '../profile/adminProfileCabinetTheme';
import { scheduleSegmentClass } from '../schedule/adminScheduleTheme';
import { SCHEDULE_QUICK_SETUP_IMAGES } from '../schedule/scheduleQuickSetupAssets';
import { ADMIN_MOBILE_TAB_ACTIVE_BG, adminMobileSegmentTabClass } from './adminMobileTabBarTheme';

export type AdminSegmentTab<T extends string> = {
  id: T;
  label: string;
  Icon: ComponentType<{ className?: string }>;
};

type Props<T extends string> = {
  tabs: AdminSegmentTab<T>[];
  active: T;
  onChange: (tab: T) => void;
  ariaLabel: string;
  /** `schedule` — синий акцент (страница расписания). */
  accent?: 'brand' | 'schedule';
  desktopClassName?: string;
  /** `mobile` — только нижняя панель; `desktop` — только верхние табы на lg+. */
  mode?: 'both' | 'mobile' | 'desktop';
  renderTabBadge?: (tabId: T) => ReactNode;
};

function SegmentButtons<T extends string>({
  tabs,
  active,
  onChange,
  compact,
  accent = 'brand',
  renderTabBadge,
}: {
  tabs: AdminSegmentTab<T>[];
  active: T;
  onChange: (tab: T) => void;
  compact?: boolean;
  accent?: 'brand' | 'schedule';
  renderTabBadge?: (tabId: T) => ReactNode;
}) {
  const desktopSegmentClass = accent === 'schedule' ? scheduleSegmentClass : sheetSegmentClass;

  return (
    <>
      {tabs.map(({ id, label, Icon }) => {
        const selected = active === id;
        const btnClass = compact
          ? adminMobileSegmentTabClass(selected, accent)
          : `flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-[10px] px-3 py-2.5 transition active:scale-[0.98] lg:flex-row lg:gap-2 ${desktopSegmentClass(selected)}`;

        const badge = renderTabBadge?.(id);

        const showBrandPhoto = compact && selected && accent === 'brand';
        const showScheduleCreatePhoto = compact && selected && accent === 'schedule' && id === 'create';
        const tabPhotoSrc = showScheduleCreatePhoto
          ? SCHEDULE_QUICK_SETUP_IMAGES.tabCreateActiveBg
          : ADMIN_MOBILE_TAB_ACTIVE_BG;
        const tabPhotoOverlay = showScheduleCreatePhoto ? 'bg-[#3B4CCA]/20' : 'bg-[#F47C8C]/20';

        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            className={`${btnClass} ${badge ? 'relative' : ''}`}
          >
            {showBrandPhoto || showScheduleCreatePhoto ? (
              <>
                <span
                  className="pointer-events-none absolute inset-0 overflow-hidden rounded-[12px] bg-cover bg-center"
                  style={{ backgroundImage: `url(${tabPhotoSrc})` }}
                  aria-hidden
                />
                <span
                  className={`pointer-events-none absolute inset-0 overflow-hidden rounded-[12px] ${tabPhotoOverlay}`}
                  aria-hidden
                />
              </>
            ) : null}
            <Icon
              className={`relative z-10 shrink-0 drop-shadow-sm ${compact ? 'h-[22px] w-[22px]' : 'h-5 w-5'}`}
              aria-hidden
            />
            <span
              className={`relative z-10 max-w-full truncate font-bold leading-none ${
                compact ? 'text-[10px] sm:text-[11px]' : 'text-[12px] lg:text-[13px]'
              }`}
            >
              {label}
            </span>
            {badge}
          </button>
        );
      })}
    </>
  );
}

/** Нижняя панель на мобиле + горизонтальные табы на десктопе (кабинет мастера). */
export function AdminSegmentTabNav<T extends string>({
  tabs,
  active,
  onChange,
  ariaLabel,
  desktopClassName,
  accent = 'brand',
  mode = 'both',
  renderTabBadge,
}: Props<T>) {
  const desktopNav = (
    <nav
      className={desktopClassName ?? ADMIN_SEGMENT_NAV_DESKTOP}
      aria-label={ariaLabel}
    >
      <SegmentButtons
        tabs={tabs}
        active={active}
        onChange={onChange}
        accent={accent}
        renderTabBadge={renderTabBadge}
      />
    </nav>
  );

  const mobileNav = (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-[max(12px,env(safe-area-inset-bottom,0px))] lg:hidden">
      <nav className={ADMIN_SEGMENT_NAV_MOBILE} aria-label={ariaLabel}>
        <SegmentButtons
          tabs={tabs}
          active={active}
          onChange={onChange}
          compact
          accent={accent}
          renderTabBadge={renderTabBadge}
        />
      </nav>
    </div>
  );

  if (mode === 'mobile') return mobileNav;
  if (mode === 'desktop') return <div className="mb-4 hidden lg:block">{desktopNav}</div>;

  return (
    <>
      <div className="mb-4 hidden lg:block">{desktopNav}</div>
      {mobileNav}
    </>
  );
}
