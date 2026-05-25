import type { CatalogFiltersState } from './ServicesCatalogFiltersSheet';

export type CatalogFilterChip = {
  key: keyof CatalogFiltersState;
  label: string;
  reset: Partial<CatalogFiltersState>;
};

const VISIBILITY_LABELS: Record<CatalogFiltersState['visibility'], string> = {
  all: 'Все',
  visible: 'Видимые',
  hidden: 'Скрытые',
};

const PRICE_LABELS: Record<CatalogFiltersState['price'], string> = {
  all: 'Любая цена',
  fixed: 'Точная цена',
  from: 'Цена «от»',
};

const DURATION_LABELS: Record<CatalogFiltersState['duration'], string> = {
  all: 'Любая длительность',
  short: 'До 30 мин',
  medium: '31–90 мин',
  long: 'Больше 90 мин',
};

const SORT_LABELS: Record<CatalogFiltersState['sort'], string> = {
  catalog: 'Как в каталоге',
  title: 'По названию',
  price_asc: 'Дешевле',
  price_desc: 'Дороже',
  duration_asc: 'Короче',
  duration_desc: 'Дольше',
};

export function catalogFilterChipLabel(
  key: keyof CatalogFiltersState,
  value: CatalogFiltersState[keyof CatalogFiltersState],
): string {
  switch (key) {
    case 'visibility':
      return VISIBILITY_LABELS[value as CatalogFiltersState['visibility']];
    case 'price':
      return PRICE_LABELS[value as CatalogFiltersState['price']];
    case 'duration':
      return DURATION_LABELS[value as CatalogFiltersState['duration']];
    case 'sort':
      return SORT_LABELS[value as CatalogFiltersState['sort']];
    default:
      return String(value);
  }
}

export function getActiveCatalogFilterChips(filters: CatalogFiltersState): CatalogFilterChip[] {
  const chips: CatalogFilterChip[] = [];

  if (filters.visibility !== 'all') {
    chips.push({
      key: 'visibility',
      label: VISIBILITY_LABELS[filters.visibility],
      reset: { visibility: 'all' },
    });
  }
  if (filters.price !== 'all') {
    chips.push({
      key: 'price',
      label: PRICE_LABELS[filters.price],
      reset: { price: 'all' },
    });
  }
  if (filters.duration !== 'all') {
    chips.push({
      key: 'duration',
      label: DURATION_LABELS[filters.duration],
      reset: { duration: 'all' },
    });
  }
  if (filters.sort !== 'catalog') {
    chips.push({
      key: 'sort',
      label: SORT_LABELS[filters.sort],
      reset: { sort: 'catalog' },
    });
  }

  return chips;
}
