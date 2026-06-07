import { useLayoutEffect } from 'react';
import type { AggregatedServiceCard } from '../lib/aggregateServices';
import { CLIENT_DESKTOP_SHELL_CLASS } from '../../../shared/layout/clientShellLayout';
import { countActiveCatalogFilters, type CatalogFiltersState } from './catalogFiltersState';
import { catalogCanvasClass, catalogDesktopShellClass } from './servicesCatalogTheme';
import { ServicesCatalogDesktopTopBar } from './ServicesCatalogDesktopTopBar';
import type { CatalogSearchSuggestSelection } from './catalogSearchSuggestTypes';
import { ServicesCatalogResults } from './ServicesCatalogResults';

type Props = {
  search: string;
  onSearchChange: (value: string) => void;
  filters: CatalogFiltersState;
  onFiltersChange: (next: CatalogFiltersState) => void;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  servicesEmpty: boolean;
  filteredEmpty: boolean;
  showSections: boolean;
  filtered: AggregatedServiceCard[];
  popular: AggregatedServiceCard[];
  promoServices: AggregatedServiceCard[];
  onOpenFilters: () => void;
  onSearchSelect: (selection: CatalogSearchSuggestSelection) => void;
};

export function ServicesCatalogDesktop({
  search,
  onSearchChange,
  filters,
  onFiltersChange,
  loading,
  error,
  onRetry,
  servicesEmpty,
  filteredEmpty,
  showSections,
  filtered,
  popular,
  promoServices,
  onOpenFilters,
  onSearchSelect,
}: Props) {
  const activeFilterCount = countActiveCatalogFilters(filters);

  useLayoutEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const sync = () => {
      document.documentElement.classList.toggle('catalog-desktop-scroll-lock', mq.matches);
    };
    sync();
    mq.addEventListener('change', sync);
    return () => {
      document.documentElement.classList.remove('catalog-desktop-scroll-lock');
      mq.removeEventListener('change', sync);
    };
  }, []);

  return (
    <div className={`${catalogDesktopShellClass} hidden lg:flex ${catalogCanvasClass}`}>
      <div className={`${CLIENT_DESKTOP_SHELL_CLASS} flex min-h-0 flex-1 flex-col overflow-hidden pt-2`}>
        <div className="mb-2 shrink-0">
          <ServicesCatalogDesktopTopBar
            search={search}
            onSearchChange={onSearchChange}
            onSearchSelect={onSearchSelect}
            filters={filters}
            onChange={onFiltersChange}
            activeFilterCount={activeFilterCount}
            loading={loading}
            showResultsMeta={!loading && !error && !servicesEmpty && !filteredEmpty}
            resultCount={filtered.length}
            onOpenFilters={onOpenFilters}
          />
        </div>

        <div className="scrollbar-hidden relative z-0 min-h-0 flex-1 overflow-y-auto overscroll-y-contain pb-10">
          <ServicesCatalogResults
            layout="desktop"
            loading={loading}
            error={error}
            onRetry={onRetry}
            servicesEmpty={servicesEmpty}
            filteredEmpty={filteredEmpty}
            showSections={showSections}
            filtered={filtered}
            popular={popular}
            promoServices={promoServices}
            search={search}
            onClearSearch={() => onSearchChange('')}
            filters={filters}
            onFiltersChange={onFiltersChange}
            hideResultsHeader
          />
        </div>
      </div>
    </div>
  );
}
