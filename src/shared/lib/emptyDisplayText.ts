/** Человекочитаемые подписи вместо «—» в интерфейсе. */

/** Внутренний маркер «адрес не задан» в DTO — не показывать пользователю как есть. */
export const LOCATION_EMPTY_SENTINEL = '—';

export const EMPTY_FIELD = 'Не указано';
export const EMPTY_CONTACTS = 'Пока не добавлены';
export const EMPTY_ABOUT = 'Расскажите о себе — клиенты увидят это в профиле';
export const EMPTY_SCHEDULE_PREVIEW = 'пока не настроен';
export const EMPTY_DURATION = 'Не задана';
export const EMPTY_METRIC = 'Пока нет';
export const EMPTY_TREND = 'Нет данных';
export const EMPTY_DISTANCE = 'Не определено';
export const EMPTY_PROMO_PRICE = 'Укажите скидку';
export const EMPTY_CLIENT = 'Не указан';
export const EMPTY_DATE = 'Дата неизвестна';
export const EMPTY_ADDRESS = 'Адрес не указан';
export const EMPTY_PRICE = 'Цена по запросу';
export const EMPTY_SLOT = 'Нет окон';
export const EMPTY_BOOKING_DATE = 'Выберите дату';
export const EMPTY_BOOKING_TIME = 'Выберите время';
export const EMPTY_TELEGRAM = 'Не подключён';
export const EMPTY_NOT_LINKED = 'Не привязан';
export const EMPTY_AMOUNT = 'Не указана';

export function isEmptyDisplayValue(value?: string | null): boolean {
  const trimmed = value?.trim() ?? '';
  return !trimmed || trimmed === LOCATION_EMPTY_SENTINEL;
}

export function displayOrEmpty(value?: string | null, fallback = EMPTY_FIELD): string {
  if (isEmptyDisplayValue(value)) return fallback;
  return value!.trim();
}

export function valueOrEmptyField(value?: string | null, fallback = EMPTY_FIELD): string {
  return displayOrEmpty(value, fallback);
}

export function formatOptionalByn(amount: number, emptyLabel = EMPTY_METRIC): string {
  return amount > 0 ? `${amount} BYN` : emptyLabel;
}

export function formatOptionalPriceRange(
  min: number,
  max: number,
  total: number,
  emptyLabel = EMPTY_METRIC,
): string {
  if (total <= 0) return emptyLabel;
  if (min !== max) return `${min}–${max} BYN`;
  return `${min} BYN`;
}
