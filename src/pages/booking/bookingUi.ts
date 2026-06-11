import {
  catalogFilterChipActive,
  catalogFilterChipIdle,
  catalogListCardClass,
} from '../client/servicesCatalog/servicesCatalogTheme';

export const bookingCard = catalogListCardClass;

/** CTA без тени — только на странице /zapis */
export const bookingPrimaryBtn =
  'inline-flex min-h-10 shrink-0 items-center justify-center rounded-[12px] bg-[#F47C8C] px-5 text-[14px] font-semibold text-white hover:bg-[#F36B85] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F47C8C]/50 disabled:opacity-45';

export const bookingMutedPanel = 'rounded-[10px] bg-[#F5F5F5]';

export const bookingChipActive = catalogFilterChipActive;

export const bookingChipIdle = catalogFilterChipIdle;

export {
  bookingTimeSlotActive as bookingSlotActive,
  bookingTimeSlotIdle as bookingSlotIdle,
} from './bookingDateTimeUi';

export const bookingSectionLabel =
  'text-[15px] font-bold tracking-[-0.02em] text-[#111827]';

export const bookingBackLink =
  'inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#6B7280] transition hover:text-[#111827]';
