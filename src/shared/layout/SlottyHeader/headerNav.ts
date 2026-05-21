import {
  ADMIN_LOGIN_METHODS_PATH,
  ADMIN_PATH,
  BECOME_MASTER_PATH,
  HUB_PATH,
  MASTERS_PATH,
  SERVICES_PATH,
} from '../../../app/paths';

/** Якоря на лендинге (`/book`). */
export const LANDING_ANCHOR_HOW = 'how-it-works';
export const LANDING_ANCHOR_FOR_MASTERS = 'for-masters';
export const LANDING_ANCHOR_TARIFFS = 'tarify';
export const LANDING_ANCHOR_FAQ = 'faq';

export function landingAnchorHref(anchor: string): string {
  return `${HUB_PATH}#${anchor}`;
}

export const SLOTTY_NAV_CATALOG = { label: 'Каталог', to: SERVICES_PATH } as const;
export const SLOTTY_NAV_MASTERS = { label: 'Мастера', to: MASTERS_PATH } as const;

export const SLOTTY_NAV_ANCHORS = [
  { label: 'Как это работает', anchor: LANDING_ANCHOR_HOW },
  { label: 'Для мастеров', anchor: LANDING_ANCHOR_FOR_MASTERS },
  { label: 'Тарифы', anchor: LANDING_ANCHOR_TARIFFS },
] as const;

export const SLOTTY_MOBILE_MENU = [
  SLOTTY_NAV_CATALOG,
  SLOTTY_NAV_MASTERS,
  { label: 'Как это работает', anchor: LANDING_ANCHOR_HOW },
  { label: 'Для мастеров', anchor: LANDING_ANCHOR_FOR_MASTERS },
  { label: 'Тарифы', anchor: LANDING_ANCHOR_TARIFFS },
  { label: 'FAQ', anchor: LANDING_ANCHOR_FAQ },
] as const;

export { HUB_PATH, ADMIN_PATH, BECOME_MASTER_PATH, ADMIN_LOGIN_METHODS_PATH };
