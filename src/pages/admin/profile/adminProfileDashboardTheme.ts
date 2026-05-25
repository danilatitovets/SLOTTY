/** Desktop / кабинет: плоские белые панели как в каталоге (без теней и бордеров). */
export const PROFILE_DESKTOP_PAGE_BG = 'lg:bg-[#f6f7fb]';

/** Единая панель профиля и заполненности. */
export const profileCabinetPanel = 'overflow-hidden rounded-[16px] bg-white';

export const profileDashboardCard = profileCabinetPanel;

/** Липкие табы профиля под AdminDesktopTopBar (см. --slotty-admin-desktop-topbar-h). */
export const profileDesktopTabsSticky =
  'sticky z-20 overflow-hidden bg-white top-[var(--slotty-admin-desktop-topbar-h,4.75rem)]';

export const profileDashboardCardPad = 'p-5 sm:p-6';

export const profileDashboardPink = '#ff6f88';

export const profileDashboardPinkText = 'text-[#ff5f7a]';

export const profileDashboardPinkBtn =
  'inline-flex min-h-10 items-center justify-center rounded-[10px] bg-[#F47C8C] px-6 py-3 text-[15px] font-semibold text-white transition hover:opacity-95 active:scale-[0.98]';

export const profileDashboardEditBtn =
  'inline-flex shrink-0 items-center justify-center gap-2 rounded-[10px] bg-[#FFF1F4] px-5 py-2.5 text-[14px] font-semibold text-[#F47C8C] transition hover:bg-[#FFE4EA] active:scale-[0.98]';
