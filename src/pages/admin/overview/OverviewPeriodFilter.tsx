import type { OverviewPeriodPreset } from './overviewAnalytics';
import { overviewCard } from './adminOverviewTheme';

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
    <div className={`${overviewCard} p-1.5`}>
      <div className="flex gap-1" role="group" aria-label="Период данных">
        {PRESETS.map((preset) => {
          const selected = value === preset.id;
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => onChange(preset.id)}
              className={`min-h-10 flex-1 rounded-[16px] px-2 text-[13px] font-semibold transition duration-200 active:scale-[0.97] ${
                selected
                  ? 'bg-[#F47C8C] text-white shadow-[0_4px_14px_rgba(244,124,140,0.28)]'
                  : 'bg-transparent text-[#6B7280] hover:bg-[#FFF1F4] hover:text-[#F47C8C]'
              }`}
            >
              {preset.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
