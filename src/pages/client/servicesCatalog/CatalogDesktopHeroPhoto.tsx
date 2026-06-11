import { catalogHeroPhotoBg } from './catalogFilterSheetTheme';
import {
  CATALOG_DESKTOP_SEARCH_HEIGHT_VAR,
  CATALOG_HERO_PHOTO_HEIGHT_FACTOR,
  CATALOG_HERO_PHOTO_TRANSLATE_Y,
} from './catalogDesktopHeroLayout';

/** Фон каталога: от верха viewport (под sticky-шапкой) до блока поиска. */
export function CatalogDesktopHeroPhoto() {
  return (
    <div
      className="pointer-events-none absolute left-1/2 z-0 hidden w-screen max-w-[100vw] -translate-x-1/2 overflow-hidden lg:block"
      style={{
        top: 'calc(-1 * var(--slotty-header-height, 4.25rem))',
        height: `calc(var(--slotty-header-height, 4.25rem) + var(${CATALOG_DESKTOP_SEARCH_HEIGHT_VAR}, 4.5rem))`,
      }}
      aria-hidden
    >
      <img
        src={catalogHeroPhotoBg}
        alt=""
        className="w-full object-cover object-top"
        style={{
          height: `${CATALOG_HERO_PHOTO_HEIGHT_FACTOR * 100}%`,
          transform: `translateY(${CATALOG_HERO_PHOTO_TRANSLATE_Y})`,
        }}
        loading="eager"
        decoding="async"
      />
    </div>
  );
}
