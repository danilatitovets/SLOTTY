import { HiAdjustmentsHorizontal, HiSparkles } from 'react-icons/hi2';
import {
  toggleCatalogChip,
  type CatalogFiltersState,
} from './catalogFiltersState';

type Props = {
  filters: CatalogFiltersState;
  onFiltersChange: (next: CatalogFiltersState) => void;
  onOpenFilters: () => void;
  activeFilterCount: number;
};

const pillBase =
  'inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-2 text-[13px] font-semibold transition active:scale-[0.98]';

function pillClass(active: boolean): string {
  return active
    ? `${pillBase} bg-[#F47C8C] text-white`
    : `${pillBase} bg-white text-[#374151] ring-1 ring-[#EAECEF]`;
}

export function CatalogMobileQuickFilters({
  filters,
  onFiltersChange,
  onOpenFilters,
  activeFilterCount,
}: Props) {
  const patch = (next: Partial<CatalogFiltersState>) =>
    onFiltersChange({ ...filters, ...next });

  return (
    <div className="scrollbar-hidden flex gap-2 overflow-x-auto overscroll-x-contain pb-0.5 [touch-action:pan-x]">
      <button
        type="button"
        onClick={() => patch({ promotionOnly: !filters.promotionOnly })}
        className={pillClass(filters.promotionOnly)}
      >
        <HiSparkles className="h-3.5 w-3.5 shrink-0" aria-hidden />
        Акции
      </button>
      <button
        type="button"
        onClick={() =>
          onFiltersChange(toggleCatalogChip(filters, 'today'))
        }
        className={pillClass(filters.chips.has('today'))}
      >
        Сегодня
      </button>
      <button
        type="button"
        onClick={() =>
          patch({
            minRating: filters.minRating != null && filters.minRating >= 4.5 ? null : 4.5,
          })
        }
        className={pillClass(filters.minRating != null && filters.minRating >= 4.5)}
      >
        ★ от 4,5
      </button>
      <button
        type="button"
        onClick={onOpenFilters}
        className={`${pillBase} relative bg-white text-[#374151] ring-1 ring-[#EAECEF]`}
      >
        <HiAdjustmentsHorizontal className="h-4 w-4 shrink-0" aria-hidden />
        Ещё
        {activeFilterCount > 0 ? (
          <span className="ml-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#F47C8C] px-1 text-[10px] font-bold text-white">
            {activeFilterCount > 9 ? '9+' : activeFilterCount}
          </span>
        ) : null}
      </button>
    </div>
  );
}
