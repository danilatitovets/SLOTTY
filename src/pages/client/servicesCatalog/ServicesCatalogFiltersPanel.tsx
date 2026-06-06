import type { CatalogFiltersState, PriceTier } from './catalogFiltersState';
import {
  DATE_FILTER_OPTIONS,
  DURATION_FILTER_OPTIONS,
  FilterChip,
  FilterSection,
  FilterSwitch,
  HiBanknotes,
  PRICE_FILTER_OPTIONS,
  RATING_FILTER_OPTIONS,
  TIME_FILTER_OPTIONS,
  VISIT_FILTER_OPTIONS,
} from './catalogFilterUi';
import { HiAdjustmentsHorizontal, HiBuildingStorefront, HiCalendarDays, HiClock, HiStar } from 'react-icons/hi2';
import { catalogFieldClass } from './servicesCatalogTheme';
import { catalogServicesFilterHints } from './catalogFilterHints';

type Props = {
  filters: CatalogFiltersState;
  onChange: (next: CatalogFiltersState) => void;
  layout?: 'grid' | 'sidebar' | 'sheet';
};

export function ServicesCatalogFiltersPanel({ filters, onChange, layout = 'grid' }: Props) {
  const sidebar = layout === 'sidebar';
  const sheet = layout === 'sheet';
  const uiVariant = sheet ? 'sheet' : 'default';
  const hints = catalogServicesFilterHints(filters);
  const chipsClass = sidebar || sheet ? 'flex flex-wrap gap-2' : 'mt-3 flex flex-wrap gap-2';
  const rootClass = sidebar
    ? 'flex flex-col gap-4'
    : sheet
      ? 'flex flex-col gap-6 pb-4'
      : 'grid gap-5 md:grid-cols-2 xl:grid-cols-3';

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
    <div className={rootClass}>
      <FilterSection
        icon={HiCalendarDays}
        title="Когда"
        activeHint={hints.when}
        variant={uiVariant}
      >
        <div className={chipsClass}>
          {DATE_FILTER_OPTIONS.map(({ value, label, icon }) => (
            <FilterChip
              key={value}
              active={filters.dateRange === value}
              icon={icon}
              label={label}
              variant={uiVariant}
              onClick={() => set({ dateRange: value })}
            />
          ))}
        </div>
      </FilterSection>

      <FilterSection icon={HiClock} title="Время" activeHint={hints.time} variant={uiVariant}>
        <div className={chipsClass}>
          {TIME_FILTER_OPTIONS.map(({ value, label, icon }) => (
            <FilterChip
              key={value}
              active={filters.timeOfDay === value}
              icon={icon}
              label={label}
              variant={uiVariant}
              onClick={() => set({ timeOfDay: value })}
            />
          ))}
        </div>
      </FilterSection>

      <FilterSection
        icon={HiBanknotes}
        title="Цена, BYN"
        activeHint={hints.price}
        variant={uiVariant}
      >
        <div className={chipsClass}>
          {PRICE_FILTER_OPTIONS.map(({ value, label }) => (
            <FilterChip
              key={value}
              active={filters.priceTier === value}
              label={label}
              variant={uiVariant}
              onClick={() => setPriceTier(value)}
            />
          ))}
        </div>
        <div className={`${sidebar || sheet ? 'mt-3' : 'mt-2.5'} grid grid-cols-2 gap-2`}>
          <label className="block">
            <span className="mb-1.5 block text-[12px] font-medium text-[#8E8E93]">от</span>
            <input
              type="text"
              inputMode="decimal"
              value={filters.minPrice != null ? String(filters.minPrice) : ''}
              onChange={(e) => {
                const v = e.target.value.trim().replace(',', '.');
                const n = v ? Number(v) : NaN;
                set({
                  priceTier: 'any',
                  minPrice: v && Number.isFinite(n) ? n : null,
                });
              }}
              placeholder="0"
              className={`h-11 w-full px-3 text-[15px] font-medium ${
                sheet
                  ? 'rounded-[12px] border border-[#E5E7EB] bg-white text-[#111827] outline-none placeholder:text-[#9CA3AF] focus:border-[#F47C8C]/40'
                  : catalogFieldClass
              }`}
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[12px] font-medium text-[#8E8E93]">до</span>
            <input
              type="text"
              inputMode="decimal"
              value={filters.maxPrice != null ? String(filters.maxPrice) : ''}
              onChange={(e) => {
                const v = e.target.value.trim().replace(',', '.');
                const n = v ? Number(v) : NaN;
                set({
                  priceTier: 'any',
                  maxPrice: v && Number.isFinite(n) ? n : null,
                });
              }}
              placeholder="∞"
              className={`h-11 w-full px-3 text-[15px] font-medium ${
                sheet
                  ? 'rounded-[12px] border border-[#E5E7EB] bg-white text-[#111827] outline-none placeholder:text-[#9CA3AF] focus:border-[#F47C8C]/40'
                  : catalogFieldClass
              }`}
            />
          </label>
        </div>
      </FilterSection>

      <FilterSection
        icon={HiStar}
        title="Рейтинг мастера"
        activeHint={hints.rating}
        variant={uiVariant}
      >
        <div className={chipsClass}>
          {RATING_FILTER_OPTIONS.map(({ value, label, icon }) => (
            <FilterChip
              key={String(value)}
              active={filters.minRating === value}
              icon={icon}
              label={label}
              variant={uiVariant}
              onClick={() => set({ minRating: value })}
            />
          ))}
        </div>
      </FilterSection>

      <FilterSection icon={HiBuildingStorefront} title="Где" activeHint={hints.visit} variant={uiVariant}>
        <div className={chipsClass}>
          {VISIT_FILTER_OPTIONS.map(({ value, label, icon }) => (
            <FilterChip
              key={value}
              active={filters.visitType === value}
              icon={icon}
              label={label}
              variant={uiVariant}
              onClick={() => set({ visitType: value })}
            />
          ))}
        </div>
      </FilterSection>

      <FilterSection
        icon={HiClock}
        title="Длительность"
        activeHint={hints.duration}
        variant={uiVariant}
      >
        <div className={chipsClass}>
          {DURATION_FILTER_OPTIONS.map(({ value, label, icon }) => (
            <FilterChip
              key={value}
              active={filters.duration === value}
              icon={icon}
              label={label}
              variant={uiVariant}
              onClick={() => set({ duration: value })}
            />
          ))}
        </div>
      </FilterSection>

      <FilterSection icon={HiAdjustmentsHorizontal} title="Дополнительно" activeHint={hints.extra} variant={uiVariant}>
        <div className="flex flex-col gap-2.5">
          <FilterSwitch
            active={filters.onlineBookingOnly}
            label="Только с онлайн-записью"
            variant={uiVariant}
            onChange={(onlineBookingOnly) => set({ onlineBookingOnly })}
          />
        </div>
      </FilterSection>
    </div>
  );
}
