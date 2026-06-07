/** Bottom sheet фильтров — стиль WB, цвета Slotty */

export const catalogFilterSheetCanvas = 'bg-[#F5F5F5]';

/** Розовая шапка Slotty */
export const catalogFilterSheetHeaderBarClass =
  'box-border w-full min-w-full shrink-0 overflow-hidden bg-[#F47C8C] pt-[env(safe-area-inset-top,0px)]';

export const catalogFilterSheetHeaderRowClass =
  'relative flex min-h-12 items-center justify-between py-2';

export const catalogFilterSheetHeaderRowGridClass =
  'grid min-h-12 grid-cols-[2.25rem_1fr_2.25rem] items-center py-2';

export const catalogFilterSheetTitleClass =
  'text-[17px] font-bold text-white';

export const catalogFilterSheetTitleCenterClass =
  'min-w-0 truncate text-center text-[17px] font-bold text-white';

export const catalogFilterSheetCloseBtnClass =
  'flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-black/15 text-white transition active:scale-95 active:bg-black/25';

export const catalogFilterSheetBackBtnClass =
  'flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-black/15 text-white transition active:scale-95 active:bg-black/25';

export const catalogFilterSheetCardClass = 'rounded-[20px] bg-white px-4 py-4';

export const catalogFilterSheetSectionTitleClass =
  'mb-3 text-[15px] font-bold text-[#111827]';

export const catalogFilterSheetSectionLabel =
  'text-[15px] font-bold text-[#111827]';

export const catalogFilterSheetPriceInputClass =
  'h-11 w-full rounded-[12px] bg-[#F0F0F2] px-3 text-[15px] font-medium text-[#111827] outline-none placeholder:text-[#9CA3AF] focus:bg-[#E8E8EA]';

const catalogHistoryPhotosDir = `/photos/${encodeURIComponent('история')}/`;

/** Красный фон акций — `public/photos/история/красный.png` */
export const catalogFilterPromoBg = `${catalogHistoryPhotosDir}${encodeURIComponent('красный.png')}`;

export const catalogFilterSheetPromoBarClass =
  'relative flex cursor-pointer items-center justify-between overflow-hidden rounded-[14px] px-4 py-3.5';

export const catalogFilterSheetPrimaryBtn =
  'flex min-h-12 w-full items-center justify-center rounded-[14px] bg-[#F47C8C] px-4 text-[15px] font-bold text-white transition hover:opacity-95 active:scale-[0.98] disabled:opacity-50';

export const catalogFilterSheetSecondaryBtn =
  'flex min-h-12 w-full items-center justify-center rounded-[12px] bg-[#FFF1F4] px-4 text-[15px] font-semibold text-[#F47C8C] transition hover:bg-[#FFE4EA] active:scale-[0.98]';

export function catalogFilterSheetChipClass(active: boolean): string {
  return `rounded-[12px] px-3.5 py-2 text-[14px] transition active:scale-[0.98] ${
    active
      ? 'bg-[#F47C8C] font-semibold text-white'
      : 'bg-[#F0F0F2] font-medium text-[#111827]'
  }`;
}

export const catalogFilterSheetToggleRow =
  'flex cursor-pointer items-center justify-between gap-3 rounded-[12px] bg-[#F0F0F2] px-4 py-3.5';
