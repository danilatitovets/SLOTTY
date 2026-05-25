/** Bottom sheet фильтров каталога (мобилка) — плоский стиль как в референсе HH. */

export const catalogFilterSheetCanvas = 'bg-[#F5F5F5]';

export const catalogFilterSheetSectionLabel =
  'text-[13px] font-medium text-[#8E8E93]';

export const catalogFilterSheetPrimaryBtn =
  'flex min-h-12 w-full items-center justify-center rounded-[12px] bg-[#F47C8C] px-4 text-[15px] font-semibold text-white transition hover:opacity-95 active:scale-[0.98] disabled:opacity-50';

export const catalogFilterSheetSecondaryBtn =
  'flex min-h-12 w-full items-center justify-center rounded-[12px] bg-[#FFF1F4] px-4 text-[15px] font-semibold text-[#F47C8C] transition hover:bg-[#FFE4EA] active:scale-[0.98]';

export function catalogFilterSheetChipClass(active: boolean): string {
  return `rounded-full px-4 py-2.5 text-[14px] font-semibold transition active:scale-[0.98] ${
    active
      ? 'bg-[#F47C8C] text-white shadow-[0_4px_14px_rgba(244,124,140,0.22)]'
      : 'bg-white text-[#374151] ring-1 ring-[#EAECEF]'
  }`;
}

export const catalogFilterSheetToggleRow =
  'flex cursor-pointer items-center justify-between gap-3 rounded-[12px] border border-[#E5E7EB] bg-white px-4 py-3.5';
