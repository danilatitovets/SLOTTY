import type { RepeatKind } from './scheduleTypes';

export type WeeklyRepeatCount = 4 | 8 | 12;
export type BiweeklyRepeatCount = 4 | 6 | 8;
export type WeekdaySpanWeeks = 1 | 2 | 4;
export type PickWeekdaysSpanWeeks = 2 | 4 | 8;

/** 7 дней: пн … вс (индекс как в getWeekdayIndex). */
export type WeekdayMask = [
  boolean,
  boolean,
  boolean,
  boolean,
  boolean,
  boolean,
  boolean,
];

export type RepeatSettingsValue = {
  kind: RepeatKind;
  weeklyCount: WeeklyRepeatCount;
  biweeklyCount: BiweeklyRepeatCount;
  weekdaySpanWeeks: WeekdaySpanWeeks;
  pickWeekdayMask: WeekdayMask;
  pickWeekdaysSpanWeeks: PickWeekdaysSpanWeeks;
};

export const WEEKDAY_SHORT = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'] as const;

export const DEFAULT_WEEKDAY_MASK: WeekdayMask = [true, true, true, true, true, false, false];

export const DEFAULT_REPEAT_SETTINGS: RepeatSettingsValue = {
  kind: 'none',
  weeklyCount: 4,
  biweeklyCount: 4,
  weekdaySpanWeeks: 2,
  pickWeekdayMask: DEFAULT_WEEKDAY_MASK,
  pickWeekdaysSpanWeeks: 4,
};

export type RepeatKindOption = {
  value: RepeatKind;
  label: string;
  description: string;
  /** Шаг в днях — показываем на карточке выбора. */
  intervalDays?: number;
};

export const REPEAT_KIND_OPTIONS: RepeatKindOption[] = [
  { value: 'none', label: 'Без повтора', description: 'Только выбранная дата' },
  { value: 'weekly', label: 'Каждую неделю', description: 'Тот же день недели', intervalDays: 7 },
  { value: 'biweekly', label: 'Каждые 2 недели', description: 'Тот же день, шаг 14 дней', intervalDays: 14 },
  { value: 'weekdays', label: 'По будням', description: 'Пн–пт' },
  { value: 'pick_weekdays', label: 'Дни недели', description: 'Выберите дни' },
];

export const WEEKLY_COUNT_OPTIONS: { value: WeeklyRepeatCount; label: string }[] = [
  { value: 4, label: '4 недели' },
  { value: 8, label: '8 недель' },
  { value: 12, label: '12 недель' },
];

export const BIWEEKLY_COUNT_OPTIONS: { value: BiweeklyRepeatCount; label: string }[] = [
  { value: 4, label: '4 раза' },
  { value: 6, label: '6 раз' },
  { value: 8, label: '8 раз' },
];

export const WEEKDAY_SPAN_OPTIONS: { value: WeekdaySpanWeeks; label: string }[] = [
  { value: 1, label: '1 неделя' },
  { value: 2, label: '2 недели' },
  { value: 4, label: '4 недели' },
];

export const PICK_WEEKDAYS_SPAN_OPTIONS: { value: PickWeekdaysSpanWeeks; label: string }[] = [
  { value: 2, label: '2 недели' },
  { value: 4, label: '4 недели' },
  { value: 8, label: '8 недель' },
];

export function formatRepeatDetail(settings: RepeatSettingsValue): string {
  switch (settings.kind) {
    case 'none':
      return 'Только на выбранную дату';
    case 'weekly':
      return `Каждую неделю · ${settings.weeklyCount} ${weeksLabel(settings.weeklyCount)}`;
    case 'biweekly':
      return `Каждые 2 недели · ${settings.biweeklyCount} ${timesLabel(settings.biweeklyCount)}`;
    case 'weekdays':
      return `Пн–пт · ${settings.weekdaySpanWeeks} ${weeksLabel(settings.weekdaySpanWeeks)}`;
    case 'pick_weekdays': {
      const days = settings.pickWeekdayMask
        .map((on, i) => (on ? WEEKDAY_SHORT[i] : null))
        .filter(Boolean)
        .join(', ');
      return days
        ? `${days} · ${settings.pickWeekdaysSpanWeeks} ${weeksLabel(settings.pickWeekdaysSpanWeeks)}`
        : 'Выберите дни недели';
    }
    default:
      return '';
  }
}

export function formatRepeatSummary(settings: RepeatSettingsValue, _dateCount?: number): string {
  return formatRepeatDetail(settings);
}

export type RepeatSummaryRow = { label: string; value: string };

/** Строки для карточки «Итог» — без разделителей «·». */
export function formatRepeatSummaryRows(
  settings: RepeatSettingsValue,
  dateCount?: number,
): RepeatSummaryRow[] {
  if (settings.kind === 'none') {
    return [{ label: 'Повтор', value: 'Без повтора' }];
  }

  const kindLabel = REPEAT_KIND_OPTIONS.find((o) => o.value === settings.kind)?.label ?? '';
  const rows: RepeatSummaryRow[] = [{ label: 'Повтор', value: kindLabel }];

  switch (settings.kind) {
    case 'weekly':
      rows.push({
        label: 'Период',
        value: `${settings.weeklyCount} ${weeksLabel(settings.weeklyCount)}`,
      });
      break;
    case 'biweekly':
      rows.push({
        label: 'Серия',
        value: `${settings.biweeklyCount} ${timesLabel(settings.biweeklyCount)}`,
      });
      break;
    case 'weekdays':
      rows.push({
        label: 'Период',
        value: `${settings.weekdaySpanWeeks} ${weeksLabel(settings.weekdaySpanWeeks)}`,
      });
      rows.push({ label: 'Дни', value: 'Пн–Пт' });
      break;
    case 'pick_weekdays': {
      const days = settings.pickWeekdayMask
        .map((on, i) => (on ? WEEKDAY_SHORT[i] : null))
        .filter(Boolean)
        .join(', ');
      rows.push({ label: 'Дни', value: days || 'Не выбраны' });
      rows.push({
        label: 'Период',
        value: `${settings.pickWeekdaysSpanWeeks} ${weeksLabel(settings.pickWeekdaysSpanWeeks)}`,
      });
      break;
    }
    default:
      break;
  }

  if (dateCount != null && dateCount > 0) {
    rows.push({ label: 'Дат в серии', value: `${dateCount} ${datesLabel(dateCount)}` });
  }

  return rows;
}

function weeksLabel(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return 'неделя';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return 'недели';
  return 'недель';
}

function timesLabel(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return 'раз';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return 'раза';
  return 'раз';
}

function datesLabel(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return 'дата';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return 'даты';
  return 'дат';
}

export function patchRepeatSettings(
  prev: RepeatSettingsValue,
  patch: Partial<RepeatSettingsValue>,
): RepeatSettingsValue {
  return { ...prev, ...patch };
}
