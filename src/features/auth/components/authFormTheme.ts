/** OKX-подобные поля и кнопки в цветах SLOTTY. */

export const AUTH_TAB_ROW = 'flex gap-6 border-b border-[#EBEBEB]';

export function authTabClass(active: boolean): string {
  return `min-w-[4.5rem] -mb-px border-b-2 pb-3 text-[15px] font-semibold transition ${
    active
      ? 'border-[#E29595] text-[#111827]'
      : 'border-transparent text-[#9CA3AF] hover:text-[#6B7280]'
  }`;
}

export const AUTH_FIELD_CLASS =
  'w-full rounded-2xl bg-[#F5F5F5] px-4 py-3.5 text-[15px] text-[#111827] outline-none transition placeholder:text-[#9CA3AF] focus:bg-white focus:ring-2 focus:ring-[#E29595]/30';

export const AUTH_PRIMARY_BTN_CLASS =
  'flex w-full min-h-[52px] items-center justify-center rounded-full bg-[#111827] px-5 text-[15px] font-semibold text-white transition hover:bg-[#1F2937] active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-[#E5E7EB] disabled:text-[#9CA3AF]';

export const AUTH_SOCIAL_BTN_CLASS =
  'relative flex w-full min-h-[52px] items-center justify-center gap-3 rounded-full border border-[#EBEBEB] bg-white px-5 text-[15px] font-semibold text-[#111827] no-underline transition hover:border-[#E29595]/40 hover:bg-[#FFFCFC] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50';

export const AUTH_DIVIDER_ROW = 'flex items-center gap-3';
export const AUTH_DIVIDER_LINE = 'h-px flex-1 bg-[#EBEBEB]';
export const AUTH_DIVIDER_LABEL = 'shrink-0 text-[13px] font-medium text-[#9CA3AF]';
