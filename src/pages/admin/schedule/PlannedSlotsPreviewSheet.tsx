import { useState } from 'react';
import { PickerSheet } from '../../../shared/ui/PickerSheet';
import {
  scheduleAccentTextLink,
  scheduleSegmentClass,
  scheduleSheetPrimaryBtn,
} from './adminScheduleTheme';
import { PlannedSlotsByDayList } from './PlannedSlotsByDayList';
import { RepeatCalendarPreview } from './RepeatCalendarPreview';
import type { PlannedSlot } from './scheduleTypes';

export type PlannedSlotsPreviewMode = 'calendar' | 'days';

type Props = {
  slots: PlannedSlot[];
  beyondHorizon?: number;
  horizonDays?: number | null;
  slotLabel?: string;
  className?: string;
};

const MODE_LABELS: Record<PlannedSlotsPreviewMode, string> = {
  calendar: 'Календарь',
  days: 'По дням',
};

const MODE_SUBTITLES: Record<PlannedSlotsPreviewMode, string> = {
  calendar: 'Дни с новыми окнами в расписании',
  days: 'Сколько окон будет в каждый день',
};

export function PlannedSlotsPreviewSheet({
  slots,
  beyondHorizon = 0,
  horizonDays,
  slotLabel,
  className,
}: Props) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<PlannedSlotsPreviewMode>('calendar');

  if (slots.length === 0) return null;

  const openWith = (next: PlannedSlotsPreviewMode) => {
    setMode(next);
    setOpen(true);
  };

  const horizonWarning =
    beyondHorizon > 0 && horizonDays != null && horizonDays > 0 ? (
      <p className="mt-4 text-[12px] font-medium leading-snug text-[#B45309]">
        {beyondHorizon} {beyondHorizon === 1 ? 'дата за пределами' : 'дат за пределами'} тарифа (
        {horizonDays} дней) не {beyondHorizon === 1 ? 'будет' : 'будут'} созданы.
      </p>
    ) : null;

  return (
    <>
      <div className={`flex flex-wrap items-center gap-x-3 gap-y-1 ${className ?? ''}`}>
        <button type="button" onClick={() => openWith('calendar')} className={scheduleAccentTextLink}>
          Календарь
        </button>
        <span className="text-[13px] font-medium text-[#D1D5DB]" aria-hidden>
          ·
        </span>
        <button type="button" onClick={() => openWith('days')} className={scheduleAccentTextLink}>
          По дням
        </button>
      </div>

      <PickerSheet
        open={open}
        onClose={() => setOpen(false)}
        title={MODE_LABELS[mode]}
        subtitle={MODE_SUBTITLES[mode]}
        footer={
          <button type="button" className={scheduleSheetPrimaryBtn} onClick={() => setOpen(false)}>
            Готово
          </button>
        }
      >
        <div className="mb-4 flex gap-1.5" role="tablist" aria-label="Режим просмотра">
          {(['calendar', 'days'] as const).map((key) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={mode === key}
              onClick={() => setMode(key)}
              className={`${scheduleSegmentClass(mode === key)} min-h-10 flex-1 px-2 text-[13px]`}
            >
              {MODE_LABELS[key]}
            </button>
          ))}
        </div>

        {mode === 'calendar' ? (
          <RepeatCalendarPreview slots={slots} maxMonths={null} compact />
        ) : (
          <PlannedSlotsByDayList slots={slots} sheetOpen={open} slotLabel={slotLabel} />
        )}
        {horizonWarning}
      </PickerSheet>
    </>
  );
}
