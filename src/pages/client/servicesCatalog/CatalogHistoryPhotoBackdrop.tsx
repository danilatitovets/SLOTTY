import { catalogHeroPhotoBg } from './catalogFilterSheetTheme';
import {
  CATALOG_HERO_PHOTO_HEIGHT_FACTOR,
  CATALOG_HERO_PHOTO_TRANSLATE_Y,
} from './catalogDesktopHeroLayout';

/** Hero поиска каталога — фон лендинга, кадр сдвинут вверх (тёмная полоса в файле обрезается). */
export function CatalogHistoryPhotoBackdrop() {
  return (
    <img
      src={catalogHeroPhotoBg}
      alt=""
      aria-hidden
      className="pointer-events-none absolute left-0 right-0 top-0 w-full object-cover object-top"
      style={{
        height: `calc((100% + 5rem) * ${CATALOG_HERO_PHOTO_HEIGHT_FACTOR})`,
        transform: `translateY(${CATALOG_HERO_PHOTO_TRANSLATE_Y})`,
      }}
      loading="eager"
      decoding="async"
    />
  );
}
