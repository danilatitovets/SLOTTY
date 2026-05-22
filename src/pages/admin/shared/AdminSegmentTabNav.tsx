import type { ComponentType } from 'react';

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
  desktopClassName?: string;
  /** `mobile` — только нижняя панель; `desktop` — только верхние табы на lg+. */
  mode?: 'both' | 'mobile' | 'desktop';
};

function SegmentButtons<T extends string>({
  tabs,
  active,
  onChange,
  compact,
}: {
  tabs: AdminSegmentTab<T>[];
  active: T;
  onChange: (tab: T) => void;
  compact?: boolean;
}) {
  return (
    <>
      {tabs.map(({ id, label, Icon }) => {
        const selected = active === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            className={`relative flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-[16px] px-2 py-2 transition duration-200 active:scale-[0.96] lg:flex-row lg:gap-2 lg:rounded-[12px] lg:px-4 lg:py-2.5 ${
              selected
                ? 'bg-[#FFF1F4] text-[#F47C8C] shadow-[inset_0_0_0_1px_rgba(244,124,140,0.12)] lg:shadow-none'
                : 'text-[#9CA3AF] hover:bg-[#FAFAFA] hover:text-[#6B7280]'
            }`}
          >
            <Icon className={`shrink-0 ${compact ? 'h-[22px] w-[22px]' : 'h-5 w-5'}`} aria-hidden />
            <span
              className={`max-w-full truncate font-bold leading-none ${
                compact ? 'text-[10px] sm:text-[11px]' : 'text-[12px] lg:text-[13px]'
              } ${selected ? 'text-[#F47C8C]' : ''}`}
            >
              {label}
            </span>
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
  mode = 'both',
}: Props<T>) {
  const desktopNav = (
    <nav
      className={
        desktopClassName ??
        'mb-5 flex w-full flex-wrap gap-1 rounded-[20px] bg-[#F7F7F8] p-1.5 ring-1 ring-[#EAECEF]'
      }
      aria-label={ariaLabel}
    >
      <SegmentButtons tabs={tabs} active={active} onChange={onChange} />
    </nav>
  );

  const mobileNav = (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center px-3 pb-[max(12px,env(safe-area-inset-bottom,0px))] lg:hidden">
      <nav
        className="pointer-events-auto flex h-[72px] w-full max-w-[460px] items-stretch gap-1 rounded-[26px] border border-white/90 bg-white/95 px-1.5 py-1.5 shadow-[0_16px_44px_rgba(17,24,39,0.14)] backdrop-blur-xl"
        aria-label={ariaLabel}
      >
        <SegmentButtons tabs={tabs} active={active} onChange={onChange} compact />
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
