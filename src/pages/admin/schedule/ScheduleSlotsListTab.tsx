import { useEffect, useMemo, useState } from 'react';
import { HiChevronLeft, HiChevronRight } from 'react-icons/hi2';
import { ADMIN_SCHEDULE_PATH } from '../../../app/paths';
import { AdminCabinetCrossLink } from '../shared/AdminCabinetCrossLink';
import { ScheduleCalendarDayEmpty } from './ScheduleCalendarDayEmpty';
import { ScheduleCalendarWindowRow } from './ScheduleCalendarWindowRow';
import { ScheduleListDayChip } from './ScheduleListDayChip';
import {
  scheduleBusyDaysStrip,
  scheduleCalendarIconBtn,
  scheduleSegmentClass,
  scheduleSheetFormPanelScrollable,
  scheduleSheetPrimaryBtn,
} from './adminScheduleTheme';
import type { ScheduleWindowView } from './scheduleTypes';
import {
  addMonths,
  formatGroupHeader,
  formatMonthYearLabel,
  formatWeekdayShort,
  indexWindowsByDate,
  isLocalDateIsoBeforeToday,
  parseIsoDate,
  startOfLocalDay,
  startOfMonth,
  toIsoDate,
  windowsCountRu,
  type DayWindowStats,
} from './scheduleUtils';
import { LoadingVideo } from '../../../shared/ui/LoadingVideo';

type Props = {
  windows: ScheduleWindowView[];
  loading: boolean;
  onWindowClick: (w: ScheduleWindowView) => void;
  onCreateForDay?: (dateIso: string) => void;
  canCreateForDay?: boolean;
  createForDayDisabledTitle?: string;
};

type StatusFilter = 'all' | ScheduleWindowView['status'];

function todayIso(): string {
  return toIsoDate(new Date());
}

function datesInMonth(anchor: Date): string[] {
  const year = anchor.getFullYear();
  const month = anchor.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  return Array.from({ length: daysInMonth }, (_, index) =>
    toIsoDate(new Date(year, month, index + 1)),
  );
}

function formatDayStatsSummary(stats: DayWindowStats): string {
  const parts: string[] = [];
  if (stats.free > 0) parts.push(`${stats.free} своб.`);
  if (stats.booked > 0) parts.push(`${stats.booked} с записью`);
  if (stats.blocked > 0) parts.push(`${stats.blocked} закр.`);
  return parts.join(' · ');
}

export function ScheduleSlotsListTab({
  windows,
  loading,
  onWindowClick,
  onCreateForDay,
  canCreateForDay = true,
  createForDayDisabledTitle,
}: Props) {
  const [monthAnchor, setMonthAnchor] = useState(() => startOfMonth(new Date()));
  const [selectedIso, setSelectedIso] = useState(todayIso);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const statsByDate = useMemo(() => indexWindowsByDate(windows), [windows]);
  const monthDates = useMemo(() => datesInMonth(monthAnchor), [monthAnchor]);
  const monthLabel = formatMonthYearLabel(monthAnchor);

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

  const monthWindowCount = useMemo(
    () => windows.filter((w) => monthDates.includes(w.dateIso)).length,
    [monthDates, windows],
  );

  const selectedWindowsAll = windowsByDate.get(selectedIso) ?? [];

  const selectedWindows = useMemo(() => {
    if (statusFilter === 'all') return selectedWindowsAll;
    return selectedWindowsAll.filter((w) => w.status === statusFilter);
  }, [selectedWindowsAll, statusFilter]);

  const selectedDayStats = statsByDate.get(selectedIso);

  useEffect(() => {
    setStatusFilter('all');
  }, [selectedIso]);

  useEffect(() => {
    if (monthDates.includes(selectedIso)) return;
    const today = todayIso();
    if (monthDates.includes(today)) {
      setSelectedIso(today);
      return;
    }
    const firstWithWindows = monthDates.find((iso) => (windowsByDate.get(iso)?.length ?? 0) > 0);
    setSelectedIso(firstWithWindows ?? monthDates[0] ?? today);
  }, [monthAnchor, monthDates, selectedIso, windowsByDate]);

  const todayStart = useMemo(() => startOfLocalDay(new Date()), []);
  const selectedDate = parseIsoDate(selectedIso);
  const selectedWeekday = formatWeekdayShort(selectedDate);
  const selectedIsPast = isLocalDateIsoBeforeToday(selectedIso);
  const showCreateForDayLink =
    Boolean(onCreateForDay) && !selectedIsPast && selectedWindowsAll.length === 0;

  const selectedStatusKinds = useMemo(() => {
    const kinds = new Set(selectedWindowsAll.map((w) => w.status));
    return kinds.size;
  }, [selectedWindowsAll]);
  const showStatusFilters = selectedWindowsAll.length > 0 && selectedStatusKinds > 1;

  const goToday = () => {
    const now = new Date();
    setMonthAnchor(startOfMonth(now));
    setSelectedIso(todayIso());
  };

  return (
    <section className="min-w-0 space-y-4 lg:space-y-5">
      <header className="min-w-0">
        <h2 className="text-[20px] font-black tracking-[-0.04em] text-[#111827] lg:text-[24px] lg:tracking-[-0.05em]">
          Список окон
        </h2>
        <p className="mt-1 text-[13px] font-medium text-[#6B7280] lg:text-[14px]">
          Выберите месяц и день — откройте окно для редактирования
        </p>
      </header>

      <div className={`${scheduleSheetFormPanelScrollable} space-y-4`}>
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => setMonthAnchor((m) => addMonths(m, -1))}
            className={scheduleCalendarIconBtn}
            aria-label="Предыдущий месяц"
          >
            <HiChevronLeft className="h-5 w-5" aria-hidden />
          </button>
          <div className="min-w-0 flex-1 text-center">
            <p className="text-[18px] font-black capitalize tracking-[-0.04em] text-[#111827] lg:text-[20px]">
              {monthLabel}
            </p>
            <button
              type="button"
              onClick={goToday}
              className="mt-2 inline-flex rounded-[10px] bg-[#EBEBEB] px-3.5 py-1.5 text-[12px] font-bold text-[#3B4CCA] transition hover:bg-[#E4E4E4] active:scale-[0.98] lg:text-[13px]"
            >
              Сегодня
            </button>
          </div>
          <button
            type="button"
            onClick={() => setMonthAnchor((m) => addMonths(m, 1))}
            className={scheduleCalendarIconBtn}
            aria-label="Следующий месяц"
          >
            <HiChevronRight className="h-5 w-5" aria-hidden />
          </button>
        </div>

        {!loading ? (
          <div className="rounded-[10px] bg-[#EBEBEB] px-3 py-2.5 text-center">
            <p className="text-[13px] font-semibold text-[#374151]">
              <span className="font-black text-[#3B4CCA]">{windowsCountRu(monthWindowCount)}</span>
              <span className="text-[#6B7280]"> в этом месяце</span>
            </p>
          </div>
        ) : null}

        <div className="min-w-0 overflow-visible">
          <p className="text-[11px] font-bold uppercase leading-normal tracking-[0.08em] text-[#9CA3AF]">
            День
          </p>
          <div className="-mx-4 mt-2.5 min-w-0 overflow-visible">
            <div className={`${scheduleBusyDaysStrip} px-4`} role="list" aria-label="Выбор дня">
            {monthDates.map((dateIso) => {
              const selected = selectedIso === dateIso;
              const stats = statsByDate.get(dateIso);
              const count = stats?.total ?? 0;
              return (
                <ScheduleListDayChip
                  key={dateIso}
                  dateIso={dateIso}
                  selected={selected}
                  count={count}
                  isToday={dateIso === todayIso()}
                  onSelect={() => setSelectedIso(dateIso)}
                />
              );
            })}
            </div>
          </div>
        </div>

        <div className="min-w-0 rounded-[12px] bg-[#EEF0FC] px-4 py-3.5">
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
            {selectedWindowsAll.length > 0 && statusFilter !== 'all'
              ? ` · показано ${selectedWindows.length}`
              : null}
          </p>
        </div>

        {showStatusFilters ? (
          <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Статус окна">
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
              const selected = statusFilter === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => setStatusFilter(opt.id)}
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
          <div className="flex justify-center py-10">
            <LoadingVideo size="sm" label="Загрузка окон…" />
          </div>
        ) : selectedWindows.length === 0 ? (
          <ScheduleCalendarDayEmpty
            showIllustration={selectedWindowsAll.length === 0 && !selectedIsPast}
            title={
              selectedWindowsAll.length === 0
                ? windows.length === 0
                  ? 'Окон пока нет'
                  : selectedIsPast
                    ? 'На этот день окон не было'
                    : 'Окон на этот день пока нет'
                : 'Нет окон с таким статусом'
            }
            text={
              selectedWindowsAll.length === 0
                ? windows.length === 0
                  ? 'Создайте первое окно — клиенты смогут выбрать время для записи'
                  : selectedIsPast
                    ? 'Выберите другой день в ленте выше.'
                    : 'Добавьте свободное окно — клиенты смогут записаться онлайн.'
                : 'Смените фильтр выше, чтобы увидеть другие окна.'
            }
            action={
              windows.length === 0 ? (
                <AdminCabinetCrossLink to={`${ADMIN_SCHEDULE_PATH}?tab=create`}>
                  Создать окно
                </AdminCabinetCrossLink>
              ) : showCreateForDayLink ? (
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
          <ul className="space-y-2">
            {selectedWindows.map((w) => (
              <li key={w.id}>
                <ScheduleCalendarWindowRow window={w} onClick={() => onWindowClick(w)} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
