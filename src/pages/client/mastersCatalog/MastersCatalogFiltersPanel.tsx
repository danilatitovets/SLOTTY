import type { ServiceCategoryDto } from '../../../features/master-onboarding/api/becomeMasterApi';
import { categoryCodesMatch } from '../../../features/catalog/serviceCategoryLabels';
import {
  MASTER_SORT_OPTIONS,
  type CategoryMasterFilters,
} from '../lib/categoryMasterFilters';
import {
  DATE_FILTER_OPTIONS,
  DURATION_FILTER_OPTIONS,
  FilterChip,
  FilterPromoBar,
  FilterSection,
  FilterSwitch,
  TIME_FILTER_OPTIONS,
  VISIT_FILTER_OPTIONS,
} from '../servicesCatalog/catalogFilterUi';
import {
  MASTER_PRICE_OPTIONS,
  MASTER_RATING_OPTIONS,
  MASTER_REVIEWS_OPTIONS,
} from './mastersCatalogFilterHints';
import {
  HiAdjustmentsHorizontal,
  HiBuildingStorefront,
  HiCalendarDays,
  HiClock,
  HiStar,
} from 'react-icons/hi2';

type Props = {
  filters: CategoryMasterFilters;
  onChange: (next: CategoryMasterFilters) => void;
  layout?: 'sheet';
  categories?: ServiceCategoryDto[];
};

export function MastersCatalogFiltersPanel({
  filters,
  onChange,
  layout = 'sheet',
  categories = [],
}: Props) {
  const sheet = layout === 'sheet';
  const uiVariant = sheet ? 'sheet' : 'default';
  const chipsClass = 'flex flex-wrap gap-2';
  const set = (patch: Partial<CategoryMasterFilters>) => onChange({ ...filters, ...patch });

  const categoryHint =
    filters.categoryCode != null
      ? categories.find((c) => categoryCodesMatch(filters.categoryCode, c.code))?.name ?? null
      : null;

  return (
    <div className="flex flex-col gap-5">
      <FilterPromoBar
        active={filters.promotionOnly}
        label="Акции"
        onChange={(promotionOnly) => set({ promotionOnly })}
      />

      <FilterSection icon={HiCalendarDays} title="Цена, BYN" variant={uiVariant} collapsible={false}>
        <div className={chipsClass}>
          {MASTER_PRICE_OPTIONS.map(({ value, label }) => (
            <FilterChip
              key={String(value)}
              active={filters.priceTier === value}
              label={label}
              variant={uiVariant}
              onClick={() => set({ priceTier: value })}
            />
          ))}
        </div>
      </FilterSection>

      <FilterSection icon={HiCalendarDays} title="Срок записи" variant={uiVariant} collapsible={false}>
        <div className={chipsClass}>
          {DATE_FILTER_OPTIONS.map(({ value, label }) => (
            <FilterChip
              key={value}
              active={filters.dateRange === value}
              label={label}
              variant={uiVariant}
              onClick={() => set({ dateRange: value })}
            />
          ))}
        </div>
      </FilterSection>

      {categories.length > 0 ? (
        <FilterSection
          title="Категория"
          activeHint={categoryHint}
          variant={uiVariant}
          collapsible={false}
        >
          <div className={chipsClass}>
            <FilterChip
              active={filters.categoryCode == null}
              label="Все"
              variant={uiVariant}
              onClick={() => set({ categoryCode: null })}
            />
            {categories.map((cat) => (
              <FilterChip
                key={cat.code}
                active={categoryCodesMatch(filters.categoryCode, cat.code)}
                label={cat.name}
                variant={uiVariant}
                onClick={() => set({ categoryCode: cat.code })}
              />
            ))}
          </div>
        </FilterSection>
      ) : null}

      <FilterSection icon={HiClock} title="Время дня" variant={uiVariant} collapsible={false}>
        <div className={chipsClass}>
          {TIME_FILTER_OPTIONS.map(({ value, label }) => (
            <FilterChip
              key={value}
              active={filters.timeOfDay === value}
              label={label}
              variant={uiVariant}
              onClick={() => set({ timeOfDay: value })}
            />
          ))}
        </div>
      </FilterSection>

      <FilterSection icon={HiBuildingStorefront} title="Формат" variant={uiVariant} collapsible={false}>
        <div className={chipsClass}>
          {VISIT_FILTER_OPTIONS.map(({ value, label }) => (
            <FilterChip
              key={value}
              active={filters.visitType === value}
              label={label}
              variant={uiVariant}
              onClick={() => set({ visitType: value })}
            />
          ))}
        </div>
      </FilterSection>

      <FilterSection icon={HiStar} title="Рейтинг" variant={uiVariant} collapsible={false}>
        <div className={chipsClass}>
          {MASTER_RATING_OPTIONS.map(({ value, label }) => (
            <FilterChip
              key={String(value)}
              active={filters.minRating === value}
              label={label}
              variant={uiVariant}
              onClick={() =>
                set({
                  minRating: value,
                  sortBy:
                    value != null
                      ? 'rating'
                      : filters.sortBy === 'rating'
                        ? 'recommended'
                        : filters.sortBy,
                })
              }
            />
          ))}
        </div>
      </FilterSection>

      <FilterSection icon={HiStar} title="Отзывы" variant={uiVariant} collapsible={false}>
        <div className={chipsClass}>
          {MASTER_REVIEWS_OPTIONS.map(({ value, label }) => (
            <FilterChip
              key={String(value)}
              active={filters.minReviews === value}
              label={label}
              variant={uiVariant}
              onClick={() => set({ minReviews: value })}
            />
          ))}
        </div>
      </FilterSection>

      <FilterSection icon={HiClock} title="Длительность" variant={uiVariant} collapsible={false}>
        <div className={chipsClass}>
          {DURATION_FILTER_OPTIONS.map(({ value, label }) => (
            <FilterChip
              key={value}
              active={filters.duration === value}
              label={label}
              variant={uiVariant}
              onClick={() => set({ duration: value })}
            />
          ))}
        </div>
      </FilterSection>

      <FilterSection icon={HiAdjustmentsHorizontal} title="Сортировка" variant={uiVariant} collapsible={false}>
        <div className={chipsClass}>
          {MASTER_SORT_OPTIONS.map(({ value, label }) => (
            <FilterChip
              key={value}
              active={filters.sortBy === value}
              label={label}
              variant={uiVariant}
              onClick={() => set({ sortBy: value })}
            />
          ))}
        </div>
      </FilterSection>

      <FilterSwitch
        active={filters.onlyWithSlots}
        label="Только со свободными окнами"
        variant={uiVariant}
        onChange={(onlyWithSlots) => set({ onlyWithSlots })}
      />
      <FilterSwitch
        active={filters.verifiedOnly}
        label="Проверенные мастера"
        variant={uiVariant}
        onChange={(verifiedOnly) => set({ verifiedOnly })}
      />
    </div>
  );
}
