import { HiAdjustmentsHorizontal } from 'react-icons/hi2';
import {
  filtersToMastersQuickChips,
  type CategoryMasterFilters,
} from '../lib/categoryMasterFilters';

type Props = {
  filters: CategoryMasterFilters;
  onToggleChip: (id: string) => void;
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

const QUICK_CHIPS = [
  { id: 'near', label: 'Рядом' },
  { id: 'today', label: 'Сегодня' },
  { id: 'top', label: 'Топ ★' },
  { id: 'home', label: 'На дому' },
] as const;

export function CatalogMobileMastersQuickFilters({
  filters,
  onToggleChip,
  onOpenFilters,
  activeFilterCount,
}: Props) {
  const activeIds = filtersToMastersQuickChips(filters);

  return (
    <div className="scrollbar-hidden flex gap-2 overflow-x-auto overscroll-x-contain pb-0.5 [touch-action:pan-x]">
      {QUICK_CHIPS.map(({ id, label }) => (
        <button
          key={id}
          type="button"
          onClick={() => onToggleChip(id)}
          className={pillClass(activeIds.has(id))}
        >
          {label}
        </button>
      ))}
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
