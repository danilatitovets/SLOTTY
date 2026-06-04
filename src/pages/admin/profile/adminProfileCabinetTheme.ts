import { profileCabinetPanel } from './adminProfileDashboardTheme';

/** Палитра кабинета мастера (Telegram Web App). */
export const cabinetCard = profileCabinetPanel;
export const cabinetCardPad = 'p-5 sm:p-[18px]';
export const cabinetGap = 'space-y-4';
export const cabinetPink = '#F47C8C';
export const cabinetPinkHover = '#F26D83';
export const cabinetPinkBtn =
  'rounded-[10px] bg-[#F47C8C] text-white hover:opacity-95 active:scale-[0.98]';
export const cabinetIconCircle =
  'flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-[#FFF1F4] text-[#F47C8C]';
export const cabinetMutedBtn =
  'rounded-[10px] bg-[#EBEBEB] text-[#111827] hover:bg-[#E4E4E4] active:scale-[0.98]';

/** Серые плитки внутри панелей (как поля каталога). */
export const cabinetInsetTile = 'rounded-[10px] bg-[#F5F5F5]';

/** Внутренняя панель «блок в блоке» — как карточки записей и пустые состояния. */
export const cabinetInsetShell =
  'overflow-hidden rounded-[16px] bg-white ring-1 ring-[#EEEEEE] lg:rounded-[18px] lg:ring-[#EAECEF]';

/** Outline-кнопка кабинета (как ссылки из пустых состояний). */
export const cabinetOutlineBtn =
  'inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-[10px] border border-[#F47C8C]/30 bg-white px-4 text-[14px] font-semibold text-[#F47C8C] no-underline transition hover:bg-[#FFF1F4] active:scale-[0.99] disabled:opacity-50';


/** Поля в модалках профиля — как в каталоге (#EBEBEB, без бордеров). */
export const sheetFieldClass =
  'mt-1.5 w-full rounded-[10px] border-0 bg-[#EBEBEB] px-4 py-3 text-[15px] font-medium text-[#111827] outline-none transition placeholder:text-[#8E8E93] focus:bg-[#E4E4E4]';

export const sheetLabelClass = 'text-[13px] font-medium text-[#6B7280]';

export const sheetSectionClass = `${profileCabinetPanel} p-4 sm:p-5`;

export const sheetHintClass = 'text-[12px] leading-snug text-[#6B7280]';

export const sheetSectionTitleClass = 'text-[13px] font-semibold text-[#111827]';

export const sheetCancelBtnClass =
  'flex min-h-11 flex-1 items-center justify-center rounded-[10px] bg-[#EBEBEB] px-4 text-[15px] font-semibold text-[#111827] transition hover:bg-[#E4E4E4] active:scale-[0.98] disabled:opacity-50';

export const sheetPrimaryBtnClass =
  'flex min-h-11 flex-1 items-center justify-center rounded-[10px] bg-[#F47C8C] px-4 text-[15px] font-semibold text-white transition hover:opacity-95 active:scale-[0.98] disabled:opacity-50';

export const sheetOutlineBtnClass =
  'rounded-[10px] bg-[#EBEBEB] px-3 py-2 text-[12px] font-semibold text-[#111827] transition hover:bg-[#E4E4E4] active:scale-[0.98] disabled:opacity-50';

export const sheetPinkPillBtnClass =
  'rounded-[10px] bg-[#FFF1F4] px-3 py-2 text-[12px] font-semibold text-[#F47C8C] transition hover:bg-[#FFE4EA] active:scale-[0.98] disabled:opacity-50';

export function sheetChipClass(active: boolean): string {
  return `rounded-full px-4 py-2.5 text-[14px] font-semibold transition active:scale-[0.98] ${
    active
      ? 'bg-[#F47C8C] text-white'
      : 'bg-[#F5F5F5] text-[#111827] ring-1 ring-[#EEEEEE]'
  }`;
}

/** Чипы на сером полотне (#F5F5F5) в bottom sheet — неактивные белые, как в кабинете. */
export function sheetChipOnCanvasClass(active: boolean): string {
  return `rounded-full px-4 py-2.5 text-[14px] font-semibold transition active:scale-[0.98] ${
    active
      ? 'bg-[#F47C8C] text-white'
      : 'bg-white text-[#374151] ring-1 ring-[#EAECEF]'
  }`;
}

export function sheetSegmentClass(active: boolean): string {
  return `min-h-11 rounded-[10px] px-3 text-[14px] font-semibold leading-snug transition active:scale-[0.98] ${
    active
      ? 'bg-[#F47C8C] text-white'
      : 'bg-[#F5F5F5] text-[#111827] ring-1 ring-[#EEEEEE]'
  }`;
}

export function sheetDayClass(active: boolean): string {
  return `min-h-11 min-w-[3rem] rounded-[14px] px-4 text-[14px] font-semibold transition active:scale-[0.98] ${
    active
      ? 'bg-[#F47C8C] text-white'
      : 'bg-[#F5F5F5] text-[#111827] ring-1 ring-[#EEEEEE]'
  }`;
}
