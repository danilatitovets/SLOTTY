import { useCallback, useEffect, useMemo, useState } from 'react';
import { HiArrowDownTray } from 'react-icons/hi2';
import { downloadScheduleMonthWordReport } from './exportScheduleWordReport';
import type { ScheduleWindowView } from './scheduleTypes';
import {
  scheduleCalendarIconBtn,
  scheduleSegmentClass,
  scheduleSheetFormPanel,
  scheduleSheetPrimaryBtn,
} from './adminScheduleTheme';
import { ScheduleCalendarDayEmpty } from './ScheduleCalendarDayEmpty';
import { ScheduleCalendarTabStats } from './ScheduleCalendarTabStats';
import { ScheduleCalendarWindowRow } from './ScheduleCalendarWindowRow';
import { ScheduleMonthPickerPanel } from './ScheduleMonthPickerPanel';
import type { ScheduleTabMetrics } from './scheduleTabMetrics';
import {
  addMonths,
  buildMonthGrid,
  formatGroupHeader,
  formatWeekdayShort,
  indexWindowsByDate,
  isLocalDateIsoBeforeToday,
  parseIsoDate,
  startOfMonth,
  toIsoDate,
  windowsCountRu,
  type DayWindowStats,
} from './scheduleUtils';
import { LoadingVideo } from '../../../shared/ui/LoadingVideo';

type Props = {
  windows: ScheduleWindowView[];
  loading: boolean;
  calendarMetrics: ScheduleTabMetrics['calendar'];
  onWindowClick: (w: ScheduleWindowView) => void;
  onCreateForDay?: (dateIso: string) => void;
  canCreateForDay?: boolean;
  createForDayDisabledTitle?: string;
  masterName?: string;
};

function todayIso(): string {
  return toIsoDate(new Date());
}

function formatDayStatsSummary(stats: DayWindowStats): string {
  const parts: string[] = [];
  if (stats.free > 0) parts.push(`${stats.free} своб.`);
  if (stats.booked > 0) parts.push(`${stats.booked} с записью`);
  if (stats.blocked > 0) parts.push(`${stats.blocked} закр.`);
  return parts.join(' · ');
}

export function ScheduleCalendar({
  windows,
  loading,
  calendarMetrics,
  onWindowClick,
  onCreateForDay,
  canCreateForDay = true,
  createForDayDisabledTitle,
  masterName = 'Мастер',
}: Props) {
  const [exportingWord, setExportingWord] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [monthAnchor, setMonthAnchor] = useState(() => startOfMonth(new Date()));
  const [selectedIso, setSelectedIso] = useState(todayIso);
  const [dayFilter, setDayFilter] = useState<'all' | ScheduleWindowView['status']>('all');
  const monthCells = useMemo(() => buildMonthGrid(monthAnchor), [monthAnchor]);
  const statsByDate = useMemo(() => indexWindowsByDate(windows), [windows]);

  const windowsByDate = useMemo(() => {
    const map = new Map<string, ScheduleWindowView[]>();
    for (const w of windows) {
      const list = map.get(w.dateIso) ?? [];
      list.push(w);
      map.set(w.dateIso, list);
    }
    for (const [, list] of map) {
      list.sort((a, b) => a.startTime.localeCompare(b.startTime));
    }
    return map;
  }, [windows]);

  const selectedWindowsAll = windowsByDate.get(selectedIso) ?? [];

  const selectedWindows = useMemo(() => {
    if (dayFilter === 'all') return selectedWindowsAll;
    return selectedWindowsAll.filter((w) => w.status === dayFilter);
  }, [dayFilter, selectedWindowsAll]);

  const selectedDayStats = statsByDate.get(selectedIso);

  useEffect(() => {
    setDayFilter('all');
  }, [selectedIso]);

  useEffect(() => {
    const today = todayIso();
    const selectedInMonth = monthCells.some((c) => c.dateIso === selectedIso && c.inCurrentMonth);
    if (selectedInMonth) return;
    const todayInMonth = monthCells.some((c) => c.dateIso === today && c.inCurrentMonth);
    setSelectedIso(todayInMonth ? today : toIsoDate(monthAnchor));
  }, [monthAnchor, monthCells, selectedIso]);

  const selectedDate = parseIsoDate(selectedIso);
  const todayStart = useMemo(() => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return t;
  }, []);

  const goToday = () => {
    const now = new Date();
    setMonthAnchor(startOfMonth(now));
    setSelectedIso(todayIso());
  };

  const selectedIsPast = isLocalDateIsoBeforeToday(selectedIso);
  const showCreateForDayLink =
    Boolean(onCreateForDay) && !selectedIsPast && selectedWindowsAll.length === 0;
  const selectedStatusKinds = useMemo(() => {
    const kinds = new Set(selectedWindowsAll.map((w) => w.status));
    return kinds.size;
  }, [selectedWindowsAll]);
  const showDayFilters = selectedWindowsAll.length > 0 && selectedStatusKinds > 1;
  const selectedWeekday = formatWeekdayShort(selectedDate);

  const handleWordExport = useCallback(async () => {
    setExportError(null);
    setExportingWord(true);
    try {
      await downloadScheduleMonthWordReport({
        windows,
        monthAnchor,
        masterName,
      });
    } catch {
      setExportError('Не удалось сформировать отчёт Word');
    } finally {
      setExportingWord(false);
    }
  }, [masterName, monthAnchor, windows]);

  return (
    <section className="space-y-4 lg:space-y-6">
      <header className="min-w-0">
        <h2 className="text-[20px] font-black tracking-[-0.04em] text-[#111827] lg:text-[24px] lg:tracking-[-0.05em]">
          Календарь
        </h2>

      </header>

      <ScheduleCalendarTabStats metrics={calendarMetrics} />

      <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:items-start lg:gap-5">
        <div className="lg:sticky lg:top-[calc(var(--slotty-admin-desktop-topbar-h,5rem)+3.5rem+1rem)]">
          <ScheduleMonthPickerPanel
            windows={windows}
            loading={loading}
            monthAnchor={monthAnchor}
            selectedIso={selectedIso}
            onPrevMonth={() => setMonthAnchor((m) => addMonths(m, -1))}
            onNextMonth={() => setMonthAnchor((m) => addMonths(m, 1))}
            onToday={goToday}
            onSelectDay={setSelectedIso}
            busyDaysStripClassName="lg:hidden"
          />
        </div>

        <div className={scheduleSheetFormPanel}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1 rounded-[12px] bg-[#EEF0FC] px-4 py-3.5">
              <h3 className="text-[16px] font-bold leading-snug tracking-[-0.03em] text-[#111827] lg:text-[18px]">
                {formatGroupHeader(selectedDate, todayStart)}
              </h3>
              <p className="mt-0.5 text-[13px] font-semibold capitalize text-[#6B7280]">{selectedWeekday}</p>
              <p className="mt-1 text-[13px] font-semibold text-[#3B4CCA]">
                {selectedWindowsAll.length === 0
                  ? selectedIsPast
                    ? 'День завершён — окон не было'
                    : 'На этот день окна не добавлены'
                  : selectedDayStats
                    ? formatDayStatsSummary(selectedDayStats)
                    : windowsCountRu(selectedWindowsAll.length)}
                {selectedWindowsAll.length > 0 && dayFilter !== 'all'
                  ? ` · показано ${selectedWindows.length}`
                  : null}
              </p>
            </div>
            <button
              type="button"
              onClick={() => void handleWordExport()}
              disabled={exportingWord || loading}
              title="Скачать отчёт Word за месяц"
              aria-label="Скачать отчёт Word за месяц"
              className={`${scheduleCalendarIconBtn} text-[#3B4CCA]`}
            >
              <HiArrowDownTray className="h-5 w-5" aria-hidden />
            </button>
          </div>

          {exportError ? (
            <p className="mt-2 text-[13px] font-semibold text-[#B45309]">{exportError}</p>
          ) : null}

          {showDayFilters ? (
            <div className="mt-3 flex flex-wrap gap-1.5" role="tablist" aria-label="Фильтр дня">
              {(
                [
                  { id: 'all' as const, label: 'Все' },
                  { id: 'free' as const, label: 'Свободные' },
                  { id: 'booked' as const, label: 'С записью' },
                  { id: 'blocked' as const, label: 'Закрытые' },
                ] as const
              ).map((opt) => {
                const count =
                  opt.id === 'all'
                    ? selectedWindowsAll.length
                    : selectedWindowsAll.filter((w) => w.status === opt.id).length;
                if (opt.id !== 'all' && count === 0) return null;
                const selected = dayFilter === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    onClick={() => setDayFilter(opt.id)}
                    className={`${scheduleSegmentClass(selected)} min-h-9 px-3 text-[12px] lg:text-[13px]`}
                  >
                    {opt.label}
                    {count > 0 ? ` · ${count}` : ''}
                  </button>
                );
              })}
            </div>
          ) : null}

          {loading ? (
            <div className="mt-4 flex justify-center py-8">
              <LoadingVideo size="sm" />
            </div>
          ) : selectedWindows.length === 0 ? (
            <ScheduleCalendarDayEmpty
              showIllustration={selectedWindowsAll.length === 0 && !selectedIsPast}
              title={
                selectedWindowsAll.length === 0
                  ? selectedIsPast
                    ? 'На этот день окон не было'
                    : 'Окон на этот день пока нет'
                  : 'Нет окон с таким статусом'
              }
              text={
                selectedWindowsAll.length === 0
                  ? selectedIsPast
                    ? 'Выберите другой день в календаре.'
                    : 'Добавьте свободное окно — клиенты смогут записаться онлайн.'
                  : 'Смените фильтр выше, чтобы увидеть другие окна.'
              }
              action={
                showCreateForDayLink ? (
                  <button
                    type="button"
                    disabled={!canCreateForDay}
                    title={!canCreateForDay ? createForDayDisabledTitle : undefined}
                    onClick={() => onCreateForDay?.(selectedIso)}
                    className={`${scheduleSheetPrimaryBtn} !w-auto !flex-none px-6`}
                  >
                    Создать окно на этот день
                  </button>
                ) : undefined
              }
            />
          ) : (
            <ul className="mt-4 max-h-[min(52dvh,32rem)] space-y-2 overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch]">
              {selectedWindows.map((w) => (
                <li key={w.id}>
                  <ScheduleCalendarWindowRow window={w} onClick={() => onWindowClick(w)} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
