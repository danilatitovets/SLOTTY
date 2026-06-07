import { PlannedSlotsPreviewSheet } from './PlannedSlotsPreviewSheet';
import type { PlannedSlot } from './scheduleTypes';
import { windowsCountRu } from './scheduleUtils';

type Props = {
  slots: PlannedSlot[];
  creatableCount: number;
  beyondHorizon?: number;
  horizonDays?: number | null;
  slotLabel?: string;
  cabinet?: boolean;
};

export function PlannedSlotsCalendarLauncher({
  slots,
  creatableCount,
  beyondHorizon = 0,
  horizonDays,
  slotLabel,
  cabinet,
}: Props) {
  if (slots.length === 0) return null;

  const willCreate = creatableCount;
  const title =
    willCreate === slots.length
      ? `Будет создано: ${windowsCountRu(slots.length)}`
      : `Создастся ${windowsCountRu(willCreate)} из ${slots.length}`;

  return (
    <div className={cabinet ? undefined : 'space-y-3'}>
      <div className="flex items-start justify-between gap-3">
        <p
          className={
            cabinet
              ? 'text-[14px] font-bold tracking-[-0.02em] text-[#111827]'
              : 'text-[17px] font-black tracking-[-0.04em] text-[#111827]'
          }
        >
          Список окон
        </p>
        <p className="shrink-0 text-right text-[13px] font-semibold text-[#6B7280]">{title}</p>
      </div>

      <PlannedSlotsPreviewSheet
        slots={slots}
        beyondHorizon={beyondHorizon}
        horizonDays={horizonDays}
        slotLabel={slotLabel}
      />

      {beyondHorizon > 0 && horizonDays != null && horizonDays > 0 ? (
        <p className="text-[12px] font-medium leading-snug text-[#B45309]">
          {beyondHorizon} {beyondHorizon === 1 ? 'дата выходит' : 'дат выходят'} за горизонт тарифа (
          {horizonDays} дней).
        </p>
      ) : null}
    </div>
  );
}
