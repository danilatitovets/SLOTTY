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

/** Фон страницы профиля — чуть теплее каталога. */
export const masterProfileCanvasClass = 'bg-[#F6F6F7]';

/** Белая карточка профиля — плоская, без тени (как catalogDesktopPanel). */
export const masterProfileCard = 'rounded-[24px] bg-white';

/** Десктоп: main ~68% + sidebar 340px */
export const masterProfileDesktopLayout =
  'lg:flex lg:items-start lg:gap-8 xl:gap-10';

export const masterProfileDesktopMainCol =
  'min-w-0 flex-1 lg:max-w-[calc(100%-22.5rem)] xl:max-w-none';

export const masterProfileDesktopSidebarCol =
  'flex w-full shrink-0 flex-col gap-4 lg:w-[340px] lg:max-w-[340px]';

/** Правая колонка профиля — обычный поток, без sticky (иначе длинный блок «ломается»). */
export const masterProfileSidebarColClass = 'w-full min-w-0';

export const masterProfileSectionTitle =
  'text-[22px] font-bold tracking-[-0.03em] text-[#111827]';

export const masterProfileMutedPanel = 'rounded-[12px] bg-[#F5F5F5]';

/** Навигация по секциям профиля — сегмент как в каталоге. */
export const masterProfileSectionNavTray =
  'rounded-[14px] bg-[#F5F5F5] p-1';

export const masterProfileSectionNavTabActive =
  'bg-[#F47C8C] text-white';

export const masterProfileSectionNavTabIdle =
  'bg-white text-[#374151] hover:bg-[#FAFAFA] hover:text-[#111827]';

export function masterProfileToolbarPositionClass(scrolled: boolean, layout: 'desktop' | 'mobile'): string {
  if (scrolled) {
    return layout === 'desktop'
      ? 'fixed top-[var(--slotty-header-height)]'
      : 'fixed top-0';
  }
  return 'absolute top-0';
}

export const masterProfileToolbarShellBase =
  'inset-x-0 z-[45] w-full transition-[background-color,border-color,box-shadow] duration-300 ease-out';

export function masterProfileToolbarSurfaceClass(scrolled: boolean): string {
  return scrolled
    ? 'border-b border-[#EEEEEE] bg-white shadow-[0_1px_0_rgba(0,0,0,0.04)]'
    : 'border-b border-transparent bg-transparent shadow-none';
}

/** Overlap карточки профиля на низ обложки. */
export const masterProfileHeroContentOverlapClass =
  'relative z-10 -mt-14 lg:-mt-[4.5rem]';

/** @deprecated use masterProfileToolbarShellBase + masterProfileToolbarPositionClass */
export const masterProfileMobileToolbarStickyBase =
  'sticky z-40 top-0 w-full transition-[background-color,border-color,box-shadow] duration-300 ease-out';

/** @deprecated use masterProfileToolbarShellBase + masterProfileToolbarPositionClass */
export const masterProfileDesktopToolbarStickyBase =
  'sticky z-[45] top-[var(--slotty-header-height)] w-full transition-[background-color,border-color,box-shadow] duration-300 ease-out';

/** @deprecated use *StickyBase + masterProfileToolbarSurfaceClass */
export const masterProfileMobileToolbarSticky =
  'sticky z-40 top-[max(0.25rem,env(safe-area-inset-top,0px))] w-full border-b border-[#EEEEEE] bg-white';

/** @deprecated use *StickyBase + masterProfileToolbarSurfaceClass */
export const masterProfileDesktopToolbarSticky =
  'sticky z-30 top-[var(--slotty-header-height)] w-full border-b border-[#EEEEEE] bg-white';

/** Контент toolbar выровнен с телом профиля (1240px). */
export const masterProfileToolbarInnerShell =
  'mx-auto w-full max-w-[1240px] px-6 xl:px-10';

/** Обложка hero на всю ширину viewport (Kwork-style bleed). */
export const masterProfileHeroBleedClass =
  'relative left-1/2 w-screen max-w-[100vw] -translate-x-1/2';

/** Правая панель client-sheet на desktop (детали услуги). */
export const clientDesktopDrawerPanel =
  'lg:w-[min(480px,42vw)] lg:min-w-[400px] lg:max-w-[520px]';

/** Шире — запись / календарь. */
export const clientDesktopDrawerPanelWide =
  'lg:w-[min(560px,46vw)] lg:min-w-[480px] lg:max-w-[600px]';
