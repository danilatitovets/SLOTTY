import type { ServiceCategoryDto } from '../../../features/master-onboarding/api/becomeMasterApi';
import { categoryCodesMatch } from '../../../features/catalog/serviceCategoryLabels';
import type { CatalogFiltersState, PriceTier } from './catalogFiltersState';
import {
  DATE_FILTER_OPTIONS,
  DURATION_FILTER_OPTIONS,
  FilterChip,
  FilterPromoBar,
  FilterSection,
  FilterSwitch,
  SHEET_PRICE_FILTER_OPTIONS,
  SHEET_RATING_FILTER_OPTIONS,
  TIME_FILTER_OPTIONS,
  VISIT_FILTER_OPTIONS,
} from './catalogFilterUi';

type Props = {
  filters: CatalogFiltersState;
  onChange: (next: CatalogFiltersState) => void;
  categories: ServiceCategoryDto[];
  /** Скрыть блок «Акции» (например, в десктоп-сайдбаре). */
  hidePromo?: boolean;
  /** Скрыть категории (если вынесены отдельно в сайдбар). */
  hideCategory?: boolean;
};

/** Фильтры услуг — тот же плоский стиль, что у каталога мастеров. */
export function ServicesCatalogFiltersSheetPanel({
  filters,
  onChange,
  categories,
  hidePromo = false,
  hideCategory = false,
}: Props) {
  const chipsClass = 'flex flex-wrap gap-2';
  const set = (patch: Partial<CatalogFiltersState>) => onChange({ ...filters, ...patch });

  const setPriceTier = (tier: PriceTier) => {
    const range =
      tier === 'under30'
        ? { min: null, max: 30 }
        : tier === '30_50'
          ? { min: 30, max: 50 }
          : tier === '50_100'
            ? { min: 50, max: 100 }
            : tier === 'over100'
              ? { min: 100, max: null }
              : { min: null, max: null };
    onChange({
      ...filters,
      priceTier: tier,
      minPrice: range.min,
      maxPrice: range.max,
    });
  };

  return (
    <div className="flex flex-col gap-5">
      {!hidePromo ? (
        <FilterPromoBar
          active={filters.promotionOnly}
          label="Акции"
          onChange={(promotionOnly) => set({ promotionOnly })}
        />
      ) : null}

      <FilterSection title="Цена, BYN" variant="sheet" collapsible={false}>
        <div className={chipsClass}>
          {SHEET_PRICE_FILTER_OPTIONS.map(({ value, label }) => (
            <FilterChip
              key={value}
              active={filters.priceTier === value}
              label={label}
              variant="sheet"
              onClick={() => setPriceTier(value)}
            />
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Срок записи" variant="sheet" collapsible={false}>
        <div className={chipsClass}>
          {DATE_FILTER_OPTIONS.map(({ value, label }) => (
            <FilterChip
              key={value}
              active={filters.dateRange === value}
              label={label}
              variant="sheet"
              onClick={() => set({ dateRange: value })}
            />
          ))}
        </div>
      </FilterSection>

      {!hideCategory && categories.length > 0 ? (
        <FilterSection title="Категория" variant="sheet" collapsible={false}>
          <div className={chipsClass}>
            <FilterChip
              active={filters.categoryCode == null}
              label="Все"
              variant="sheet"
              onClick={() => set({ categoryCode: null })}
            />
            {categories.map((cat) => (
              <FilterChip
                key={cat.code}
                active={categoryCodesMatch(filters.categoryCode, cat.code)}
                label={cat.name}
                variant="sheet"
                onClick={() => set({ categoryCode: cat.code })}
              />
            ))}
          </div>
        </FilterSection>
      ) : null}

      <FilterSection title="Время дня" variant="sheet" collapsible={false}>
        <div className={chipsClass}>
          {TIME_FILTER_OPTIONS.map(({ value, label }) => (
            <FilterChip
              key={value}
              active={filters.timeOfDay === value}
              label={label}
              variant="sheet"
              onClick={() => set({ timeOfDay: value })}
            />
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Формат" variant="sheet" collapsible={false}>
        <div className={chipsClass}>
          {VISIT_FILTER_OPTIONS.map(({ value, label }) => (
            <FilterChip
              key={value}
              active={filters.visitType === value}
              label={label}
              variant="sheet"
              onClick={() => set({ visitType: value })}
            />
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Рейтинг" variant="sheet" collapsible={false}>
        <div className={chipsClass}>
          {SHEET_RATING_FILTER_OPTIONS.map(({ value, label }) => (
            <FilterChip
              key={String(value)}
              active={filters.minRating === value}
              label={label}
              variant="sheet"
              onClick={() => set({ minRating: value })}
            />
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Длительность" variant="sheet" collapsible={false}>
        <div className={chipsClass}>
          {DURATION_FILTER_OPTIONS.map(({ value, label }) => (
            <FilterChip
              key={value}
              active={filters.duration === value}
              label={label}
              variant="sheet"
              onClick={() => set({ duration: value })}
            />
          ))}
        </div>
      </FilterSection>

      <FilterSwitch
        active={filters.onlineBookingOnly}
        label="Только с онлайн-записью"
        variant="sheet"
        onChange={(onlineBookingOnly) => set({ onlineBookingOnly })}
      />
    </div>
  );
}
