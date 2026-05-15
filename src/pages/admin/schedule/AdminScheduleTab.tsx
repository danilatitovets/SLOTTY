import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import type { MasterDraft, MasterSchedule } from '../../../features/profile/lib/demoMasterStorage';
import { SlottySelect } from '../../../shared/ui/SlottySelect';
import { mergeScheduleTimeSelectOptions } from './scheduleTimeSelectOptions';
import { AdminMasterRealSlotsPanel } from './AdminMasterRealSlotsPanel';
import { useAdminMasterCabinet } from '../AdminMasterCabinetContext';
import { useAdminMasterDraft } from '../useAdminMasterData';
import { ADMIN_SERVICES_PATH } from '../../../app/paths';

type ScheduleWindow = {
  id: string;
  startTime: string;
  endTime: string;
};

type DateSlotDay = {
  date: string;
  windows: ScheduleWindow[];
};

type DateSlotRule = {
  serviceId: string | 'all';
  days: DateSlotDay[];
  gapMinutes: number;
  bookingHorizonDays: number;
};

type ScheduleWithDateSlots = MasterSchedule & {
  dateSlotRules?: DateSlotRule[];
};

type ScheduleMode = 'weekly' | 'manual';

type WeeklyDayConfig = {
  uiWeekday: number;
  enabled: boolean;
  intervals: ScheduleWindow[];
};

type Props = {
  draft: MasterDraft;
  onPersist: (next: MasterDraft) => void;
};

const WEEKDAY_NAMES = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'] as const;

const BOOKING_HORIZON_OPTIONS = [14, 30, 60, 90] as const;
const GAP_OPTIONS = [0, 5, 10, 15, 30] as const;
const MIN_LEAD_OPTIONS = [1, 3, 6, 12, 24] as const;

function IconPlus({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
    </svg>
  );
}

function IconClose({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
    </svg>
  );
}

function newId(prefix = 'id'): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function pad2(value: number): string {
  return value < 10 ? `0${value}` : String(value);
}

function timeToMinutes(time: string): number {
  const [hoursRaw, minutesRaw] = time.split(':');
  const hours = Number(hoursRaw);
  const minutes = Number(minutesRaw);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return 0;
  return hours * 60 + minutes;
}

function createWindow(startTime = '10:00', endTime = '18:00'): ScheduleWindow {
  return { id: newId('window'), startTime, endTime };
}

function startOfDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function toIsoDate(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function parseIsoDate(iso: string): Date {
  const [yearRaw, monthRaw, dayRaw] = iso.split('-');
  return new Date(Number(yearRaw), Number(monthRaw) - 1, Number(dayRaw));
}

/** Пн=0 … Вс=6 */
function getWeekdayIndex(date: Date): number {
  return (date.getDay() + 6) % 7;
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function getScheduleRules(schedule: MasterSchedule): DateSlotRule[] {
  const nextSchedule = schedule as ScheduleWithDateSlots;
  return Array.isArray(nextSchedule.dateSlotRules) ? nextSchedule.dateSlotRules : [];
}

function anchorIsoForUiWeekday(uiWeekday: number): string {
  const today = startOfDay(new Date());
  for (let i = 0; i < 14; i += 1) {
    const d = addDays(today, i);
    if (getWeekdayIndex(d) === uiWeekday) return toIsoDate(d);
  }
  return toIsoDate(today);
}

function validateIntervals(windows: ScheduleWindow[]): string | null {
  const sorted = [...windows].sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
  for (const window of sorted) {
    if (timeToMinutes(window.endTime) <= timeToMinutes(window.startTime)) {
      return 'Время окончания должно быть позже начала.';
    }
  }
  for (let i = 1; i < sorted.length; i += 1) {
    const previous = sorted[i - 1];
    const current = sorted[i];
    if (!previous || !current) continue;
    if (timeToMinutes(current.startTime) < timeToMinutes(previous.endTime)) {
      return 'Интервалы не должны пересекаться.';
    }
  }
  return null;
}

function hydrateWeeklyFromSchedule(schedule: MasterSchedule): WeeklyDayConfig[] {
  const rules = getScheduleRules(schedule);
  const allRule = rules.find((r) => r.serviceId === 'all') ?? rules[0];
  const picked: Record<number, ScheduleWindow[] | undefined> = {};

  if (allRule?.days.length) {
    const sorted = [...allRule.days].sort((a, b) => parseIsoDate(a.date).getTime() - parseIsoDate(b.date).getTime());
    for (const day of sorted) {
      if (day.windows.length === 0) continue;
      const wd = getWeekdayIndex(parseIsoDate(day.date));
      if (!picked[wd]) {
        picked[wd] = day.windows.map((w) => ({ ...w, id: w.id || newId('window') }));
      }
    }
  }

  return [0, 1, 2, 3, 4, 5, 6].map((uiWeekday) => {
    const fromRule = picked[uiWeekday];
    if (fromRule?.length) {
      return { uiWeekday, enabled: true, intervals: fromRule.map((w) => ({ ...w })) };
    }
    if (schedule.workDays.includes(uiWeekday)) {
      return {
        uiWeekday,
        enabled: true,
        intervals: [createWindow(schedule.startTime, schedule.endTime)],
      };
    }
    return { uiWeekday, enabled: false, intervals: [createWindow('10:00', '18:00')] };
  });
}

function buildMasterScheduleFromWeekly(
  daysConfig: WeeklyDayConfig[],
  gapMinutes: number,
  bookingHorizonDays: number,
): MasterSchedule {
  const dateSlotDays: DateSlotDay[] = daysConfig.map((d) => {
    const windows = !d.enabled
      ? []
      : d.intervals
          .map((w) => ({
            id: w.id || newId('window'),
            startTime: w.startTime.trim(),
            endTime: w.endTime.trim(),
          }))
          .filter((w) => timeToMinutes(w.endTime) > timeToMinutes(w.startTime))
          .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

    return { date: anchorIsoForUiWeekday(d.uiWeekday), windows };
  });

  dateSlotDays.sort((a, b) => parseIsoDate(a.date).getTime() - parseIsoDate(b.date).getTime());

  const workingUi = daysConfig
    .filter(
      (d) =>
        d.enabled &&
        d.intervals.some((w) => timeToMinutes(w.endTime) > timeToMinutes(w.startTime)),
    )
    .map((d) => d.uiWeekday)
    .sort((a, b) => a - b);

  const firstWorking = daysConfig.find(
    (d) => d.enabled && d.intervals.some((w) => timeToMinutes(w.endTime) > timeToMinutes(w.startTime)),
  );
  const firstWin = firstWorking?.intervals.find(
    (w) => timeToMinutes(w.endTime) > timeToMinutes(w.startTime),
  );

  return {
    workDays: workingUi,
    startTime: firstWin?.startTime ?? '10:00',
    endTime: firstWin?.endTime ?? '18:00',
    gapMinutes,
    dateSlotRules: [
      {
        serviceId: 'all',
        days: dateSlotDays,
        gapMinutes,
        bookingHorizonDays,
      },
    ],
  } as MasterSchedule;
}

function combineDateAndTime(day: Date, timeHm: string): Date {
  const [h, m] = timeHm.split(':').map(Number);
  const x = new Date(day);
  x.setHours(h || 0, m || 0, 0, 0);
  return x;
}

function getNearestWeeklyPreview(
  daysConfig: WeeklyDayConfig[],
  horizonDays: number,
  minLeadHours: number,
): string | null {
  const earliestMs = Date.now() + minLeadHours * 60 * 60 * 1000;
  const today0 = startOfDay(new Date());
  for (let i = 0; i <= horizonDays; i += 1) {
    const d = addDays(today0, i);
    const wd = getWeekdayIndex(d);
    const cfg = daysConfig.find((c) => c.uiWeekday === wd);
    if (!cfg?.enabled) continue;
    const sorted = [...cfg.intervals].sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
    for (const w of sorted) {
      if (timeToMinutes(w.endTime) <= timeToMinutes(w.startTime)) continue;
      const slotStart = combineDateAndTime(d, w.startTime);
      if (slotStart.getTime() >= earliestMs) {
        const datePart = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long' }).format(slotStart);
        const timePart = slotStart.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
        return `${capitalize(datePart)}, ${timePart}`;
      }
    }
  }
  return null;
}

function serviceIsActive(service: { isActive?: boolean }): boolean {
  return service.isActive !== false;
}

export function AdminScheduleTab({ draft, onPersist }: Props) {
  const { useCabinetApi } = useAdminMasterCabinet();
  const { flushScheduleToBackend } = useAdminMasterDraft();

  const visibleServices = useMemo(() => draft.services.filter(serviceIsActive), [draft.services]);

  const [mode, setMode] = useState<ScheduleMode>('weekly');
  const [weeklyDays, setWeeklyDays] = useState<WeeklyDayConfig[]>(() => hydrateWeeklyFromSchedule(draft.schedule));

  const rules = getScheduleRules(draft.schedule);
  const allRule = rules.find((r) => r.serviceId === 'all') ?? rules[0];
  const initialHorizon = allRule?.bookingHorizonDays;
  const [bookingHorizonDays, setBookingHorizonDays] = useState<number>(() =>
    BOOKING_HORIZON_OPTIONS.includes(initialHorizon as (typeof BOOKING_HORIZON_OPTIONS)[number])
      ? initialHorizon!
      : 30,
  );
  const [gapMinutes, setGapMinutes] = useState<number>(() => {
    const g = allRule?.gapMinutes ?? draft.schedule.gapMinutes ?? 0;
    return GAP_OPTIONS.includes(g as (typeof GAP_OPTIONS)[number]) ? g : 0;
  });
  /** TODO(api): сохранить на сервере минимальный срок до записи, когда появится поле в API. */
  const [minLeadHours, setMinLeadHours] = useState<number>(3);

  const [weeklyError, setWeeklyError] = useState<string | null>(null);
  const [weeklyToast, setWeeklyToast] = useState<string | null>(null);
  const [weeklySaving, setWeeklySaving] = useState(false);

  useEffect(() => {
    setWeeklyDays(hydrateWeeklyFromSchedule(draft.schedule));
    const nextRules = getScheduleRules(draft.schedule);
    const nextAll = nextRules.find((r) => r.serviceId === 'all') ?? nextRules[0];
    const h = nextAll?.bookingHorizonDays;
    if (BOOKING_HORIZON_OPTIONS.includes(h as (typeof BOOKING_HORIZON_OPTIONS)[number])) {
      setBookingHorizonDays(h!);
    }
    const g = nextAll?.gapMinutes ?? draft.schedule.gapMinutes ?? 0;
    setGapMinutes(GAP_OPTIONS.includes(g as (typeof GAP_OPTIONS)[number]) ? g : 0);
  }, [draft.schedule]);

  const showWeeklyToast = useCallback((message: string) => {
    setWeeklyToast(message);
    window.setTimeout(() => setWeeklyToast(null), 2200);
  }, []);

  const previewNearest = useMemo(
    () => getNearestWeeklyPreview(weeklyDays, bookingHorizonDays, minLeadHours),
    [weeklyDays, bookingHorizonDays, minLeadHours],
  );

  const setDayEnabled = useCallback((uiWeekday: number, enabled: boolean) => {
    setWeeklyDays((prev) =>
      prev.map((d) =>
        d.uiWeekday === uiWeekday
          ? {
              ...d,
              enabled,
              intervals: enabled && d.intervals.length === 0 ? [createWindow()] : d.intervals,
            }
          : d,
      ),
    );
    setWeeklyError(null);
  }, []);

  const updateInterval = useCallback((uiWeekday: number, windowId: string, patch: Partial<ScheduleWindow>) => {
    setWeeklyDays((prev) =>
      prev.map((d) =>
        d.uiWeekday === uiWeekday
          ? {
              ...d,
              intervals: d.intervals.map((w) => (w.id === windowId ? { ...w, ...patch } : w)),
            }
          : d,
      ),
    );
    setWeeklyError(null);
  }, []);

  const addInterval = useCallback((uiWeekday: number) => {
    setWeeklyDays((prev) =>
      prev.map((d) => (d.uiWeekday === uiWeekday ? { ...d, intervals: [...d.intervals, createWindow()] } : d)),
    );
    setWeeklyError(null);
  }, []);

  const removeInterval = useCallback((uiWeekday: number, windowId: string) => {
    setWeeklyDays((prev) =>
      prev.map((d) => {
        if (d.uiWeekday !== uiWeekday) return d;
        const nextIntervals = d.intervals.filter((w) => w.id !== windowId);
        return { ...d, intervals: nextIntervals.length ? nextIntervals : [createWindow()] };
      }),
    );
    setWeeklyError(null);
  }, []);

  const saveWeekly = useCallback(async () => {
    for (const d of weeklyDays) {
      if (!d.enabled) continue;
      const err = validateIntervals(d.intervals);
      if (err) {
        setWeeklyError(`${WEEKDAY_NAMES[d.uiWeekday]}: ${err}`);
        return;
      }
    }

    const hasWork = weeklyDays.some(
      (d) =>
        d.enabled && d.intervals.some((w) => timeToMinutes(w.endTime) > timeToMinutes(w.startTime)),
    );
    if (!hasWork) {
      setWeeklyError('Включите хотя бы один рабочий день с интервалом времени.');
      return;
    }

    const nextSchedule = buildMasterScheduleFromWeekly(weeklyDays, gapMinutes, bookingHorizonDays);
    const nextDraft: MasterDraft = { ...draft, schedule: nextSchedule };

    setWeeklyError(null);
    setWeeklySaving(true);
    try {
      if (!useCabinetApi) {
        onPersist(nextDraft);
        showWeeklyToast('График сохранён');
        return;
      }
      await flushScheduleToBackend(nextDraft);
      showWeeklyToast('График сохранён');
    } catch (e) {
      setWeeklyError(e instanceof Error ? e.message : 'Не удалось сохранить');
    } finally {
      setWeeklySaving(false);
    }
  }, [
    bookingHorizonDays,
    draft,
    flushScheduleToBackend,
    gapMinutes,
    onPersist,
    showWeeklyToast,
    useCabinetApi,
    weeklyDays,
  ]);

  const horizonSelectOptions = useMemo(
    () => BOOKING_HORIZON_OPTIONS.map((d) => ({ value: String(d), label: `${d} дней` })),
    [],
  );
  const gapSelectOptions = useMemo(
    () => GAP_OPTIONS.map((m) => ({ value: String(m), label: m === 0 ? '0 мин' : `${m} мин` })),
    [],
  );
  const minLeadSelectOptions = useMemo(
    () => MIN_LEAD_OPTIONS.map((h) => ({ value: String(h), label: `${h} ч` })),
    [],
  );

  return (
    <div className="space-y-5">
      {visibleServices.length === 0 ? (
        <div className="rounded-[28px] border border-amber-200/80 bg-amber-50/90 p-5 shadow-[0_10px_30px_rgba(17,17,17,0.04)]">
          <p className="text-[17px] font-semibold text-neutral-950">Нет видимых услуг</p>
          <p className="mt-2 text-[15px] leading-relaxed text-neutral-700">
            Добавьте или включите хотя бы одну услугу, чтобы клиенты могли записываться.
          </p>
          <Link
            to={ADMIN_SERVICES_PATH}
            className="mt-4 flex min-h-[3rem] w-full items-center justify-center rounded-full bg-[#E29595] text-[16px] font-semibold text-white shadow-[0_12px_30px_rgba(226,149,149,0.22)] transition active:scale-[0.98]"
          >
            Перейти к услугам
          </Link>
        </div>
      ) : null}

      <div className="rounded-[24px] bg-[#F1EFEF] p-1.5">
        <div className="grid grid-cols-2 gap-1">
          <button
            type="button"
            onClick={() => setMode('weekly')}
            className={`min-h-[3rem] rounded-[20px] text-[15px] font-semibold transition active:scale-[0.98] ${
              mode === 'weekly' ? 'bg-[#E29595] text-white shadow-md' : 'bg-transparent text-neutral-600'
            }`}
          >
            По графику
          </button>
          <button
            type="button"
            onClick={() => setMode('manual')}
            className={`min-h-[3rem] rounded-[20px] text-[15px] font-semibold transition active:scale-[0.98] ${
              mode === 'manual' ? 'bg-[#E29595] text-white shadow-md' : 'bg-transparent text-neutral-600'
            }`}
          >
            Ручные окна
          </button>
        </div>
      </div>

      {mode === 'weekly' ? (
        <p className="text-[15px] leading-relaxed text-neutral-600">
          Подходит, если вы работаете регулярно. Клиенты будут видеть свободное время по вашему расписанию.
        </p>
      ) : (
        <p className="text-[15px] leading-relaxed text-neutral-600">
          Подходит, если вы хотите вручную открыть конкретные времена для записи.
        </p>
      )}

      {mode === 'weekly' ? (
        <>
          {weeklyToast ? (
            <div className="rounded-full bg-[#EAFBF2] px-5 py-3 text-center text-[14px] font-semibold text-[#2F8A5B] shadow-[0_10px_28px_rgba(17,17,17,0.04)]">
              {weeklyToast}
            </div>
          ) : null}
          <div className="rounded-[28px] border border-neutral-200/80 bg-white p-5 shadow-[0_10px_30px_rgba(17,17,17,0.04)]">
            <h2 className="text-[20px] font-semibold tracking-[-0.04em] text-neutral-950">График работы</h2>
            <p className="mt-2 text-[15px] leading-relaxed text-neutral-600">
              Клиенты смогут записываться в выбранные дни и часы. Длительность записи берётся из услуги.
            </p>

            <div className="mt-5 space-y-4">
              {weeklyDays.map((day) => (
                <div
                  key={day.uiWeekday}
                  className="rounded-[24px] border border-neutral-100 bg-[#FAFAFA] p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[16px] font-semibold text-neutral-950">{WEEKDAY_NAMES[day.uiWeekday]}</p>
                    <button
                      type="button"
                      onClick={() => setDayEnabled(day.uiWeekday, !day.enabled)}
                      className={`shrink-0 rounded-full px-4 py-2 text-[13px] font-semibold transition active:scale-[0.97] ${
                        day.enabled ? 'bg-[#E29595] text-white' : 'bg-neutral-200 text-neutral-600'
                      }`}
                    >
                      {day.enabled ? 'Рабочий' : 'Выходной'}
                    </button>
                  </div>

                  {!day.enabled ? (
                    <p className="mt-3 text-[15px] font-medium text-neutral-500">Выходной</p>
                  ) : (
                    <div className="mt-4 space-y-3">
                      {day.intervals.map((window, index) => (
                        <div key={window.id} className="rounded-[20px] bg-white p-3 shadow-sm">
                          <div className="mb-2 flex items-center justify-between">
                            <span className="text-[13px] font-semibold text-neutral-400">Интервал {index + 1}</span>
                            {day.intervals.length > 1 ? (
                              <button
                                type="button"
                                onClick={() => removeInterval(day.uiWeekday, window.id)}
                                className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F1EFEF] text-neutral-500 transition active:scale-[0.96]"
                                aria-label="Удалить интервал"
                              >
                                <IconClose className="h-4 w-4" />
                              </button>
                            ) : null}
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <label>
                              <span className="text-[12px] font-medium text-neutral-400">С</span>
                              <SlottySelect
                                className="mt-1 w-full"
                                value={window.startTime}
                                onChange={(value) => updateInterval(day.uiWeekday, window.id, { startTime: value })}
                                options={mergeScheduleTimeSelectOptions(window.startTime, window.endTime)}
                              />
                            </label>
                            <label>
                              <span className="text-[12px] font-medium text-neutral-400">По</span>
                              <SlottySelect
                                className="mt-1 w-full"
                                value={window.endTime}
                                onChange={(value) => updateInterval(day.uiWeekday, window.id, { endTime: value })}
                                options={mergeScheduleTimeSelectOptions(window.startTime, window.endTime)}
                              />
                            </label>
                          </div>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => addInterval(day.uiWeekday)}
                        className="flex min-h-11 w-full items-center justify-center gap-2 rounded-full border border-dashed border-neutral-300 bg-white text-[14px] font-semibold text-neutral-800 transition active:scale-[0.98]"
                      >
                        <IconPlus className="h-4 w-4" />
                        Добавить интервал
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[28px] border border-neutral-200/80 bg-white p-5 shadow-[0_10px_30px_rgba(17,17,17,0.04)]">
            <h2 className="text-[18px] font-semibold text-neutral-950">Параметры записи</h2>
            <p className="mt-1 text-[13px] leading-relaxed text-neutral-500">
              {/* TODO(api): горизонт записи и мин. срок до визита — пока только в интерфейсе; перерыв хранится в черновике, но API правил по дням недели его не принимает. */}
              Горизонт и минимальный срок до записи учитываются в предпросмотре ниже. На сервер уходит только недельный график.
            </p>
            <div className="mt-4 space-y-4">
              <label className="block">
                <span className="text-[13px] font-semibold text-neutral-500">Запись доступна на</span>
                <SlottySelect
                  className="mt-2 w-full"
                  value={String(bookingHorizonDays)}
                  onChange={(v) => setBookingHorizonDays(Number(v))}
                  options={horizonSelectOptions}
                />
              </label>
              <label className="block">
                <span className="text-[13px] font-semibold text-neutral-500">Перерыв между записями</span>
                <SlottySelect
                  className="mt-2 w-full"
                  value={String(gapMinutes)}
                  onChange={(v) => setGapMinutes(Number(v))}
                  options={gapSelectOptions}
                />
              </label>
              <label className="block">
                <span className="text-[13px] font-semibold text-neutral-500">Минимальное время до записи</span>
                <SlottySelect
                  className="mt-2 w-full"
                  value={String(minLeadHours)}
                  onChange={(v) => setMinLeadHours(Number(v))}
                  options={minLeadSelectOptions}
                />
              </label>
            </div>
          </div>

          <details className="rounded-[24px] border border-neutral-200/60 bg-white px-4 py-3 shadow-sm">
            <summary className="cursor-pointer list-none text-[15px] font-semibold text-neutral-800 [&::-webkit-details-marker]:hidden">
              Исключения
            </summary>
            <p className="mt-2 pb-2 text-[14px] leading-relaxed text-neutral-500">
              {/* TODO: закрытие отдельных дат или смена интервала на одну дату — отдельный экран / API. */}
              Здесь можно будет закрыть конкретный день или задать другое время только на одну дату. Раздел в
              разработке.
            </p>
          </details>

          {weeklyError ? (
            <p className="rounded-[24px] bg-[#FFF4E8] px-4 py-3 text-[14px] font-semibold text-[#B66A24]">{weeklyError}</p>
          ) : null}

          <button
            type="button"
            disabled={weeklySaving}
            onClick={() => void saveWeekly()}
            className="flex min-h-[3.25rem] w-full items-center justify-center rounded-full bg-[#E29595] text-[16px] font-semibold text-white shadow-[0_12px_30px_rgba(226,149,149,0.22)] transition active:scale-[0.98] disabled:opacity-50"
          >
            {weeklySaving ? 'Сохранение…' : 'Сохранить график'}
          </button>

          <div className="rounded-[28px] border border-neutral-200/80 bg-white p-5 shadow-[0_10px_30px_rgba(17,17,17,0.04)]">
            <h3 className="text-[16px] font-semibold text-neutral-950">Как увидит клиент</h3>
            <p className="mt-2 text-[15px] leading-relaxed text-neutral-700">
              {previewNearest ? (
                <>
                  Ближайшее время: <span className="font-semibold text-neutral-900">{previewNearest}</span>
                </>
              ) : (
                'Пока нет доступного времени для записи'
              )}
            </p>
          </div>
        </>
      ) : (
        <AdminMasterRealSlotsPanel visibleServices={visibleServices} loadSlots={mode === 'manual'} />
      )}
    </div>
  );
}
