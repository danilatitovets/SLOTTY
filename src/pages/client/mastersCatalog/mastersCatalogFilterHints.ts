import type { CategoryMasterFilters } from '../lib/categoryMasterFilters';
import {
  DATE_FILTER_OPTIONS,
  DURATION_FILTER_OPTIONS,
  TIME_FILTER_OPTIONS,
  VISIT_FILTER_OPTIONS,
} from '../servicesCatalog/catalogFilterUi';

function optionLabel<T extends string>(
  options: ReadonlyArray<{ value: T; label: string }>,
  value: T,
): string | null {
  if (value === 'any') return null;
  return options.find((o) => o.value === value)?.label ?? null;
}

const RATING_LABELS: Record<NonNullable<CategoryMasterFilters['minRating']>, string> = {
  '45': '4.5+',
  '48': '4.8+',
  '49': '4.9+',
};

const REVIEWS_LABELS: Record<NonNullable<CategoryMasterFilters['minReviews']>, string> = {
  '5': '5+',
  '20': '20+',
  '50': '50+',
};

const PRICE_LABELS: Record<NonNullable<CategoryMasterFilters['priceTier']>, string> = {
  under30: '≤30',
  '30_50': '30–50',
  '50_100': '50–100',
  over100: '100+',
};

export function mastersCatalogFilterHints(filters: CategoryMasterFilters) {
  const extraHints = [
    filters.onlyWithSlots ? 'онлайн-запись' : null,
    filters.promotionOnly ? 'акции' : null,
    filters.verifiedOnly ? 'проверенные' : null,
  ].filter(Boolean);

  return {
    when: optionLabel(DATE_FILTER_OPTIONS, filters.dateRange),
    time: optionLabel(TIME_FILTER_OPTIONS, filters.timeOfDay),
    visit: optionLabel(VISIT_FILTER_OPTIONS, filters.visitType),
    rating: filters.minRating ? RATING_LABELS[filters.minRating] : null,
    reviews: filters.minReviews ? REVIEWS_LABELS[filters.minReviews] : null,
    price: filters.priceTier ? PRICE_LABELS[filters.priceTier] : null,
    duration: optionLabel(DURATION_FILTER_OPTIONS, filters.duration),
    extra: extraHints.length > 0 ? extraHints.join(', ') : null,
  };
}
