/**
 * Правила отображаемого имени мастера / студии: не только цифры и знаки,
 * при смеси с цифрами — букв должно быть больше, чем цифр (простая защита от мусора и шаблонных вводов).
 *
 * Держите в синхроне с `src/shared/lib/masterDisplayNamePolicy.ts`.
 */

const GARBAGE_MASTER_NAMES = new Set([
  'фыв',
  'йцу',
  'asd',
  'qwe',
  'zxc',
  'dsa',
  'ewq',
  'cxz',
  'фыва',
  'йцук',
  'test',
  'тест',
  'имя',
  'name',
  'user',
  'user1',
  'admin',
]);

/**
 * @param trimmed — уже `trim()`, длина ≥ 2 (проверьте снаружи)
 * @returns текст ошибки для пользователя или `null`, если по качеству всё ок
 */
export function getMasterDisplayNameQualityError(trimmed: string): string | null {
  if (trimmed.length < 2) return null;

  if (!/\p{L}/u.test(trimmed)) {
    return 'В имени нужна хотя бы одна буква (нельзя только цифры и знаки).';
  }

  const letters = trimmed.match(/\p{L}/gu)?.length ?? 0;
  const digits = (trimmed.match(/\d/g) ?? []).length;
  if (digits > 0 && letters <= digits) {
    return 'Букв в имени должно быть больше, чем цифр.';
  }

  const lower = trimmed.toLowerCase();
  if (/^(.)\1+$/u.test(lower)) {
    return 'Имя не должно состоять из одного повторяющегося символа.';
  }

  if (GARBAGE_MASTER_NAMES.has(lower)) {
    return 'Укажите настоящее имя или название, под которым вас увидят клиенты.';
  }

  return null;
}

/** Для Zod / сервера: одна булева проверка после min/max длины. */
export function masterDisplayNamePassesQuality(trimmed: string): boolean {
  return getMasterDisplayNameQualityError(trimmed) === null;
}
