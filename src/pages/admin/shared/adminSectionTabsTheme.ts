/** Единая высота второго хедера кабинета на desktop. */
export const ADMIN_SECTION_TABS_HEIGHT_CLASS = 'h-[3.5rem]';

export const adminSectionTabsNavClass = `flex w-full ${ADMIN_SECTION_TABS_HEIGHT_CLASS} border-b border-[#eef0f5]`;

export const adminSectionTabButtonClass =
  'relative flex h-full min-w-0 flex-1 items-center justify-center gap-2 px-3 transition active:scale-[0.98] lg:px-5';

export const adminSectionTabIconClass = 'h-5 w-5 shrink-0';

export const adminSectionTabLabelClass = 'truncate text-[14px] font-semibold lg:text-[15px]';

export function adminSectionTabTextClass(
  selected: boolean,
  accent: 'brand' | 'schedule' = 'brand',
): string {
  const activeColor = accent === 'schedule' ? 'text-[#3B4CCA]' : 'text-[#ff5f7a]';
  const idleColor = 'text-[#6B7280] hover:text-[#374151]';
  return `${adminSectionTabButtonClass} ${selected ? activeColor : idleColor}`;
}

export function adminSectionTabIconToneClass(
  selected: boolean,
  accent: 'brand' | 'schedule' = 'brand',
): string {
  if (selected) return accent === 'schedule' ? 'text-[#3B4CCA]' : 'text-[#ff5f7a]';
  return 'text-[#9CA3AF]';
}

export function adminSectionTabIndicatorClass(accent: 'brand' | 'schedule' = 'brand'): string {
  const color =
    accent === 'schedule' ? 'bg-[#3B4CCA]' : 'bg-gradient-to-r from-[#ff6f88] to-[#ff5f7a]';
  return `absolute inset-x-3 bottom-0 h-[3px] rounded-t-full ${color} lg:inset-x-5`;
}
