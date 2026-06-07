import type { ServiceCategoryDto } from '../../../features/master-onboarding/api/becomeMasterApi';
import { type CatalogFiltersState } from './catalogFiltersState';
import { ServicesCatalogCategoryMenu } from './ServicesCatalogCategoryMenu';
import { ServicesCatalogFiltersSheetPanel } from './ServicesCatalogFiltersSheetPanel';
import { FilterSection } from './catalogFilterUi';
import { catalogDesktopPanel } from './servicesCatalogTheme';

type Props = {
  categories: ServiceCategoryDto[];
  filters: CatalogFiltersState;
  onChange: (next: CatalogFiltersState) => void;
  onReset: () => void;
  activeFilterCount: number;
  /** Категория и заголовок вынесены в общую шапку */
  bodyOnly?: boolean;
};

export function ServicesCatalogDesktopSidebar({
  categories,
  filters,
  onChange,
  onReset,
  activeFilterCount,
  bodyOnly = false,
}: Props) {
  const filterSubtitle =
    activeFilterCount > 0
      ? `${activeFilterCount} ${activeFilterCount === 1 ? 'параметр' : activeFilterCount < 5 ? 'параметра' : 'параметров'}`
      : null;

  return (
    <aside
      className={`${catalogDesktopPanel} flex h-full min-h-0 flex-col overflow-hidden`}
    >
      {!bodyOnly ? (
        <header className="shrink-0 border-b border-[#EEEEEE] bg-white px-4 pb-3 pt-3 lg:px-5">
          <div className="flex items-end justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-[18px] font-bold tracking-[-0.03em] text-[#111827]">Фильтры</h2>
              {filterSubtitle ? (
                <p className="mt-0.5 text-[13px] text-[#6B7280]">{filterSubtitle}</p>
              ) : null}
            </div>
            {activeFilterCount > 0 ? (
              <button
                type="button"
                onClick={onReset}
                className="shrink-0 pb-0.5 text-[14px] font-semibold text-[#F47C8C]"
              >
                Сбросить все
              </button>
            ) : null}
          </div>
        </header>
      ) : null}

      <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto overscroll-y-contain p-4 pt-3 scrollbar-hidden">
        {!bodyOnly ? (
          <FilterSection title="Категория" variant="sheet" collapsible={false}>
            <ServicesCatalogCategoryMenu
              categories={categories}
              categoryCode={filters.categoryCode}
              onSelect={(code) => onChange({ ...filters, categoryCode: code })}
              fullWidth
            />
          </FilterSection>
        ) : null}

        <ServicesCatalogFiltersSheetPanel
          filters={filters}
          onChange={onChange}
          categories={categories}
          hidePromo
          hideCategory
        />
      </div>
    </aside>
  );
}
