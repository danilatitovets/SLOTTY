import { profileCabinetPanel, PROFILE_DESKTOP_PAGE_BG } from '../profile/adminProfileDashboardTheme';

export { homePinkBtn, homeOutlineBtn } from '../../home/homeTheme';

export const BILLING_PAGE_BG = 'bg-white';

export const BILLING_DESKTOP_CANVAS = PROFILE_DESKTOP_PAGE_BG;

export const billingDesktopCard = profileCabinetPanel;

export const billingShellCard = 'hidden w-full min-w-0 lg:block';

export const BILLING_GRADIENT =
  'bg-gradient-to-br from-[#111827] via-[#2b2430] to-[#ff5f7a]';

export const billingListTray =
  'rounded-[22px] border border-[#FDE8ED]/90 bg-[#f6f7fb] p-4 shadow-[0_4px_20px_rgba(255,95,122,0.07)] lg:p-5';

export const billingPanel =
  'rounded-[22px] border border-[#FDE8ED]/90 bg-white p-4 shadow-[0_8px_28px_rgba(255,95,122,0.06)] sm:p-5';

export const billingPlanCard =
  'relative flex min-h-[20rem] flex-col overflow-hidden rounded-[22px] border border-[#FDE8ED]/90 bg-white p-5 shadow-[0_8px_28px_rgba(255,95,122,0.08)]';

export const billingPlanCardActive = 'border-[#F9A8B4] ring-2 ring-[#ff5f7a]/20';

export const billingCheckIcon =
  'flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#FFF1F4] text-[#ff5f7a] ring-1 ring-[#FDE8ED]';

export const billingPinkBtn =
  'flex min-h-11 w-full items-center justify-center rounded-[14px] bg-gradient-to-r from-[#ff6f88] to-[#ff5f7a] text-[14px] font-bold text-white shadow-[0_8px_22px_rgba(255,95,122,0.32)] transition hover:opacity-95 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50';

export const billingOutlineBtn =
  'flex min-h-11 w-full items-center justify-center rounded-[14px] border border-[#EAECEF] bg-white text-[14px] font-semibold text-[#374151] transition hover:bg-[#FAFAFA] active:scale-[0.98] disabled:cursor-default disabled:opacity-70';

export const billingSegmentWrap = 'flex rounded-full bg-[#F1EFEF] p-1';

export const billingSegmentBtn = (active: boolean) =>
  `min-h-10 flex-1 rounded-full px-3 text-[14px] font-semibold transition active:scale-[0.98] ${
    active
      ? 'bg-white text-[#111827] shadow-[0_6px_16px_rgba(17,17,17,0.06)]'
      : 'text-[#6B7280]'
  }`;

export const billingTrayLabel =
  'mb-3 text-[11px] font-bold uppercase tracking-[0.1em] text-[#ff5f7a]';

export const billingErrorBanner =
  'rounded-[18px] border border-[#FECACA] bg-[#FFF5F5] px-4 py-3 text-center text-[14px] font-semibold text-[#9B2C2C]';

export const billingSoftNote =
  'rounded-[18px] bg-[#FFFBEB] px-4 py-3 text-[13px] font-medium leading-relaxed text-[#92400E] ring-1 ring-[#FDE68A]/50';

/** @deprecated use billingPanel */
export const billingLandingPanel = billingPanel;

/** @deprecated use billingPlanCard */
export const billingLandingCard = billingPlanCard.replace(' p-5', '');
