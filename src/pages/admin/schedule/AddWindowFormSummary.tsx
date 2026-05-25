import { HiSparkles } from 'react-icons/hi2';
import {
  durationMinutesBetween,
  formatDurationRu,
  formatPreviewSummaryParts,
  templateDisplayLabel,
  windowsCountRu,
} from './scheduleUtils';
import type { WindowTemplate } from './scheduleTypes';
import { adminFormSheetMetricCatalog } from '../shared/adminFormSheetTheme';
import { scheduleSheetSummaryBox } from './adminScheduleTheme';
import { formatRepeatSummaryRows, type RepeatSettingsValue } from './repeatSettingsConfig';
import { countRepeatDates } from './scheduleUtils';

type Props = {
  dateIso: string;
  startTime: string;
  endTime: string;
  serviceLabel: string;
  selectedTemplate: WindowTemplate | null;
  manualMode: boolean;
  repeatSettings: RepeatSettingsValue;
  creatableCount: number;
  totalPlanned: number;
};

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 first:pt-0 last:pb-0">
      <span className="shrink-0 text-[13px] font-medium text-[#6B7280]">{label}</span>
      <span className="min-w-0 text-right text-[14px] font-semibold leading-snug text-[#111827]">
        {value}
      </span>
    </div>
  );
}

export function AddWindowFormSummary({
  dateIso,
  startTime,
  endTime,
  serviceLabel,
  selectedTemplate,
  manualMode,
  repeatSettings,
  creatableCount,
  totalPlanned,
}: Props) {
  const duration = durationMinutesBetween(startTime, endTime);
  const { dateLine, timeLine } = formatPreviewSummaryParts(dateIso, startTime, endTime);
  const repeatDateCount = countRepeatDates(dateIso, repeatSettings);
  const repeatRows = formatRepeatSummaryRows(
    repeatSettings,
    repeatDateCount > 0 ? repeatDateCount : undefined,
  );

  const createLabel =
    creatableCount === totalPlanned
      ? `Будет создано ${windowsCountRu(creatableCount)}`
      : `Создастся ${windowsCountRu(creatableCount)} из ${totalPlanned}`;

  return (
    <div className={scheduleSheetSummaryBox}>
      <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#9CA3AF]">Итог</p>
      <p className="mt-2 text-[18px] font-bold leading-tight tracking-[-0.03em] text-[#111827]">
        {serviceLabel}
      </p>

      <div className={`mt-4 divide-y divide-[#D8D8D8] px-4 py-1 ${adminFormSheetMetricCatalog}`}>
        <SummaryRow label="Дата" value={dateLine} />
        <SummaryRow label="Время" value={timeLine} />
        <SummaryRow label="Длительность" value={formatDurationRu(duration)} />
        {repeatRows.map((row) => (
          <SummaryRow key={row.label} label={row.label} value={row.value} />
        ))}
      </div>

      {selectedTemplate && !manualMode ? (
        <p className="mt-3 flex items-center gap-2 text-[13px] font-medium text-[#6B7280]">
          <HiSparkles className="h-4 w-4 shrink-0 text-[#9CA3AF]" aria-hidden />
          <span>
            Шаблон{' '}
            <span className="font-semibold text-[#111827]">
              {templateDisplayLabel(selectedTemplate)}
            </span>
          </span>
        </p>
      ) : null}

      <p className="mt-4 rounded-[10px] bg-white px-4 py-3 text-center text-[15px] font-semibold text-[#111827] ring-1 ring-[#EEEEEE]">
        {createLabel}
      </p>
    </div>
  );
}
