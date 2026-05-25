import { HiXMark } from 'react-icons/hi2';
import type { CatalogFiltersState } from './ServicesCatalogFiltersSheet';
import { getActiveCatalogFilterChips } from './catalogFilterLabels';

type Props = {
  filters: CatalogFiltersState;
  onChange: (patch: Partial<CatalogFiltersState>) => void;
  onReset: () => void;
};

export function CatalogActiveFiltersBar({ filters, onChange, onReset }: Props) {
  const chips = getActiveCatalogFilterChips(filters);
  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {chips.map((chip) => (
        <button
          key={chip.key}
          type="button"
          onClick={() => onChange(chip.reset)}
          className="inline-flex max-w-full items-center gap-1 rounded-full bg-[#FFF1F4] py-1.5 pl-3 pr-2 text-[13px] font-semibold text-[#F47C8C] transition hover:bg-[#FFE4EA] active:scale-[0.98]"
        >
          <span className="truncate">{chip.label}</span>
          <HiXMark className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
          <span className="sr-only">Убрать фильтр</span>
        </button>
      ))}
      <button
        type="button"
        onClick={onReset}
        className="text-[13px] font-semibold text-[#6B7280] underline-offset-2 transition hover:text-[#111827] hover:underline"
      >
        Сбросить
      </button>
    </div>
  );
}
