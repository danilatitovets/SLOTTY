import { SchedulePhotoActiveLayers } from './SchedulePhotoActiveLayers';
import { parseIsoDate, windowsCountRu } from './scheduleUtils';

function formatDayChipLabel(dateIso: string): string {
  const d = parseIsoDate(dateIso);
  return new Intl.DateTimeFormat('ru-RU', { day: 'numeric', weekday: 'short' }).format(d).replace('.', '');
}

function windowHintLabel(count: number): string {
  if (count === 1) return 'окно';
  return windowsCountRu(count);
}

type Props = {
  dateIso: string;
  selected: boolean;
  count: number;
  isToday: boolean;
  onSelect: () => void;
};

export function ScheduleListDayChip({ dateIso, selected, count, isToday, onSelect }: Props) {
  const hasSlots = count > 0;
  const showPhoto = hasSlots || selected;

  return (
    <button
      type="button"
      role="listitem"
      onClick={onSelect}
      aria-pressed={selected}
      className={`relative box-border flex min-w-[4.85rem] shrink-0 flex-col items-center justify-center overflow-hidden rounded-[12px] border-2 px-2.5 py-2.5 transition active:scale-[0.98] ${
        selected
          ? 'border-[#3B4CCA]'
          : hasSlots
            ? 'border-[#3B4CCA]/30'
            : isToday
              ? 'border-[#3B4CCA]/20 bg-[#F5F5F5]'
              : 'border-[#EBEBEB] bg-[#EBEBEB]'
      } ${!selected && !hasSlots ? 'opacity-80' : ''}`}
    >
      {showPhoto ? <SchedulePhotoActiveLayers /> : null}
      {showPhoto ? (
        <span
          className={`pointer-events-none absolute inset-0 ${selected ? 'bg-white/65' : 'bg-white/48'}`}
          aria-hidden
        />
      ) : null}

      <span
        className={`relative z-10 text-center text-[11px] font-semibold leading-tight ${
          selected ? 'font-bold text-[#3B4CCA]' : 'text-[#111827]'
        }`}
      >
        {formatDayChipLabel(dateIso)}
      </span>

      {hasSlots ? (
        <span className="relative z-10 mt-1.5 rounded-full bg-[#EEF0FC] px-2 py-0.5 text-[10px] font-bold uppercase leading-none tracking-[0.02em] text-[#3B4CCA]">
          {windowHintLabel(count)}
        </span>
      ) : (
        <span className="relative z-10 mt-1.5 text-[11px] font-medium text-[#9CA3AF]">—</span>
      )}
    </button>
  );
}
