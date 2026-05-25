import { HiXMark } from 'react-icons/hi2';
import { AdminBottomSheet } from '../shared/AdminBottomSheet';
import {
  catalogSheetPrimaryBtn,
  catalogSheetSecondaryBtn,
} from '../shared/adminCatalogSheetTheme';
import { sheetChipOnCanvasClass } from '../profile/adminProfileCabinetTheme';
import { getActiveCatalogFilterChips } from './catalogFilterLabels';

export type CatalogVisibilityFilter = 'all' | 'visible' | 'hidden';
export type CatalogPriceFilter = 'all' | 'fixed' | 'from';
export type CatalogDurationFilter = 'all' | 'short' | 'medium' | 'long';
export type CatalogSort = 'catalog' | 'title' | 'price_asc' | 'price_desc' | 'duration_asc' | 'duration_desc';

export type CatalogFiltersState = {
  visibility: CatalogVisibilityFilter;
  price: CatalogPriceFilter;
  duration: CatalogDurationFilter;
  sort: CatalogSort;
};

export const DEFAULT_CATALOG_FILTERS: CatalogFiltersState = {
  visibility: 'all',
  price: 'all',
  duration: 'all',
  sort: 'catalog',
};

const VISIBILITY: Array<{ id: CatalogVisibilityFilter; label: string }> = [
  { id: 'all', label: 'Все' },
  { id: 'visible', label: 'Видимые' },
  { id: 'hidden', label: 'Скрытые' },
];

const PRICE: Array<{ id: CatalogPriceFilter; label: string }> = [
  { id: 'all', label: 'Любая' },
  { id: 'fixed', label: 'Точная' },
  { id: 'from', label: 'От…' },
];

const DURATION: Array<{ id: CatalogDurationFilter; label: string }> = [
  { id: 'all', label: 'Любая' },
  { id: 'short', label: '≤30 мин' },
  { id: 'medium', label: '31–90' },
  { id: 'long', label: '90+ мин' },
];

const SORT: Array<{ id: CatalogSort; label: string }> = [
  { id: 'catalog', label: 'Как в каталоге' },
  { id: 'title', label: 'По названию' },
  { id: 'price_asc', label: 'Дешевле' },
  { id: 'price_desc', label: 'Дороже' },
  { id: 'duration_asc', label: 'Короче' },
  { id: 'duration_desc', label: 'Дольше' },
];

function FilterChipGroup<T extends string>({
  title,
  options,
  value,
  onChange,
}: {
  title: string;
  options: Array<{ id: T; label: string }>;
  value: T;
  onChange: (id: T) => void;
}) {
  return (
    <div>
      <p className="text-[14px] font-bold text-[#111827]">{title}</p>
      <div className="mt-2.5 flex flex-wrap gap-2">
        {options.map((option) => {
          const selected = value === option.id;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onChange(option.id)}
              aria-pressed={selected}
              className={sheetChipOnCanvasClass(selected)}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function catalogFiltersAreActive(filters: CatalogFiltersState): boolean {
  return getActiveCatalogFilterChips(filters).length > 0;
}

type Props = {
  open: boolean;
  filters: CatalogFiltersState;
  resultCount: number;
  totalCount: number;
  onChange: (patch: Partial<CatalogFiltersState>) => void;
  onReset: () => void;
  onClose: () => void;
};

export function ServicesCatalogFiltersSheet({
  open,
  filters,
  resultCount,
  totalCount,
  onChange,
  onReset,
  onClose,
}: Props) {
  const activeChips = getActiveCatalogFilterChips(filters);
  const hasActive = activeChips.length > 0;

  return (
    <AdminBottomSheet
      variant="catalog"
      open={open}
      onClose={onClose}
      title="Фильтры каталога"
      footer={
        <div className="flex w-full flex-col gap-2">
          <button type="button" className={catalogSheetPrimaryBtn} onClick={onClose}>
            {resultCount === totalCount ? 'Готово' : `Показать ${resultCount}`}
          </button>
          {hasActive ? (
            <button type="button" className={catalogSheetSecondaryBtn} onClick={onReset}>
              Сбросить все фильтры
            </button>
          ) : null}
        </div>
      }
    >
      {hasActive ? (
        <div className="flex flex-wrap gap-2">
          {activeChips.map((chip) => (
            <button
              key={chip.key}
              type="button"
              onClick={() => onChange(chip.reset)}
              className="inline-flex items-center gap-1.5 rounded-full bg-white py-1.5 pl-3 pr-2 text-[13px] font-semibold text-[#F47C8C] ring-1 ring-[#FDE8ED] transition hover:bg-[#FFF1F4] active:scale-[0.98]"
            >
              {chip.label}
              <HiXMark className="h-4 w-4 opacity-80" aria-hidden />
              <span className="sr-only">Сбросить</span>
            </button>
          ))}
        </div>
      ) : null}

      <div
        className={`max-h-[min(58dvh,28rem)] space-y-5 overflow-y-auto overscroll-contain pb-1 ${hasActive ? 'mt-4' : ''}`}
      >
        <FilterChipGroup
          title="Видимость"
          options={VISIBILITY}
          value={filters.visibility}
          onChange={(visibility) => onChange({ visibility })}
        />
        <FilterChipGroup
          title="Цена"
          options={PRICE}
          value={filters.price}
          onChange={(price) => onChange({ price })}
        />
        <FilterChipGroup
          title="Длительность"
          options={DURATION}
          value={filters.duration}
          onChange={(duration) => onChange({ duration })}
        />
        <FilterChipGroup
          title="Сортировка"
          options={SORT}
          value={filters.sort}
          onChange={(sort) => onChange({ sort })}
        />
      </div>
    </AdminBottomSheet>
  );
}
