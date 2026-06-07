import { useMemo } from 'react';
import { HiChevronLeft, HiChevronRight } from 'react-icons/hi2';
import {
  scheduleBusyDayChipClass,
  scheduleBusyDaysStrip,
  scheduleCalendarIconBtn,
  scheduleSheetFormPanel,
} from './adminScheduleTheme';
import { ScheduleCalendarDayCell } from './ScheduleCalendarDayCell';
import type { ScheduleWindowView } from './scheduleTypes';
import {
  buildMonthGrid,
  formatMonthYearLabel,
  indexWindowsByDate,
  isLocalDateIsoBeforeToday,
  isTodayIso,
  parseIsoDate,
  windowsCountRu,
  type DayWindowStats,
} from './scheduleUtils';
import { LoadingVideo } from '../../../shared/ui/LoadingVideo';

const WEEKDAY_LABELS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'] as const;
const BUSY_DAYS_SECTION_THRESHOLD = 3;

function daysCountRu(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 14) return `${n} дней`;
  if (mod10 === 1) return `${n} день`;
  if (mod10 >= 2 && mod10 <= 4) return `${n} дня`;
  return `${n} дней`;
}

type Props = {
  windows: ScheduleWindowView[];
  loading: boolean;
  monthAnchor: Date;
  selectedIso: string;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
  onSelectDay: (iso: string) => void;
  showBusyDaysStrip?: boolean;
  busyDaysStripClassName?: string;
};

export function ScheduleMonthPickerPanel({
  windows,
  loading,
  monthAnchor,
  selectedIso,
  onPrevMonth,
  onNextMonth,
  onToday,
  onSelectDay,
  showBusyDaysStrip = true,
  busyDaysStripClassName = '',
}: Props) {
  const monthCells = useMemo(() => buildMonthGrid(monthAnchor), [monthAnchor]);
  const statsByDate = useMemo(() => indexWindowsByDate(windows), [windows]);

  const monthIsoSet = useMemo(
    () => new Set(monthCells.filter((c) => c.inCurrentMonth).map((c) => c.dateIso)),
    [monthCells],
  );

  const monthWindowCount = useMemo(
    () => windows.filter((w) => monthIsoSet.has(w.dateIso)).length,
    [monthIsoSet, windows],
  );

  const busyDaysInMonth = useMemo(() => {
    const days: Array<{ dateIso: string; stats: DayWindowStats }> = [];
    for (const cell of monthCells) {
      if (!cell.inCurrentMonth) continue;
      const stats = statsByDate.get(cell.dateIso);
      if (stats && stats.total > 0) days.push({ dateIso: cell.dateIso, stats });
    }
    return days;
  }, [monthCells, statsByDate]);

  const monthLabel = formatMonthYearLabel(monthAnchor);

  return (
    <div className={scheduleSheetFormPanel}>
      <div className="flex items-center justify-between gap-2">
        <button type="button" onClick={onPrevMonth} className={scheduleCalendarIconBtn} aria-label="Предыдущий месяц">
          <HiChevronLeft className="h-5 w-5" aria-hidden />
        </button>
        <div className="min-w-0 flex-1 text-center">
          <p className="text-[18px] font-black capitalize tracking-[-0.04em] text-[#111827] lg:text-[20px]">
            {monthLabel}
          </p>
          <button
            type="button"
            onClick={onToday}
            className="mt-2 inline-flex rounded-[10px] bg-[#EBEBEB] px-3.5 py-1.5 text-[12px] font-bold text-[#3B4CCA] transition hover:bg-[#E4E4E4] active:scale-[0.98] lg:text-[13px]"
          >
            Сегодня
          </button>
        </div>
        <button type="button" onClick={onNextMonth} className={scheduleCalendarIconBtn} aria-label="Следующий месяц">
          <HiChevronRight className="h-5 w-5" aria-hidden />
        </button>
      </div>

      {!loading ? (
        <div className="mt-4 rounded-[10px] bg-[#EBEBEB] px-3 py-2.5 text-center">
          <p className="text-[13px] font-semibold text-[#374151]">
            <span className="font-black text-[#3B4CCA]">{windowsCountRu(monthWindowCount)}</span>
            {busyDaysInMonth.length > 0 ? (
              <span className="text-[#6B7280]">
                {' '}
                · {busyDaysInMonth.length}{' '}
                {busyDaysInMonth.length === 1 ? 'день' : busyDaysInMonth.length < 5 ? 'дня' : 'дней'} с окнами
              </span>
            ) : (
              <span className="text-[#9CA3AF]"> · пока без окон</span>
            )}
          </p>
        </div>
      ) : null}

      <div className="mt-4 grid grid-cols-7 gap-1.5 sm:gap-2">
        {WEEKDAY_LABELS.map((wd) => (
          <div
            key={wd}
            className="pb-1 text-center text-[11px] font-bold uppercase tracking-[0.08em] text-[#6B7280] sm:text-[12px]"
          >
            {wd}
          </div>
        ))}
      </div>

      {loading ? (
        <div className="mt-4 flex justify-center py-8">
          <LoadingVideo size="sm" label="Загрузка…" />
        </div>
      ) : (
        <div className="mt-1 grid grid-cols-7 gap-1.5 sm:gap-2">
          {monthCells.map((cell) => {
            const stats = statsByDate.get(cell.dateIso);
            const isToday = isTodayIso(cell.dateIso);
            const isPast = isLocalDateIsoBeforeToday(cell.dateIso);
            const isSelected = selectedIso === cell.dateIso;
            const dayNum = parseIsoDate(cell.dateIso).getDate();

            return (
              <ScheduleCalendarDayCell
                key={cell.dateIso}
                dayNum={dayNum}
                cell={cell}
                stats={stats}
                isToday={isToday}
                isPast={isPast}
                isSelected={isSelected}
                onSelect={() => onSelectDay(cell.dateIso)}
              />
            );
          })}
        </div>
      )}

      {showBusyDaysStrip && !loading && busyDaysInMonth.length >= BUSY_DAYS_SECTION_THRESHOLD ? (
        <div className={`mt-4 border-t border-[#EEEEEE] pt-4 pb-1 ${busyDaysStripClassName}`.trim()}>
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#9CA3AF]">Дни с окнами</p>
            <span className="text-[11px] font-semibold text-[#9CA3AF]">{daysCountRu(busyDaysInMonth.length)}</span>
          </div>
          <div className={scheduleBusyDaysStrip} role="list" aria-label="Быстрый выбор дня">
            {busyDaysInMonth.map(({ dateIso, stats }) => {
              const selected = selectedIso === dateIso;
              const d = parseIsoDate(dateIso);
              const label = new Intl.DateTimeFormat('ru-RU', {
                day: 'numeric',
                month: 'short',
              }).format(d);
              return (
                <button
                  key={dateIso}
                  type="button"
                  role="listitem"
                  onClick={() => onSelectDay(dateIso)}
                  className={scheduleBusyDayChipClass(selected)}
                  aria-pressed={selected}
                >
                  <span className="text-[11px] font-semibold leading-tight">{label}</span>
                  <span
                    className={`mt-0.5 text-[12px] font-bold tabular-nums ${
                      selected ? 'text-white/90' : 'text-[#6B7280]'
                    }`}
                  >
                    {stats.total}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
