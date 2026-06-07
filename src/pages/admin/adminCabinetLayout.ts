/** Общие классы кабинета мастера: мобильная колонка + десктопный дашборд. */
export const ADMIN_SIDEBAR_WIDTH = 'w-[260px]';

/** Ширина sidebar в px (для порталов модалок на desktop). */
export const ADMIN_SIDEBAR_PX = 260;

/** Фиксированная высота desktop-хедера кабинета (как зона логотипа в сайдбаре). */
export const ADMIN_DESKTOP_TOPBAR_HEIGHT = '5rem';

/** Shell: хедер поверх сайдбара, скролл только у main. */
export const adminDesktopCabinetShell = 'relative h-dvh overflow-hidden';

export const adminDesktopCabinetBody =
  'flex h-full min-h-0 lg:pt-[var(--slotty-admin-desktop-topbar-h,5rem)]';

export const adminDesktopSidebarShell = `${ADMIN_SIDEBAR_WIDTH} hidden h-full shrink-0 flex-col overflow-hidden border-r border-[#eef0f5] bg-white lg:flex`;

export const adminDesktopMainScroll =
  'relative flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto overscroll-y-contain';

/** Сдвиг fixed-overlay под sidebar (Tailwind, не интерполировать). */
export const ADMIN_SIDEBAR_OVERLAY_INSET = 'lg:left-[260px]';

/** Высота второго хедера (табы раздела на desktop). */
export const ADMIN_DESKTOP_SECTION_TABS_HEIGHT = '3.5rem';

/** Второй хедер: фиксируется сразу под AdminDesktopTopBar. */
export const adminDesktopSectionTabsFixed = `fixed inset-x-0 z-30 hidden bg-white lg:block ${ADMIN_SIDEBAR_OVERLAY_INSET} top-[var(--slotty-admin-desktop-topbar-h,5rem)]`;

/** Заглушка в потоке под fixed-табы (чтобы контент не уезжал вверх). */
export const adminDesktopSectionTabsSpacer = 'hidden h-[3.5rem] shrink-0 lg:block';

/** Ширина правой панели редактирования на desktop (AdminBottomSheet). */
export const ADMIN_DESKTOP_DRAWER_PANEL =
  'lg:w-[min(720px,52vw)] lg:min-w-[520px] lg:max-w-[720px]';

export const ADMIN_CABINET_SHELL_MAX = 'w-full lg:max-w-none';

export const ADMIN_CABINET_MAIN =
  'mx-auto w-full min-w-0 flex-1 lg:mx-0 lg:flex lg:flex-col lg:px-8 lg:py-6';

export const ADMIN_DESKTOP_CANVAS = 'lg:bg-[#f6f7fb]';

export const ADMIN_DESKTOP_PAGE =
  'lg:rounded-[24px] lg:bg-white lg:shadow-[0_4px_24px_rgba(17,24,39,0.06)] lg:ring-1 lg:ring-[#EAECEF]';

export const adminDesktopNavItemClass = (active: boolean): string =>
  `flex min-h-11 w-full items-center gap-3 rounded-[14px] px-3.5 text-left text-[14px] font-semibold transition active:scale-[0.99] ${
    active
      ? 'bg-[#FFF1F4] text-[#ff5f7a]'
      : 'text-[#6B7280] hover:bg-[#F7F7F8] hover:text-[#111827]'
  }`;

/** Нижние карточки сайдбара: тариф и профиль (без обводки, серый лоток). */
export const adminSidebarFooterCard =
  'flex w-full items-center gap-3 rounded-[14px] bg-[#F6F7FB] p-3.5 no-underline transition hover:bg-[#F1EFEF] active:scale-[0.99]';

export const adminSidebarFooterCardAccent =
  'relative flex w-full items-center gap-3 overflow-hidden rounded-[14px] p-3.5 no-underline transition active:scale-[0.99] hover:opacity-95';

/** Фон карточки тарифа в сайдбаре (`public/photos/fon.webp`). */
export const ADMIN_SIDEBAR_TARIFF_BG = '/photos/fon.webp';

/** Десктоп: сегменты в сером треке (как фильтры в расписании). */
export const ADMIN_SEGMENT_NAV_DESKTOP =
  'flex w-full flex-wrap gap-1.5 rounded-[10px] bg-[#F5F5F5] p-1.5';

/** Плавающая белая карточка на сером полотне — на всю ширину контента. */
export const ADMIN_SEGMENT_NAV_MOBILE =
  'pointer-events-auto flex h-[4.5rem] w-full items-stretch gap-1 rounded-[16px] bg-white p-1.5 ring-1 ring-[#EEEEEE]';
