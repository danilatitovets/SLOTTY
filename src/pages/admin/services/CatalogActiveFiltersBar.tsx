import { HiXMark } from 'react-icons/hi2';
import { sheetHintClass, sheetSectionTitleClass } from '../profile/adminProfileCabinetTheme';

const catalogFilterSectionClass = 'rounded-[16px] bg-white p-3.5 sm:p-4';
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
    <section className={catalogFilterSectionClass}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className={sheetSectionTitleClass}>Фильтры</p>
        <button
          type="button"
          onClick={onReset}
          className="text-[12px] font-semibold text-[#F47C8C] transition hover:text-[#ff5f7a]"
        >
          Сбросить все
        </button>
      </div>
      <p className={`mt-0.5 ${sheetHintClass}`}>Нажмите на чип, чтобы убрать</p>
      <div className="mt-2.5 flex flex-wrap items-center gap-2">
        {chips.map((chip) => (
          <button
            key={chip.key}
            type="button"
            onClick={() => onChange(chip.reset)}
            className="inline-flex max-w-full items-center gap-1 rounded-full bg-[#FFF1F4] py-1.5 pl-3 pr-2 text-[13px] font-semibold text-[#F47C8C] ring-1 ring-[#FDE8ED] transition hover:bg-[#FFE4EA] active:scale-[0.98]"
          >
            <span className="truncate">{chip.label}</span>
            <HiXMark className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
            <span className="sr-only">Убрать фильтр</span>
          </button>
        ))}
      </div>
    </section>
  );
}
