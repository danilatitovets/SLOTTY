import {
  catalogSheetPrimaryBtn,
} from '../shared/adminCatalogSheetTheme';
import {
  profileDashboardCard,
  PROFILE_DESKTOP_PAGE_BG,
} from '../profile/adminProfileDashboardTheme';

export const NOTIFICATIONS_PAGE_BG = 'max-lg:bg-transparent';

export const NOTIFICATIONS_DESKTOP_CANVAS = PROFILE_DESKTOP_PAGE_BG;

export const notificationsDesktopCard = profileDashboardCard;

export const notificationsShellCard = 'hidden w-full min-w-0 lg:block';

export const NOTIFICATIONS_GRADIENT =
  'bg-gradient-to-br from-[#111827] via-[#2b2430] to-[#ff5f7a]';

/** Панель фильтров ленты. */
export const notifListToolbar =
  'w-full rounded-[16px] bg-white p-4 ring-1 ring-[#EEEEEE] max-lg:shadow-none lg:rounded-[20px] lg:p-5';

export const notifTrayLabel = 'text-[14px] font-bold text-[#111827]';

export const notifCardShell =
  'flex w-full overflow-hidden rounded-[16px] bg-white ring-1 ring-[#EEEEEE] transition active:scale-[0.99] lg:rounded-[18px] lg:ring-[#EAECEF]';

export const notifCardShellInteractive =
  `${notifCardShell} cursor-pointer hover:bg-[#FAFAFA]`;

export const notifCardBody = 'flex min-w-0 flex-1';

export const notifIconStrip =
  'flex w-[4.25rem] shrink-0 items-center justify-center self-stretch py-3 sm:w-[4.75rem]';

export const notifIconStripUnread = 'bg-[#FFF1F4]';

export const notifIconStripRead = 'bg-[#EBEBEB]';

export const notifCardContent = 'min-w-0 flex-1 p-3.5 sm:p-4';

export const notifBadgeNew =
  'rounded-full bg-[#FFF1F4] px-2.5 py-1 text-[11px] font-bold text-[#F47C8C] ring-1 ring-[#FDE8ED]';

export const notifKpiIcon =
  'flex shrink-0 items-center justify-center rounded-[14px] bg-[#EBEBEB] text-[#6B7280]';

export const notifIconFallback =
  'flex shrink-0 items-center justify-center rounded-[14px] bg-[#EBEBEB] text-[#6B7280] ring-1 ring-[#EEEEEE]';

export const notifPinkBtn = catalogSheetPrimaryBtn;

export const notifEmptyIcon =
  'flex h-16 w-16 items-center justify-center rounded-[16px] bg-[#EBEBEB] text-[#6B7280]';

export const notifMetaAccent = 'font-semibold text-[#F47C8C]';

export const notifErrorBox =
  'rounded-[10px] bg-[#FEF2F2] px-4 py-3 text-center text-[14px] font-semibold text-[#EF4444]';

export const notifLoadingCard =
  'flex min-h-[12rem] items-center justify-center rounded-[16px] bg-white py-10 ring-1 ring-[#EEEEEE]';

/** Баннер на профиле — белая карточка кабинета. */
export const notifProfileBanner =
  'mb-4 flex items-start gap-3 rounded-[16px] bg-white px-4 py-3.5 ring-1 ring-[#EEEEEE] transition active:scale-[0.99] hover:bg-[#FAFAFA]';

/** @deprecated */
export const notifListTray = notifListToolbar;

/** @deprecated */
export const notifCard = notifCardShell;
