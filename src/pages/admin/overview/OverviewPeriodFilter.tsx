import type { OverviewPeriodPreset } from './overviewAnalytics';
import { overviewPeriodSegmentClass, overviewPeriodTrack } from './adminOverviewTheme';

const PRESETS: Array<{ id: OverviewPeriodPreset; label: string }> = [
  { id: 'today', label: 'Сегодня' },
  { id: 'week', label: 'Неделя' },
  { id: 'month', label: 'Месяц' },
  { id: 'all', label: 'Всё время' },
];

type Props = {
  value: OverviewPeriodPreset;
  onChange: (preset: OverviewPeriodPreset) => void;
};

export function OverviewPeriodFilter({ value, onChange }: Props) {
  return (
    <div className="min-w-0" role="group" aria-label="Период данных">
      <div className={`${overviewPeriodTrack} lg:inline-grid lg:max-w-[28rem]`}>
        {PRESETS.map((preset) => {
          const selected = value === preset.id;
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => onChange(preset.id)}
              aria-pressed={selected}
              className={overviewPeriodSegmentClass(selected)}
            >
              {preset.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
