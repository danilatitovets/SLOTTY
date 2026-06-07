import type { MasterTopAchievementKind } from './resolveMasterTopRankStatus';

const ACHIEVEMENTS_DIR = `/photos/${encodeURIComponent('достижения')}`;

function achievementArt(filename: string): string {
  return `${ACHIEVEMENTS_DIR}/${encodeURIComponent(filename)}`;
}

/** Иллюстрации призов — имена файлов соответствуют типам достижений. */
export const MASTER_ACHIEVEMENT_ART: Record<MasterTopAchievementKind, string> = {
  week: achievementArt('В топе недели · Лучший результат за 7 дней.png'),
  month: achievementArt('1 место · В топе месяца · Стабильный результат за месяц.png'),
  rating: achievementArt('4.5-5.0 · Лучший рейтинг · Высокая оценка клиентов.png'),
  reviews: achievementArt('“2 отзыва · Много отзывов · Клиенты делятся впечатлениями.png'),
  new: achievementArt('Недавно на Slotty · Новая звезда · Профиль активно развивается.png'),
};

/** Пустой блок достижений на публичном профиле. */
export const MASTER_ACHIEVEMENTS_EMPTY_ART = achievementArt('нет достиедний.png');
