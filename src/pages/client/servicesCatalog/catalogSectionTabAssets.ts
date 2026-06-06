const DIR = `/photos/${encodeURIComponent('кнопик')}`;

/** Фоны переключателя «Услуги / Мастера» (`public/photos/кнопик/`). */
export const CATALOG_SECTION_TAB_BG = {
  services: `${DIR}/${encodeURIComponent('услуги.webp')}`,
  masters: `${DIR}/${encodeURIComponent('мастера.webp')}`,
} as const;
