/** Палитра кабинета мастера (Telegram Web App). */
export const cabinetCard =
  'rounded-[22px] bg-white shadow-[0_8px_32px_rgba(17,24,39,0.06)]';
export const cabinetCardPad = 'p-[18px]';
export const cabinetGap = 'space-y-4';
export const cabinetPink = '#F47C8C';
export const cabinetPinkHover = '#F26D83';
export const cabinetPinkBtn =
  'bg-[#F47C8C] text-white shadow-[0_8px_24px_rgba(244,124,140,0.32)] hover:bg-[#F26D83] active:scale-[0.98]';
export const cabinetIconCircle =
  'flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#FFF1F4] text-[#F47C8C]';
export const cabinetMutedBtn =
  'bg-[#F7F7F8] text-[#111827] hover:bg-[#F3F4F6] active:scale-[0.98]';

/** Поля в bottom sheet — белый фон и обводка, чтобы были видны и на белом листе, и в серой секции. */
export const sheetFieldClass =
  'mt-1.5 w-full rounded-[16px] border border-[#EAECEF] bg-white px-4 py-3.5 text-[16px] font-medium text-[#111827] shadow-[0_1px_2px_rgba(17,24,39,0.04)] outline-none placeholder:text-[#9CA3AF] transition focus:border-[#F47C8C]/50 focus:ring-2 focus:ring-[#FDE8ED]';

export const sheetLabelClass = 'text-[13px] font-medium text-[#6B7280]';

export const sheetSectionClass = 'rounded-[20px] bg-[#F7F7F8] p-4';

export const sheetHintClass = 'text-[12px] leading-snug text-[#6B7280]';

export const sheetSectionTitleClass =
  'text-[11px] font-semibold uppercase tracking-[0.08em] text-[#9CA3AF]';

export const sheetCancelBtnClass =
  'flex min-h-12 flex-1 items-center justify-center rounded-[17px] bg-[#F7F7F8] px-4 text-[15px] font-semibold text-[#111827] transition hover:bg-[#F3F4F6] active:scale-[0.99] disabled:opacity-50';

export const sheetPrimaryBtnClass = `${cabinetPinkBtn} flex min-h-12 flex-1 items-center justify-center rounded-[17px] px-4 text-[15px] font-semibold disabled:opacity-60`;

export const sheetOutlineBtnClass =
  'w-full rounded-[17px] border border-[#FDE8ED] bg-white py-3 text-[14px] font-semibold text-[#F47C8C] transition hover:bg-[#FFF1F4] active:scale-[0.99] disabled:opacity-60';

export const sheetPinkPillBtnClass =
  'rounded-full bg-[#FFF1F4] px-3 py-2 text-[12px] font-semibold text-[#F47C8C] shadow-sm ring-2 ring-white transition hover:bg-[#FFE4EA] active:scale-[0.97]';

export function sheetChipClass(active: boolean): string {
  return `rounded-full px-4 py-2.5 text-[14px] font-semibold transition active:scale-[0.98] ${
    active
      ? 'bg-[#F47C8C] text-white shadow-[0_8px_24px_rgba(244,124,140,0.28)]'
      : 'bg-[#F7F7F8] text-[#111827] ring-1 ring-[#EAECEF]'
  }`;
}

export function sheetSegmentClass(active: boolean): string {
  return `min-h-11 rounded-[14px] px-3 text-[14px] font-semibold leading-snug transition active:scale-[0.98] ${
    active
      ? 'bg-[#F47C8C] text-white shadow-[0_8px_24px_rgba(244,124,140,0.28)]'
      : 'bg-white text-[#6B7280] ring-1 ring-[#EAECEF]'
  }`;
}

export function sheetDayClass(active: boolean): string {
  return `min-h-11 min-w-[3rem] rounded-[14px] px-4 text-[14px] font-semibold transition active:scale-[0.98] ${
    active
      ? 'bg-[#F47C8C] text-white shadow-[0_8px_24px_rgba(244,124,140,0.28)]'
      : 'bg-[#F7F7F8] text-[#111827] ring-1 ring-[#EAECEF]'
  }`;
}
