import { useMemo, useState } from 'react';
import { HiEllipsisHorizontal, HiFunnel, HiMagnifyingGlass, HiScissors } from 'react-icons/hi2';
import {
  servicesCard,
  servicesIconCircle,
  servicesInput,
  servicesPinkBtn,
} from './adminServicesTheme';
import { filterCatalogServices } from './catalogFilterUtils';
import type { ManagedService } from './servicesFormat';
import { formatDurationRu, formatServicePrice } from './servicesFormat';
import {
  catalogFiltersAreActive,
  DEFAULT_CATALOG_FILTERS,
  ServicesCatalogFiltersSheet,
  type CatalogFiltersState,
} from './ServicesCatalogFiltersSheet';

type Props = {
  services: ManagedService[];
  onAdd: () => void;
  onOpenMenu: (service: ManagedService) => void;
};

export function ServicesCatalogTab({ services, onAdd, onOpenMenu }: Props) {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<CatalogFiltersState>(DEFAULT_CATALOG_FILTERS);
  const [filterOpen, setFilterOpen] = useState(false);

  const filtered = useMemo(
    () => filterCatalogServices(services, query, filters),
    [filters, query, services],
  );

  const filterIsActive = catalogFiltersAreActive(filters);

  const patchFilters = (patch: Partial<CatalogFiltersState>) => {
    setFilters((prev) => ({ ...prev, ...patch }));
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <label className="relative min-w-0 flex-1">
          <HiMagnifyingGlass
            className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-[#9CA3AF]"
            aria-hidden
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск услуги"
            className={`${servicesInput} pl-11`}
          />
        </label>
        <button
          type="button"
          onClick={() => setFilterOpen(true)}
          className={`relative flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] border transition active:scale-[0.96] ${
            filterIsActive
              ? 'border-[#FDE8ED] bg-[#FFF1F4] text-[#F47C8C] shadow-[inset_0_0_0_1px_rgba(244,124,140,0.12)]'
              : 'border-[#EAECEF] bg-white text-[#6B7280]'
          }`}
          aria-label={filterIsActive ? 'Фильтры: выбраны' : 'Фильтры каталога'}
          aria-expanded={filterOpen}
        >
          <HiFunnel className="h-5 w-5" aria-hidden />
          {filterIsActive ? (
            <span
              className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#F47C8C]"
              aria-hidden
            />
          ) : null}
        </button>
      </div>

      <button type="button" onClick={onAdd} className={servicesPinkBtn}>
        + Добавить услугу
      </button>

      {filtered.length === 0 ? (
        <div className={`${servicesCard} p-6 text-center`}>
          <span className={`${servicesIconCircle} mx-auto h-16 w-16 rounded-[22px]`}>
            <HiScissors className="h-8 w-8" aria-hidden />
          </span>
          <h3 className="mt-4 text-[18px] font-bold tracking-[-0.04em] text-[#111827]">
            {services.length === 0 ? 'Услуг пока нет' : 'Ничего не найдено'}
          </h3>
          <p className="mx-auto mt-2 max-w-[18rem] text-[13px] leading-relaxed text-[#6B7280]">
            {services.length === 0
              ? 'Добавьте первую услугу, чтобы клиенты могли записываться'
              : 'Попробуйте другой запрос или фильтр'}
          </p>
          {services.length === 0 ? (
            <button type="button" onClick={onAdd} className={`${servicesPinkBtn} mt-5`}>
              Добавить услугу
            </button>
          ) : null}
        </div>
      ) : (
        <ul className="space-y-3">
          {filtered.map((service) => (
            <li key={service.id} className={`${servicesCard} p-4`}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="truncate text-[16px] font-bold text-[#111827]">{service.title}</h3>
                  <p className="mt-1 text-[14px] font-semibold tabular-nums text-[#F47C8C]">
                    {formatServicePrice(service)}
                  </p>
                  <p className="mt-0.5 text-[12px] font-medium text-[#9CA3AF]">
                    {formatDurationRu(service.durationMin)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onOpenMenu(service)}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F7F7F8] text-[#6B7280] transition active:scale-[0.96]"
                  aria-label="Меню услуги"
                >
                  <HiEllipsisHorizontal className="h-5 w-5" aria-hidden />
                </button>
              </div>
              <span
                className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ${
                  service.isActive ? 'bg-[#ECFDF5] text-[#16A34A]' : 'bg-[#F3F4F6] text-[#6B7280]'
                }`}
              >
                {service.isActive ? 'Видимая' : 'Скрытая'}
              </span>
            </li>
          ))}
        </ul>
      )}

      <ServicesCatalogFiltersSheet
        open={filterOpen}
        filters={filters}
        onChange={patchFilters}
        onReset={() => setFilters(DEFAULT_CATALOG_FILTERS)}
        onClose={() => setFilterOpen(false)}
      />
    </div>
  );
}
