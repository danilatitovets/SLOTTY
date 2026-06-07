import { useEffect, useMemo, useState } from 'react';
import { HiChevronRight } from 'react-icons/hi2';
import { scheduleSheetFormPanel } from './adminScheduleTheme';
import { PlannedSlotsDayDetail } from './PlannedSlotsDayDetail';
import type { PlannedSlot } from './scheduleTypes';
import {
  formatPreviewSummaryParts,
  groupPlannedSlotsByDay,
  windowsCountRu,
} from './scheduleUtils';

type Props = {
  slots: PlannedSlot[];
  sheetOpen?: boolean;
  slotLabel?: string;
};

function dayTimeSpan(daySlots: PlannedSlot[]): string {
  if (daySlots.length === 0) return '';
  if (daySlots.length === 1) {
    const slot = daySlots[0]!;
    return `${slot.startTime}–${slot.endTime}`;
  }
  return `${daySlots[0]!.startTime}–${daySlots[daySlots.length - 1]!.endTime}`;
}

export function PlannedSlotsByDayList({ slots, sheetOpen, slotLabel }: Props) {
  const [selectedDateIso, setSelectedDateIso] = useState<string | null>(null);
  const groups = useMemo(() => groupPlannedSlotsByDay(slots), [slots]);

  useEffect(() => {
    if (!sheetOpen) setSelectedDateIso(null);
  }, [sheetOpen]);

  const selectedGroup = selectedDateIso
    ? groups.find((group) => group.dateIso === selectedDateIso) ?? null
    : null;

  if (groups.length === 0) return null;

  if (selectedGroup) {
    return (
      <PlannedSlotsDayDetail
        dateIso={selectedGroup.dateIso}
        slots={selectedGroup.slots}
        slotLabel={slotLabel}
        onBack={() => setSelectedDateIso(null)}
      />
    );
  }

  return (
    <div className="space-y-3">
      <div className={`${scheduleSheetFormPanel} !p-3`}>
        <ul className="space-y-2">
          {groups.map(({ dateIso, slots: daySlots }) => {
            const count = daySlots.length;
            const { dateLine } = formatPreviewSummaryParts(
              dateIso,
              daySlots[0]!.startTime,
              daySlots[0]!.endTime,
            );

            return (
              <li key={dateIso}>
                <button
                  type="button"
                  onClick={() => setSelectedDateIso(dateIso)}
                  className="flex w-full items-center gap-3 rounded-[12px] bg-[#F5F5F5] px-3 py-3.5 text-left transition active:scale-[0.99] hover:bg-[#EFEFEF]"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-[15px] font-bold tracking-[-0.02em] text-[#111827]">{dateLine}</p>
                    <p className="mt-0.5 text-[13px] font-medium text-[#6B7280]">
                      {windowsCountRu(count)} · {dayTimeSpan(daySlots)}
                    </p>
                  </div>
                  <HiChevronRight className="h-5 w-5 shrink-0 text-[#9CA3AF]" aria-hidden />
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <p className="text-center text-[13px] font-semibold text-[#6B7280]">
        Всего {windowsCountRu(slots.length)}
      </p>
    </div>
  );
}
