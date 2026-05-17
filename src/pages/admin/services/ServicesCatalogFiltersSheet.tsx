import { HiCheck } from 'react-icons/hi2';
import { AdminBottomSheet } from '../shared/AdminBottomSheet';
import { servicesChipActive, servicesPinkBtn } from './adminServicesTheme';

export type CatalogVisibilityFilter = 'all' | 'visible' | 'hidden';
export type CatalogPriceFilter = 'all' | 'fixed' | 'from';
export type CatalogDurationFilter = 'all' | 'short' | 'medium' | 'long';
export type CatalogPhotoFilter = 'all' | 'with' | 'without';
export type CatalogSort = 'catalog' | 'title' | 'price_asc' | 'price_desc' | 'duration_asc' | 'duration_desc';

export type CatalogFiltersState = {
  visibility: CatalogVisibilityFilter;
  price: CatalogPriceFilter;
  duration: CatalogDurationFilter;
  photo: CatalogPhotoFilter;
  sort: CatalogSort;
};

export const DEFAULT_CATALOG_FILTERS: CatalogFiltersState = {
  visibility: 'all',
  price: 'all',
  duration: 'all',
  photo: 'all',
  sort: 'catalog',
};

const VISIBILITY: Array<{ id: CatalogVisibilityFilter; label: string; hint: string }> = [
  { id: 'all', label: 'Все', hint: 'Показать все услуги' },
  { id: 'visible', label: 'Видимые', hint: 'Доступны для записи' },
  { id: 'hidden', label: 'Скрытые', hint: 'Скрыты от клиентов' },
];

const PRICE: Array<{ id: CatalogPriceFilter; label: string; hint: string }> = [
  { id: 'all', label: 'Любая', hint: 'Фиксированная и «от»' },
  { id: 'fixed', label: 'Фиксированная', hint: 'Точная цена в каталоге' },
  { id: 'from', label: 'От…', hint: 'Цена «от N BYN»' },
];

const DURATION: Array<{ id: CatalogDurationFilter; label: string; hint: string }> = [
  { id: 'all', label: 'Любая', hint: 'Без ограничения по времени' },
  { id: 'short', label: 'До 30 мин', hint: 'Короткие услуги' },
  { id: 'medium', label: '31–90 мин', hint: 'Средняя длительность' },
  { id: 'long', label: 'Более 90 мин', hint: 'Длинные процедуры' },
];

const PHOTO: Array<{ id: CatalogPhotoFilter; label: string; hint: string }> = [
  { id: 'all', label: 'Все', hint: 'С фото и без' },
  { id: 'with', label: 'С фото', hint: 'Есть обложка услуги' },
  { id: 'without', label: 'Без фото', hint: 'Нужно добавить изображение' },
];

const SORT: Array<{ id: CatalogSort; label: string; hint: string }> = [
  { id: 'catalog', label: 'Как в каталоге', hint: 'Ваш порядок отображения' },
  { id: 'title', label: 'По названию', hint: 'А → Я' },
  { id: 'price_asc', label: 'Дешевле', hint: 'По возрастанию цены' },
  { id: 'price_desc', label: 'Дороже', hint: 'По убыванию цены' },
  { id: 'duration_asc', label: 'Короче', hint: 'Меньше минут — выше' },
  { id: 'duration_desc', label: 'Дольше', hint: 'Больше минут — выше' },
];

function optionRow(selected: boolean) {
  return `flex w-full items-center gap-3 rounded-[18px] border px-4 py-3.5 text-left transition active:scale-[0.98] ${
    selected
      ? servicesChipActive
      : 'border-[#EAECEF] bg-white hover:border-[#FDE8ED] hover:bg-[#FAFAFA]'
  }`;
}

function OptionCheck({ selected }: { selected: boolean }) {
  return selected ? (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#F47C8C] text-white">
      <HiCheck className="h-5 w-5" aria-hidden />
    </span>
  ) : (
    <span className="h-8 w-8 shrink-0 rounded-full border border-[#EAECEF] bg-[#FAFAFA]" aria-hidden />
  );
}

function FilterSection<T extends string>({
  title,
  options,
  value,
  onChange,
}: {
  title: string;
  options: Array<{ id: T; label: string; hint: string }>;
  value: T;
  onChange: (id: T) => void;
}) {
  return (
    <div>
      <p className="text-[12px] font-bold text-[#9CA3AF]">{title}</p>
      <div className="mt-2 space-y-2">
        {options.map((option) => {
          const selected = value === option.id;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onChange(option.id)}
              className={optionRow(selected)}
            >
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-bold text-[#111827]">{option.label}</span>
                <span className="mt-0.5 block text-[12px] font-medium text-[#9CA3AF]">{option.hint}</span>
              </span>
              <OptionCheck selected={selected} />
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function catalogFiltersAreActive(filters: CatalogFiltersState): boolean {
  return (
    filters.visibility !== DEFAULT_CATALOG_FILTERS.visibility ||
    filters.price !== DEFAULT_CATALOG_FILTERS.price ||
    filters.duration !== DEFAULT_CATALOG_FILTERS.duration ||
    filters.photo !== DEFAULT_CATALOG_FILTERS.photo ||
    filters.sort !== DEFAULT_CATALOG_FILTERS.sort
  );
}

type Props = {
  open: boolean;
  filters: CatalogFiltersState;
  onChange: (patch: Partial<CatalogFiltersState>) => void;
  onReset: () => void;
  onClose: () => void;
};

export function ServicesCatalogFiltersSheet({ open, filters, onChange, onReset, onClose }: Props) {
  const hasActive = catalogFiltersAreActive(filters);

  return (
    <AdminBottomSheet open={open} onClose={onClose} title="Фильтры каталога">
      <div className="max-h-[min(70dvh,32rem)] space-y-5 overflow-y-auto overscroll-contain pb-1">
        <FilterSection
          title="Видимость"
          options={VISIBILITY}
          value={filters.visibility}
          onChange={(visibility) => onChange({ visibility })}
        />
        <FilterSection
          title="Цена"
          options={PRICE}
          value={filters.price}
          onChange={(price) => onChange({ price })}
        />
        <FilterSection
          title="Длительность"
          options={DURATION}
          value={filters.duration}
          onChange={(duration) => onChange({ duration })}
        />
        <FilterSection
          title="Фото"
          options={PHOTO}
          value={filters.photo}
          onChange={(photo) => onChange({ photo })}
        />
        <FilterSection
          title="Сортировка"
          options={SORT}
          value={filters.sort}
          onChange={(sort) => onChange({ sort })}
        />
      </div>

      <div className="mt-4 flex flex-col gap-2 border-t border-[#F3F4F6] pt-4">
        <button type="button" className={servicesPinkBtn} onClick={onClose}>
          Готово
        </button>
        {hasActive ? (
          <button
            type="button"
            className="text-[14px] font-semibold text-[#F47C8C]"
            onClick={() => {
              onReset();
              onClose();
            }}
          >
            Сбросить фильтры
          </button>
        ) : null}
      </div>
    </AdminBottomSheet>
  );
}
