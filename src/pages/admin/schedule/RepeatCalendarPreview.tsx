import { useMemo } from 'react';
import type { PlannedSlot } from './scheduleTypes';
import { SCHEDULE_QUICK_SETUP_IMAGES } from './scheduleQuickSetupAssets';
import { WEEKDAY_SHORT } from './repeatSettingsConfig';
import {
  addMonths,
  buildMonthGrid,
  formatMonthYearLabel,
  isTodayIso,
  parseIsoDate,
  startOfMonth,
  toIsoDate,
} from './scheduleUtils';

type Props = {
  slots: PlannedSlot[];
  /** По умолчанию 2 месяца; `null` — все месяцы серии. */
  maxMonths?: number | null;
  compact?: boolean;
};

function PreviewDayCell({
  dayNum,
  inMonth,
  hasSlot,
  isToday,
  startTime,
}: {
  dayNum: number;
  inMonth: boolean;
  hasSlot: boolean;
  isToday: boolean;
  startTime?: string;
}) {
  if (!inMonth) {
    return <div className="aspect-square min-w-0" aria-hidden />;
  }

  return (
    <div
      className={`relative flex aspect-square min-w-0 flex-col items-center justify-center overflow-hidden rounded-[8px] ${
        hasSlot
          ? 'ring-2 ring-[#3B4CCA]/25'
          : isToday
            ? 'bg-white ring-1 ring-[#E0E4F8]'
            : 'bg-[#F5F5F5]'
      }`}
    >
      {hasSlot ? (
        <>
          <span
            className="pointer-events-none absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${SCHEDULE_QUICK_SETUP_IMAGES.tabCreateActiveBg})` }}
            aria-hidden
          />
          <span className="pointer-events-none absolute inset-0 bg-white/50" aria-hidden />
        </>
      ) : null}
      <span
        className={`relative z-10 text-[12px] font-bold tabular-nums leading-none ${
          hasSlot ? 'text-[#111827]' : 'text-[#9CA3AF]'
        }`}
      >
        {dayNum}
      </span>
      {hasSlot && startTime ? (
        <span className="relative z-10 mt-0.5 text-[8px] font-semibold tabular-nums leading-none text-[#3B4CCA]">
          {startTime}
        </span>
      ) : null}
    </div>
  );
}

function PreviewMonth({
  monthAnchor,
  slotDates,
  slotTimes,
}: {
  monthAnchor: Date;
  slotDates: Set<string>;
  slotTimes: Map<string, string>;
}) {
  const grid = buildMonthGrid(monthAnchor);

  return (
    <div>
      <p className="mb-2 text-[13px] font-semibold capitalize text-[#111827]">
        {formatMonthYearLabel(monthAnchor)}
      </p>
      <div className="grid grid-cols-7 gap-1">
        {WEEKDAY_SHORT.map((label) => (
          <div
            key={label}
            className="pb-0.5 text-center text-[10px] font-semibold uppercase text-[#9CA3AF]"
          >
            {label}
          </div>
        ))}
        {grid.map((cell) => {
          const dayNum = parseIsoDate(cell.dateIso).getDate();
          const hasSlot = slotDates.has(cell.dateIso);
          return (
            <PreviewDayCell
              key={cell.dateIso}
              dayNum={dayNum}
              inMonth={cell.inCurrentMonth}
              hasSlot={hasSlot}
              isToday={isTodayIso(cell.dateIso)}
              startTime={hasSlot ? slotTimes.get(cell.dateIso) : undefined}
            />
          );
        })}
      </div>
    </div>
  );
}

export function RepeatCalendarPreview({ slots, maxMonths = 2, compact }: Props) {
  const { slotDates, slotTimes, monthAnchors } = useMemo(() => {
    const dates = new Set<string>();
    const times = new Map<string, string>();
    for (const slot of slots) {
      dates.add(slot.dateIso);
      if (!times.has(slot.dateIso)) times.set(slot.dateIso, slot.startTime);
    }

    if (dates.size === 0) {
      return { slotDates: dates, slotTimes: times, monthAnchors: [] as Date[] };
    }

    const sorted = [...dates].sort();
    const first = startOfMonth(parseIsoDate(sorted[0]!));
    const last = startOfMonth(parseIsoDate(sorted[sorted.length - 1]!));
    const months: Date[] = [];
    let cur = new Date(first);
    while (cur.getTime() <= last.getTime()) {
      months.push(new Date(cur));
      cur = addMonths(cur, 1);
      if (maxMonths != null && months.length >= maxMonths) break;
    }

    return { slotDates: dates, slotTimes: times, monthAnchors: months };
  }, [slots, maxMonths]);

  if (slots.length === 0) return null;

  return (
    <div className={compact ? undefined : 'rounded-[12px] bg-[#EBEBEB] p-3'}>
      {compact ? null : (
        <>
          <p className="text-[13px] font-semibold text-[#111827]">В календаре</p>
          <p className="mt-0.5 text-[12px] font-medium text-[#6B7280]">
            Подсвечены дни, когда появятся новые окна
          </p>
        </>
      )}
      <div className={compact ? 'space-y-4' : 'mt-3 space-y-4'}>
        {monthAnchors.map((month) => (
          <PreviewMonth
            key={toIsoDate(month)}
            monthAnchor={month}
            slotDates={slotDates}
            slotTimes={slotTimes}
          />
        ))}
      </div>
    </div>
  );
}
