const BASE = '/photos/quick-setup';
const QUICK_SETUP_ORIGINAL_DIR = `/photos/${encodeURIComponent('Быстрая настройка')}`;

export const SCHEDULE_QUICK_SETUP_IMAGES = {
  today: `${BASE}/1.webp`,
  week: `${BASE}/2.webp`,
  month: `${BASE}/3.webp`,
  fromSchedule: `${BASE}/4.webp`,
  templatesBg: `${BASE}/templates-bg.webp`,
  /** Фон hero вкладки «Список» (`public/photos/Быстрая настройка/задний фон.webp`). */
  listHeroBg: `${QUICK_SETUP_ORIGINAL_DIR}/${encodeURIComponent('задний фон.webp')}`,
  /** Фон кнопки «+» и активного таба «Создать» на мобилке. */
  tabCreateActiveBg: `${QUICK_SETUP_ORIGINAL_DIR}/${encodeURIComponent('задний фон.webp')}`,
} as const;
