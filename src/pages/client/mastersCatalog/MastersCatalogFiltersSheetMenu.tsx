import { useState } from 'react';
import type { ServiceCategoryDto } from '../../../features/master-onboarding/api/becomeMasterApi';
import { categoryCodesMatch } from '../../../features/catalog/serviceCategoryLabels';
import {
  MASTER_SORT_OPTIONS,
  type CategoryMasterFilters,
} from '../lib/categoryMasterFilters';
import { CatalogFilterSubSheet } from '../servicesCatalog/CatalogFilterSubSheet';
import {
  FilterMenuCard,
  FilterMenuRow,
} from '../servicesCatalog/catalogFilterMenuUi';
import {
  DATE_FILTER_OPTIONS,
  DURATION_FILTER_OPTIONS,
  FilterChip,
  FilterSwitch,
  TIME_FILTER_OPTIONS,
  VISIT_FILTER_OPTIONS,
} from '../servicesCatalog/catalogFilterUi';
import {
  MASTER_PRICE_OPTIONS,
  MASTER_RATING_OPTIONS,
  MASTER_REVIEWS_OPTIONS,
  mastersCatalogFilterHints,
} from './mastersCatalogFilterHints';

type SubSheetId =
  | 'category'
  | 'when'
  | 'time'
  | 'visit'
  | 'rating'
  | 'reviews'
  | 'price'
  | 'duration'
  | 'sort';

type Props = {
  filters: CategoryMasterFilters;
  onChange: (next: CategoryMasterFilters) => void;
  categories: ServiceCategoryDto[];
};

export function MastersCatalogFiltersSheetMenu({ filters, onChange, categories }: Props) {
  const [subSheet, setSubSheet] = useState<SubSheetId | null>(null);
  const hints = mastersCatalogFilterHints(filters);

  const set = (patch: Partial<CategoryMasterFilters>) => onChange({ ...filters, ...patch });

  const categoryHint =
    filters.categoryCode != null
      ? categories.find((c) => categoryCodesMatch(filters.categoryCode, c.code))?.name ?? null
      : null;

  const pickAndClose = (patch: Partial<CategoryMasterFilters>) => {
    set(patch);
    setSubSheet(null);
  };

  const chipGrid = 'flex flex-wrap gap-2';

  return (
    <>
      <FilterMenuCard>
        <div className="divide-y divide-[#F0F0F0]">
          {categories.length > 0 ? (
            <FilterMenuRow
              label="Категория"
              value={categoryHint}
              onClick={() => setSubSheet('category')}
            />
          ) : null}
          <FilterMenuRow label="Когда" value={hints.when} onClick={() => setSubSheet('when')} />
          <FilterMenuRow label="Время дня" value={hints.time} onClick={() => setSubSheet('time')} />
          <FilterMenuRow label="Формат" value={hints.visit} onClick={() => setSubSheet('visit')} />
          <FilterMenuRow label="Рейтинг" value={hints.rating} onClick={() => setSubSheet('rating')} />
          <FilterMenuRow label="Отзывы" value={hints.reviews} onClick={() => setSubSheet('reviews')} />
          <FilterMenuRow label="Цена" value={hints.price} onClick={() => setSubSheet('price')} />
          <FilterMenuRow
            label="Длительность"
            value={hints.duration}
            onClick={() => setSubSheet('duration')}
          />
          <FilterMenuRow label="Сортировка" value={hints.sort} onClick={() => setSubSheet('sort')} />
        </div>
      </FilterMenuCard>

      <FilterMenuCard className="mt-3 px-4 py-1">
        <FilterSwitch
          active={filters.onlyWithSlots}
          label="Только со свободными окнами"
          variant="sheet"
          onChange={(onlyWithSlots) => set({ onlyWithSlots })}
        />
      </FilterMenuCard>

      <FilterMenuCard className="mt-3 px-4 py-1">
        <FilterSwitch
          active={filters.promotionOnly}
          label="Только с акциями"
          variant="sheet"
          onChange={(promotionOnly) => set({ promotionOnly })}
        />
      </FilterMenuCard>

      <FilterMenuCard className="mt-3 px-4 py-1">
        <FilterSwitch
          active={filters.verifiedOnly}
          label="Проверенные мастера"
          variant="sheet"
          onChange={(verifiedOnly) => set({ verifiedOnly })}
        />
      </FilterMenuCard>

      <CatalogFilterSubSheet
        open={subSheet === 'category'}
        title="Категория"
        onBack={() => setSubSheet(null)}
      >
        <div className={`${chipGrid} rounded-[16px] bg-white p-4`}>
          <FilterChip
            active={filters.categoryCode == null}
            label="Все категории"
            variant="sheet"
            onClick={() => pickAndClose({ categoryCode: null })}
          />
          {categories.map((cat) => (
            <FilterChip
              key={cat.code}
              active={categoryCodesMatch(filters.categoryCode, cat.code)}
              label={cat.name}
              variant="sheet"
              onClick={() => pickAndClose({ categoryCode: cat.code })}
            />
          ))}
        </div>
      </CatalogFilterSubSheet>

      <CatalogFilterSubSheet open={subSheet === 'when'} title="Когда" onBack={() => setSubSheet(null)}>
        <div className={`${chipGrid} rounded-[16px] bg-white p-4`}>
          {DATE_FILTER_OPTIONS.map(({ value, label, icon }) => (
            <FilterChip
              key={value}
              active={filters.dateRange === value}
              icon={icon}
              label={label}
              variant="sheet"
              onClick={() => pickAndClose({ dateRange: value })}
            />
          ))}
        </div>
      </CatalogFilterSubSheet>

      <CatalogFilterSubSheet open={subSheet === 'time'} title="Время дня" onBack={() => setSubSheet(null)}>
        <div className={`${chipGrid} rounded-[16px] bg-white p-4`}>
          {TIME_FILTER_OPTIONS.map(({ value, label, icon }) => (
            <FilterChip
              key={value}
              active={filters.timeOfDay === value}
              icon={icon}
              label={label}
              variant="sheet"
              onClick={() => pickAndClose({ timeOfDay: value })}
            />
          ))}
        </div>
      </CatalogFilterSubSheet>

      <CatalogFilterSubSheet open={subSheet === 'visit'} title="Формат" onBack={() => setSubSheet(null)}>
        <div className={`${chipGrid} rounded-[16px] bg-white p-4`}>
          {VISIT_FILTER_OPTIONS.map(({ value, label, icon }) => (
            <FilterChip
              key={value}
              active={filters.visitType === value}
              icon={icon}
              label={label}
              variant="sheet"
              onClick={() => pickAndClose({ visitType: value })}
            />
          ))}
        </div>
      </CatalogFilterSubSheet>

      <CatalogFilterSubSheet
        open={subSheet === 'rating'}
        title="Рейтинг мастера"
        onBack={() => setSubSheet(null)}
      >
        <div className={`${chipGrid} rounded-[16px] bg-white p-4`}>
          {MASTER_RATING_OPTIONS.map(({ value, label }) => (
            <FilterChip
              key={String(value)}
              active={filters.minRating === value}
              label={label}
              variant="sheet"
              onClick={() =>
                pickAndClose({
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
      </CatalogFilterSubSheet>

      <CatalogFilterSubSheet open={subSheet === 'reviews'} title="Отзывы" onBack={() => setSubSheet(null)}>
        <div className={`${chipGrid} rounded-[16px] bg-white p-4`}>
          {MASTER_REVIEWS_OPTIONS.map(({ value, label }) => (
            <FilterChip
              key={String(value)}
              active={filters.minReviews === value}
              label={label}
              variant="sheet"
              onClick={() => pickAndClose({ minReviews: value })}
            />
          ))}
        </div>
      </CatalogFilterSubSheet>

      <CatalogFilterSubSheet open={subSheet === 'price'} title="Цена" onBack={() => setSubSheet(null)}>
        <div className={`${chipGrid} rounded-[16px] bg-white p-4`}>
          {MASTER_PRICE_OPTIONS.map(({ value, label }) => (
            <FilterChip
              key={String(value)}
              active={filters.priceTier === value}
              label={label}
              variant="sheet"
              onClick={() => pickAndClose({ priceTier: value })}
            />
          ))}
        </div>
      </CatalogFilterSubSheet>

      <CatalogFilterSubSheet
        open={subSheet === 'duration'}
        title="Длительность"
        onBack={() => setSubSheet(null)}
      >
        <div className={`${chipGrid} rounded-[16px] bg-white p-4`}>
          {DURATION_FILTER_OPTIONS.map(({ value, label, icon }) => (
            <FilterChip
              key={value}
              active={filters.duration === value}
              icon={icon}
              label={label}
              variant="sheet"
              onClick={() => pickAndClose({ duration: value })}
            />
          ))}
        </div>
      </CatalogFilterSubSheet>

      <CatalogFilterSubSheet open={subSheet === 'sort'} title="Сортировка" onBack={() => setSubSheet(null)}>
        <div className={`${chipGrid} rounded-[16px] bg-white p-4`}>
          {MASTER_SORT_OPTIONS.map(({ value, label }) => (
            <FilterChip
              key={value}
              active={filters.sortBy === value}
              label={label}
              variant="sheet"
              onClick={() => pickAndClose({ sortBy: value })}
            />
          ))}
        </div>
      </CatalogFilterSubSheet>
    </>
  );
}
