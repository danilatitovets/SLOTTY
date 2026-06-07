import { SchedulePhotoActiveLayers } from './SchedulePhotoActiveLayers';
import { windowsCountRu, type DayWindowStats } from './scheduleUtils';

function formatCountBadge(n: number): string {
  if (n > 99) return '99+';
  return String(n);
}

type Props = {
  dayNum: number;
  cell: { dateIso: string; inCurrentMonth: boolean };
  stats: DayWindowStats | undefined;
  isToday: boolean;
  isPast: boolean;
  isSelected: boolean;
  onSelect: () => void;
};

export function ScheduleCalendarDayCell({
  dayNum,
  cell,
  stats,
  isToday,
  isPast,
  isSelected,
  onSelect,
}: Props) {
  if (!cell.inCurrentMonth) {
    return <div className="aspect-square min-w-0" aria-hidden />;
  }

  const hasSlots = (stats?.total ?? 0) > 0;
  const showPhoto = hasSlots || isSelected;
  const pastMuted = isPast && !isSelected;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`relative flex aspect-square min-w-0 flex-col items-center justify-center overflow-hidden rounded-[10px] transition active:scale-[0.97] ${
        pastMuted ? 'opacity-70' : ''
      } ${
        isSelected
          ? 'ring-2 ring-[#3B4CCA]/40'
          : hasSlots
            ? 'ring-2 ring-[#3B4CCA]/20'
            : isToday
              ? 'bg-white ring-1 ring-[#E0E4F8]'
              : 'bg-[#F5F5F5]'
      }`}
      aria-label={`${dayNum}, ${windowsCountRu(stats?.total ?? 0)}`}
      aria-pressed={isSelected}
    >
      {showPhoto ? <SchedulePhotoActiveLayers /> : null}
      <span
        className={`relative z-10 text-[13px] font-bold tabular-nums leading-none lg:text-[14px] ${
          showPhoto || isToday ? 'text-[#111827]' : 'text-[#9CA3AF]'
        }`}
      >
        {dayNum}
      </span>
      {hasSlots && stats ? (
        <span className="relative z-10 mt-0.5 text-[9px] font-bold tabular-nums leading-none text-[#3B4CCA] lg:text-[10px]">
          {formatCountBadge(stats.total)}
        </span>
      ) : null}
    </button>
  );
}
