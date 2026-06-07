import type { MasterOnboardingService } from '../../../features/profile/lib/demoMasterStorage';
import type { DemoMasterAppointment } from '../../../features/master/model/demoMasterAppointments';
import type { MySlotDto } from '../../../features/admin/api/adminSlotsApi';
import type { RepeatSettingsValue } from './repeatSettingsConfig';
import type { PlannedSlot, PlannedSlotRejectReason, ScheduleWindowView, WindowTemplate } from './scheduleTypes';

export function pad2(value: number): string {
  return value < 10 ? `0${value}` : String(value);
}

export function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

export function addMinutesToTime(startHm: string, minutes: number): string {
  const total = timeToMinutes(startHm) + minutes;
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${pad2(Math.min(23, h))}:${pad2(m)}`;
}

export function durationMinutesBetween(start: string, end: string): number {
  return Math.max(0, timeToMinutes(end) - timeToMinutes(start));
}

export function formatDurationRu(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} мин`;
  if (m === 0) return `${h} ч`;
  return `${h} ч ${m} мин`;
}

export function localDateTimeToUtcIso(dateIso: string, timeHm: string): string {
  const [y, mo, d] = dateIso.split('-').map(Number);
  const [hh, mm] = timeHm.split(':').map(Number);
  return new Date(y, (mo || 1) - 1, d || 1, hh || 0, mm || 0, 0, 0).toISOString();
}

export function parseIsoDate(iso: string): Date {
  const [yearRaw, monthRaw, dayRaw] = iso.split('-');
  return new Date(Number(yearRaw), Number(monthRaw) - 1, Number(dayRaw));
}

export function toIsoDate(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export function addDays(d: Date, days: number): Date {
  const next = new Date(d);
  next.setDate(next.getDate() + days);
  return next;
}

export function startOfLocalDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function startOfWeekMonday(d: Date): Date {
  const day = startOfLocalDay(d);
  const wd = (day.getDay() + 6) % 7;
  return addDays(day, -wd);
}

/** Пн=0 … Вс=6 */
export function getWeekdayIndex(date: Date): number {
  return (date.getDay() + 6) % 7;
}

export function isLocalDateIsoBeforeToday(dateIso: string): boolean {
  return startOfLocalDay(parseIsoDate(dateIso)).getTime() < startOfLocalDay(new Date()).getTime();
}

export function formatHmFromDate(d: Date): string {
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

export function formatSlotDate(d: Date): string {
  return new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long' }).format(d);
}

export function formatWeekdayShort(d: Date): string {
  return new Intl.DateTimeFormat('ru-RU', { weekday: 'short' }).format(d).replace('.', '');
}

export function templateDisplayLabel(template: WindowTemplate): string {
  const title = template.title?.trim();
  return title || template.serviceName;
}

export function formatPreviewLine(dateIso: string, startTime: string, endTime: string): string {
  const parts = formatPreviewSummaryParts(dateIso, startTime, endTime);
  return `${parts.dateLine}, ${parts.timeLine}`;
}

/** Первые N дат серии с тем же временем начала — для превью «сегодня и через неделю». */
export function formatRepeatStepPreviewLines(
  anchorIso: string,
  startTime: string,
  stepDays: number,
  count = 2,
): string[] {
  if (!anchorIso.trim() || !startTime.trim() || stepDays <= 0 || count <= 0) return [];

  const anchor = startOfLocalDay(parseIsoDate(anchorIso));
  const todayTs = startOfLocalDay(new Date()).getTime();
  const lines: string[] = [];

  for (let i = 0; i < count; i += 1) {
    const d = addDays(anchor, i * stepDays);
    const isToday = startOfLocalDay(d).getTime() === todayTs;
    const wd = formatWeekdayShort(d);
    const datePart = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long' }).format(d);
    const dateLabel = isToday && i === 0 ? 'Сегодня' : `${wd}, ${datePart}`;
    lines.push(`${dateLabel} · ${startTime}`);
  }

  return lines;
}

export function formatPreviewSummaryParts(
  dateIso: string,
  startTime: string,
  endTime: string,
): { dateLine: string; timeLine: string } {
  const timeLine = `${startTime}–${endTime}`;
  const trimmed = dateIso.trim();
  if (!trimmed) {
    return { dateLine: '—', timeLine };
  }

  const d = parseIsoDate(trimmed);
  if (Number.isNaN(d.getTime())) {
    return { dateLine: trimmed, timeLine };
  }

  const wd = formatWeekdayShort(d);
  const datePart = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long' }).format(d);
  return {
    dateLine: `${wd}, ${datePart}`,
    timeLine,
  };
}

/** Для карточки в превью списка окон (без дубля даты в строке). */
export function formatSlotDayParts(dateIso: string): {
  weekday: string;
  day: string;
  month: string;
  isToday: boolean;
} {
  const d = parseIsoDate(dateIso);
  const today = startOfLocalDay(new Date()).getTime() === startOfLocalDay(d).getTime();
  return {
    weekday: formatWeekdayShort(d),
    day: String(d.getDate()),
    month: new Intl.DateTimeFormat('ru-RU', { month: 'short' }).format(d).replace('.', ''),
    isToday: today,
  };
}

export function formatGroupHeader(d: Date, todayStart: Date): string {
  const ds = startOfLocalDay(d).getTime();
  const ts = todayStart.getTime();
  const dateStr = formatSlotDate(d);
  return ds === ts ? `Сегодня, ${dateStr}` : dateStr;
}

export function formatWeekRangeLabel(weekStart: Date): string {
  const weekEnd = addDays(weekStart, 6);
  const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
  const a = new Intl.DateTimeFormat('ru-RU', opts).format(weekStart);
  const b = new Intl.DateTimeFormat('ru-RU', { ...opts, year: 'numeric' }).format(weekEnd);
  return `${a} – ${b}`;
}

export function startOfMonth(d: Date): Date {
  const x = startOfLocalDay(d);
  x.setDate(1);
  return x;
}

export function addMonths(d: Date, months: number): Date {
  const x = new Date(d);
  x.setDate(1);
  x.setMonth(x.getMonth() + months);
  return x;
}

export function formatMonthYearLabel(monthStart: Date): string {
  return new Intl.DateTimeFormat('ru-RU', { month: 'long', year: 'numeric' }).format(monthStart);
}

export function isTodayIso(dateIso: string): boolean {
  return startOfLocalDay(parseIsoDate(dateIso)).getTime() === startOfLocalDay(new Date()).getTime();
}

export type MonthDayCell = {
  dateIso: string;
  inCurrentMonth: boolean;
};

/** Сетка 6×7: понедельник — первый столбец. */
export function buildMonthGrid(monthAnchor: Date): MonthDayCell[] {
  const monthStart = startOfMonth(monthAnchor);
  const gridStart = startOfWeekMonday(monthStart);
  const monthIndex = monthStart.getMonth();
  return Array.from({ length: 42 }, (_, i) => {
    const d = addDays(gridStart, i);
    return {
      dateIso: toIsoDate(d),
      inCurrentMonth: d.getMonth() === monthIndex,
    };
  });
}

export type DayWindowStats = {
  total: number;
  booked: number;
  free: number;
  blocked: number;
};

export function indexWindowsByDate(windows: { dateIso: string; status: string }[]): Map<string, DayWindowStats> {
  const map = new Map<string, DayWindowStats>();
  for (const w of windows) {
    const cur = map.get(w.dateIso) ?? { total: 0, booked: 0, free: 0, blocked: 0 };
    cur.total += 1;
    if (w.status === 'booked') cur.booked += 1;
    else if (w.status === 'free') cur.free += 1;
    else if (w.status === 'blocked') cur.blocked += 1;
    map.set(w.dateIso, cur);
  }
  return map;
}

export function findActiveAppointmentForSlot(
  slotId: string,
  slot: MySlotDto,
  appointments: DemoMasterAppointment[],
): DemoMasterAppointment | undefined {
  const active = appointments.filter((a) => a.status === 'pending' || a.status === 'confirmed');
  const bySlotId = active.find((a) => a.slotId === slotId);
  if (bySlotId) return bySlotId;

  const start = new Date(slot.startsAt);
  const dateIso = toIsoDate(start);
  const time = formatHmFromDate(start);
  return active.find((a) => a.date === dateIso && a.time === time);
}

export function isScheduleWindowBooked(
  window: Pick<ScheduleWindowView, 'id' | 'status' | 'slot'>,
  appointments: DemoMasterAppointment[] = [],
): boolean {
  if (window.status === 'booked') return true;
  if (window.slot.status === 'booked') return true;
  return Boolean(findActiveAppointmentForSlot(window.id, window.slot, appointments));
}

export const MSG_SCHEDULE_WINDOW_BOOKED =
  'На это окно есть запись — удалить нельзя. Сначала отмените запись в разделе «Заявки».';

function windowsCountWordRu(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 14) return 'окон';
  if (mod10 === 1) return 'окно';
  if (mod10 >= 2 && mod10 <= 4) return 'окна';
  return 'окон';
}

export function windowsCountLabelRu(n: number): string {
  return windowsCountWordRu(n);
}

export function windowsCountRu(n: number): string {
  return `${n} ${windowsCountWordRu(n)}`;
}

export function groupPlannedSlotsByDay(
  slots: PlannedSlot[],
): Array<{ dateIso: string; slots: PlannedSlot[] }> {
  const map = new Map<string, PlannedSlot[]>();
  for (const slot of slots) {
    const daySlots = map.get(slot.dateIso);
    if (daySlots) daySlots.push(slot);
    else map.set(slot.dateIso, [slot]);
  }

  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([dateIso, daySlots]) => ({
      dateIso,
      slots: daySlots.sort((a, b) => a.startTime.localeCompare(b.startTime)),
    }));
}

export function serviceTitleById(services: MasterOnboardingService[], id: string | null): string {
  if (!id) return 'Любая услуга';
  return services.find((x) => x.id === id)?.title ?? 'Услуга';
}

export function isStartWithinScheduleHorizon(startMs: number, horizonDays: number | null): boolean {
  if (horizonDays == null || horizonDays <= 0) return true;
  return startMs <= Date.now() + horizonDays * 24 * 60 * 60 * 1000;
}

export function evaluatePlannedSlot(
  p: PlannedSlot,
  now: number,
  horizonDays: number | null,
): { ok: true } | { ok: false; reason: PlannedSlotRejectReason } {
  if (timeToMinutes(p.endTime) <= timeToMinutes(p.startTime)) {
    return { ok: false, reason: 'invalid_time' };
  }
  const startMs = new Date(localDateTimeToUtcIso(p.dateIso, p.startTime)).getTime();
  const endMs = new Date(localDateTimeToUtcIso(p.dateIso, p.endTime)).getTime();
  if (endMs - startMs < 10 * 60 * 1000) return { ok: false, reason: 'short' };
  if (startMs <= now) return { ok: false, reason: 'past' };
  if (!isStartWithinScheduleHorizon(startMs, horizonDays)) return { ok: false, reason: 'horizon' };
  return { ok: true };
}

export function rangesOverlapMs(aStart: number, aEnd: number, bStart: number, bEnd: number): boolean {
  return aStart < bEnd && aEnd > bStart;
}

export function isHorizonLimitErrorMessage(message: string): boolean {
  return /горизонт|тариф/i.test(message);
}

export function expandRepeatDates(anchorIso: string, settings: RepeatSettingsValue): string[] {
  const {
    kind,
    weeklyCount,
    biweeklyCount,
    weekdaySpanWeeks,
    pickWeekdayMask,
    pickWeekdaysSpanWeeks,
  } = settings;
  const anchor = startOfLocalDay(parseIsoDate(anchorIso));
  const out: string[] = [];
  const pushUnique = (iso: string) => {
    if (!out.includes(iso)) out.push(iso);
  };

  if (kind === 'none') {
    pushUnique(anchorIso);
    return out;
  }
  if (kind === 'weekly') {
    for (let i = 0; i < weeklyCount; i += 1) pushUnique(toIsoDate(addDays(anchor, i * 7)));
    return out;
  }
  if (kind === 'biweekly') {
    for (let i = 0; i < biweeklyCount; i += 1) pushUnique(toIsoDate(addDays(anchor, i * 14)));
    return out;
  }
  if (kind === 'weekdays') {
    const span = weekdaySpanWeeks * 7;
    for (let d = 0; d < span; d += 1) {
      const day = addDays(anchor, d);
      if (getWeekdayIndex(day) <= 4) pushUnique(toIsoDate(day));
    }
    return out;
  }
  if (kind === 'pick_weekdays') {
    if (!pickWeekdayMask.some(Boolean)) return [];
    const span = pickWeekdaysSpanWeeks * 7;
    for (let d = 0; d < span; d += 1) {
      const day = addDays(anchor, d);
      const wd = getWeekdayIndex(day);
      if (pickWeekdayMask[wd]) pushUnique(toIsoDate(day));
    }
    return out;
  }
  return [anchorIso];
}

export function countRepeatDates(anchorIso: string, settings: RepeatSettingsValue): number {
  if (!anchorIso.trim()) return 0;
  return expandRepeatDates(anchorIso, settings).length;
}

export function buildPlannedSlots(
  dateIso: string,
  startTime: string,
  endTime: string,
  serviceId: string | null,
  repeat: RepeatSettingsValue,
): PlannedSlot[] {
  const dates = expandRepeatDates(dateIso, repeat);
  return dates.map((d) => ({ dateIso: d, startTime, endTime, serviceId }));
}
