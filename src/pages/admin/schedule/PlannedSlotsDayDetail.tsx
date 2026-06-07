import { HiChevronLeft, HiClock } from 'react-icons/hi2';
import { scheduleAccentTextLink } from './adminScheduleTheme';
import type { PlannedSlot } from './scheduleTypes';
import { formatPreviewSummaryParts, windowsCountRu } from './scheduleUtils';

type Props = {
  dateIso: string;
  slots: PlannedSlot[];
  slotLabel?: string;
  onBack: () => void;
};

function PlannedSlotWindowRow({ slot, slotLabel }: { slot: PlannedSlot; slotLabel?: string }) {
  return (
    <li className="flex items-center gap-3 rounded-[12px] bg-[#EEF0FC] px-3 py-2.5">
      <div className="flex w-[4rem] shrink-0 flex-col items-center justify-center gap-0.5 rounded-[10px] bg-white/90 py-2.5 text-[#111827]">
        <HiClock className="h-4 w-4 shrink-0 text-[#3B4CCA] opacity-80" aria-hidden />
        <span className="text-[15px] font-bold tabular-nums leading-none">{slot.startTime}</span>
        <span className="text-[11px] font-medium tabular-nums text-[#6B7280]">{slot.endTime}</span>
      </div>
      {slotLabel ? (
        <p className="min-w-0 flex-1 line-clamp-2 text-[13px] font-semibold leading-snug text-[#374151]">
          {slotLabel}
        </p>
      ) : (
        <span className="min-w-0 flex-1" />
      )}
      <p className="shrink-0 text-[14px] font-bold text-[#3B4CCA]">Окно</p>
    </li>
  );
}

export function PlannedSlotsDayDetail({ dateIso, slots, slotLabel, onBack }: Props) {
  const { dateLine } = formatPreviewSummaryParts(dateIso, slots[0]?.startTime ?? '00:00', slots[0]?.endTime ?? '00:00');

  return (
    <div className="space-y-3">
      <button type="button" onClick={onBack} className={`flex items-center gap-1 ${scheduleAccentTextLink}`}>
        <HiChevronLeft className="h-4 w-4 shrink-0" aria-hidden />
        Все дни
      </button>

      <div className="rounded-[12px] bg-[#EEF0FC] px-4 py-3.5">
        <p className="text-[15px] font-bold tracking-[-0.02em] text-[#111827]">{dateLine}</p>
        <p className="mt-0.5 text-[13px] font-semibold text-[#3B4CCA]">{windowsCountRu(slots.length)}</p>
      </div>

      <ul className="max-h-[min(22rem,50vh)] space-y-2 overflow-y-auto overscroll-y-auto">
        {slots.map((slot, index) => (
          <PlannedSlotWindowRow
            key={`${slot.dateIso}-${slot.startTime}-${index}`}
            slot={slot}
            slotLabel={slotLabel}
          />
        ))}
      </ul>
    </div>
  );
}
