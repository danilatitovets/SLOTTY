import type { ServiceCategoryDto } from '../../../features/master-onboarding/api/becomeMasterApi';
import type { CategoryMasterFilters } from '../lib/categoryMasterFilters';
import { ServicesCatalogCategoryMenu } from '../servicesCatalog/ServicesCatalogCategoryMenu';
import { FilterSection } from '../servicesCatalog/catalogFilterUi';
import { catalogDesktopPanel } from '../servicesCatalog/servicesCatalogTheme';
import { MastersCatalogFiltersPanel } from '../mastersCatalog/MastersCatalogFiltersPanel';

type Props = {
  categories: ServiceCategoryDto[];
  categoryCode: string;
  filters: CategoryMasterFilters;
  onChange: (next: CategoryMasterFilters) => void;
  onReset: () => void;
  onCategorySelect: (code: string | null) => void;
  activeFilterCount: number;
};

export function ServiceCategoryDesktopSidebar({
  categories,
  categoryCode,
  filters,
  onChange,
  onReset,
  onCategorySelect,
  activeFilterCount,
}: Props) {
  const filterSubtitle =
    activeFilterCount > 0
      ? `${activeFilterCount} ${activeFilterCount === 1 ? 'параметр' : activeFilterCount < 5 ? 'параметра' : 'параметров'}`
      : null;

  const categoryHint =
    categoryCode != null ? categories.find((c) => c.code === categoryCode)?.name ?? null : null;

  return (
    <aside className={`${catalogDesktopPanel} flex h-full min-h-0 flex-col overflow-hidden`}>
      <header className="shrink-0 border-b border-[#EEEEEE] bg-white px-4 pb-3 pt-3 lg:px-5">
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-[18px] font-bold tracking-[-0.03em] text-[#111827]">Фильтры</h2>
            {filterSubtitle ? (
              <p className="mt-0.5 text-[12px] text-[#6B7280]">{filterSubtitle}</p>
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

      <div className="scrollbar-hidden flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto overscroll-y-contain p-4 pt-3">
        <FilterSection title="Категория" activeHint={categoryHint}>
          <ServicesCatalogCategoryMenu
            categories={categories}
            categoryCode={categoryCode}
            onSelect={onCategorySelect}
            fullWidth
          />
        </FilterSection>

        <MastersCatalogFiltersPanel filters={filters} onChange={onChange} />
      </div>
    </aside>
  );
}
