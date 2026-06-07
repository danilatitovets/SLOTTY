import type { CategoryMasterFilters } from '../lib/categoryMasterFilters';
import { MASTER_SORT_OPTIONS } from '../lib/categoryMasterFilters';
import {
  DATE_FILTER_OPTIONS,
  DURATION_FILTER_OPTIONS,
  TIME_FILTER_OPTIONS,
  VISIT_FILTER_OPTIONS,
} from '../servicesCatalog/catalogFilterUi';

const MASTER_RATING_OPTIONS = [
  { value: null, label: 'Любой' },
  { value: '45', label: 'от 4.5' },
  { value: '48', label: 'от 4.8' },
  { value: '49', label: 'от 4.9' },
] as const;

const MASTER_REVIEWS_OPTIONS = [
  { value: null, label: 'Любое' },
  { value: '5', label: 'от 5' },
  { value: '20', label: 'от 20' },
  { value: '50', label: 'от 50' },
] as const;

const MASTER_PRICE_OPTIONS = [
  { value: null, label: 'Любая' },
  { value: 'under30', label: 'до 30 BYN' },
  { value: '30_50', label: '30–50 BYN' },
  { value: '50_100', label: '50–100 BYN' },
  { value: 'over100', label: 'от 100 BYN' },
] as const;

function optionLabel<T extends string>(
  options: ReadonlyArray<{ value: T; label: string }>,
  value: T,
  anyValue: T = 'any' as T,
): string | null {
  if (value === anyValue) return null;
  return options.find((o) => o.value === value)?.label ?? null;
}

function nullableLabel<T extends string>(
  options: ReadonlyArray<{ value: T | null; label: string }>,
  value: T | null,
): string | null {
  if (value == null) return null;
  return options.find((o) => o.value === value)?.label ?? null;
}

export function mastersCatalogFilterHints(filters: CategoryMasterFilters) {
  return {
    when: optionLabel(DATE_FILTER_OPTIONS, filters.dateRange),
    time: optionLabel(TIME_FILTER_OPTIONS, filters.timeOfDay),
    visit: optionLabel(VISIT_FILTER_OPTIONS, filters.visitType),
    rating: nullableLabel(MASTER_RATING_OPTIONS, filters.minRating),
    reviews: nullableLabel(MASTER_REVIEWS_OPTIONS, filters.minReviews),
    price: nullableLabel(MASTER_PRICE_OPTIONS, filters.priceTier),
    duration: optionLabel(DURATION_FILTER_OPTIONS, filters.duration),
    sort:
      filters.sortBy !== 'recommended'
        ? MASTER_SORT_OPTIONS.find((o) => o.value === filters.sortBy)?.label ?? null
        : null,
  };
}

export {
  MASTER_RATING_OPTIONS,
  MASTER_REVIEWS_OPTIONS,
  MASTER_PRICE_OPTIONS,
};
