export const PLATFORM_ADMIN_SIDEBAR_WIDTH = 'w-[260px]';
export const PLATFORM_ADMIN_SIDEBAR_PX = 260;
export const PLATFORM_ADMIN_MAIN_OFFSET = 'lg:pl-[260px]';

export const platformAdminNavItemClass = (active: boolean): string =>
  `flex min-h-11 w-full items-center gap-3 rounded-2xl px-3.5 text-left text-[14px] font-semibold transition active:scale-[0.99] ${
    active
      ? 'bg-[#fff0f3] text-[#ff5f7a]'
      : 'text-[#6B7280] hover:bg-[#f7f7f8] hover:text-[#111827]'
  }`;
