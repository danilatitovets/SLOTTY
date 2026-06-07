import {
  ADMIN_MOBILE_TAB_BAR_HEIGHT,
  adminMobileTabBarScrollPad,
} from '../../admin/shared/adminMobileTabBarTheme';

export const CLIENT_CABINET_MOBILE_TAB_BAR_HEIGHT = ADMIN_MOBILE_TAB_BAR_HEIGHT;

export const clientCabinetMobileScrollPad = adminMobileTabBarScrollPad;

export const clientCabinetMobileCanvasClass = 'bg-[#F5F5F5]';

/** Sticky-блоки под шапкой кабинета (см. --slotty-client-mobile-header-h). */
export const CLIENT_CABINET_MOBILE_STICKY_TOP =
  'top-[var(--slotty-client-mobile-header-h,5.25rem)]';
