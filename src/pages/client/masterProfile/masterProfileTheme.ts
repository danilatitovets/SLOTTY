import { catalogStickyToolbarClass } from '../servicesCatalog/servicesCatalogTheme';

export {
  catalogCanvasClass,
  catalogDesktopPanel,
  catalogDesktopSectionLabel,
  catalogPanelListClass,
  catalogPanelRowClass,
  catalogPanelRowPad,
  catalogPrimaryBtn,
  catalogSecondaryBtn,
  catalogStickyToolbarClass,
} from '../servicesCatalog/servicesCatalogTheme';

export const masterProfileMobileToolbarStickyClass = `${catalogStickyToolbarClass} pb-2 pt-1`;

/** Десктоп: колонки одной высоты — sticky-сайдбар держится, пока листается основной блок. */
export const masterProfileDesktopLayout =
  'lg:flex lg:items-stretch lg:gap-8 xl:gap-10';

export const masterProfileDesktopMainCol =
  'min-w-0 flex-1 lg:pr-1 xl:pr-2';

export const masterProfileDesktopSidebarCol =
  'flex w-full shrink-0 flex-col lg:w-[300px] lg:max-w-[300px] xl:w-[320px] xl:max-w-[320px]';

/** Sticky «Запись»: под bar-хедером + липкий toolbar профиля (~6rem) + зазор */
export const masterProfileBookingStickyClass =
  'lg:sticky lg:z-10 lg:self-start lg:top-[calc(var(--slotty-header-height,4.25rem)+6.25rem)]';

export const masterProfileSectionTitle =
  'text-[22px] font-bold tracking-[-0.03em] text-[#111827]';

export const masterProfileMutedPanel = 'rounded-[12px] bg-[#F5F5F5]';

/** Правая панель client-sheet на desktop (детали услуги). */
export const clientDesktopDrawerPanel =
  'lg:w-[min(480px,42vw)] lg:min-w-[400px] lg:max-w-[520px]';

/** Шире — запись / календарь. */
export const clientDesktopDrawerPanelWide =
  'lg:w-[min(560px,46vw)] lg:min-w-[480px] lg:max-w-[600px]';
