import { catalogListGap } from './servicesCatalogTheme';

/** Десктоп-каталог: горизонтальные карточки на всю ширину */
export function desktopCardLayout(): 'wide' {
  return 'wide';
}

export function desktopGridClassName(): string {
  return catalogListGap;
}

/** Мобильный каталог — плитка 2 колонки как в маркетплейсах */
export function mobileCardLayout(): 'grid' {
  return 'grid';
}

export function mobileGridClassName(): string {
  return 'grid grid-cols-2 items-start gap-2.5';
}

/** Один список без дублирующих секций */
export function shouldUseUnifiedCatalogSections(
  layout: 'mobile' | 'desktop',
  itemCount: number,
): boolean {
  return itemCount > 0;
}
