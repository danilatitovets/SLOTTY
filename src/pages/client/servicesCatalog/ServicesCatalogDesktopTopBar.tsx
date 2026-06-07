import { HiAdjustmentsHorizontal } from 'react-icons/hi2';
import {
  getCatalogViewTab,
  setCatalogViewTab,
  type CatalogFiltersState,
} from './catalogFiltersState';
import { CatalogResultsHeader } from './CatalogResultsHeader';
import { CatalogSearchSuggestField } from './CatalogSearchSuggestField';
import type { CatalogSearchSuggestSelection } from './catalogSearchSuggestTypes';
import { ServicesCatalogViewTabs } from './ServicesCatalogViewTabs';
import {
  catalogDesktopPanel,
  catalogFieldClass,
  catalogSearchFieldClass,
} from './servicesCatalogTheme';

type Props = {
  search: string;
  onSearchChange: (value: string) => void;
  onSearchSelect: (selection: CatalogSearchSuggestSelection) => void;
  filters: CatalogFiltersState;
  onChange: (next: CatalogFiltersState) => void;
  activeFilterCount: number;
  loading: boolean;
  showResultsMeta?: boolean;
  resultCount?: number;
  onOpenFilters: () => void;
};

export function ServicesCatalogDesktopTopBar({
  search,
  onSearchChange,
  onSearchSelect,
  filters,
  onChange,
  activeFilterCount,
  loading,
  showResultsMeta = false,
  resultCount = 0,
  onOpenFilters,
}: Props) {
  const activeTab = getCatalogViewTab(filters);

  return (
    <header className={`${catalogDesktopPanel} px-3 py-2 lg:px-4`}>
      <div className="flex items-center gap-2">
        <CatalogSearchSuggestField
          value={search}
          onChange={onSearchChange}
          onSelect={onSearchSelect}
          placeholder="Маникюр, стрижка, брови, массаж…"
          disabled={loading}
          inputClassName={`h-8 w-full pl-8 pr-9 text-[13px] font-medium ${catalogSearchFieldClass}`}
          trailing={
            search.trim() ? (
              <button
                type="button"
                aria-label="Очистить поиск"
                onClick={() => onSearchChange('')}
                className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-[15px] text-[#8E8E93] transition hover:bg-[#E4E4E4] hover:text-[#111827]"
              >
                ×
              </button>
            ) : null
          }
        />

        <button
          type="button"
          onClick={onOpenFilters}
          aria-label={
            activeFilterCount > 0 ? `Фильтры, выбрано ${activeFilterCount}` : 'Фильтры'
          }
          className={`relative flex h-8 w-8 shrink-0 items-center justify-center ${catalogFieldClass} text-[#6B7280] transition hover:text-[#111827]`}
        >
          <HiAdjustmentsHorizontal className="h-5 w-5" aria-hidden />
          {activeFilterCount > 0 ? (
            <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#F47C8C] px-1 text-[10px] font-bold text-white">
              {activeFilterCount > 9 ? '9+' : activeFilterCount}
            </span>
          ) : null}
        </button>
      </div>

      <div className="mt-1.5">
        <ServicesCatalogViewTabs
          activeTab={activeTab}
          onTabChange={(tab) => onChange(setCatalogViewTab(filters, tab))}
          dense
        />
      </div>

      {showResultsMeta ? (
        <CatalogResultsHeader
          compact
          count={resultCount}
          sortBy={filters.sortBy}
          onSortChange={(sortBy) => onChange({ ...filters, sortBy })}
        />
      ) : null}
    </header>
  );
}
