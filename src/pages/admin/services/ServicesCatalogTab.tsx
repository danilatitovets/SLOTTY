import { useMemo, useState } from 'react';
import {
  HiEllipsisHorizontal,
  HiFunnel,
  HiMagnifyingGlass,
} from 'react-icons/hi2';
import type { MasterDraft } from '../../../features/profile/lib/demoMasterStorage';
import {
  servicesCatalogCardMobile,
  servicesCatalogFilterBtn,
  servicesCatalogFilterBtnActive,
  servicesCatalogSearchInput,
  servicesTabContentPad,
  servicesTabPanelShell,
  servicesTabScrollBottomPad,
} from './adminServicesTheme';
import { profileDashboardCard } from '../profile/adminProfileDashboardTheme';
import { useMasterPlatformAccess } from '../../../features/auth/context/MasterPlatformAccessContext';
import { ServicesTabFab } from './ServicesTabFab';
import { ServiceThumbnail, ServiceThumbnailFallback } from './ServicesServiceThumbnail';
import { filterCatalogServices } from './catalogFilterUtils';
import type { ManagedService } from './servicesFormat';
import { formatServicePrice, serviceCatalogThumbnailUrl } from './servicesFormat';
import { CatalogActiveFiltersBar } from './CatalogActiveFiltersBar';
import { getActiveCatalogFilterChips } from './catalogFilterLabels';
import {
  catalogFiltersAreActive,
  DEFAULT_CATALOG_FILTERS,
  ServicesCatalogFiltersSheet,
  type CatalogFiltersState,
} from './ServicesCatalogFiltersSheet';

type Props = {
  draft: MasterDraft;
  services: ManagedService[];
  onAdd: () => void;
  onOpenMenu: (service: ManagedService) => void;
};

function serviceCountLabel(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;

  if (mod100 >= 11 && mod100 <= 14) return `${n} услуг`;
  if (mod10 === 1) return `${n} услуга`;
  if (mod10 >= 2 && mod10 <= 4) return `${n} услуги`;

  return `${n} услуг`;
}

function CatalogServiceCard({
  service,
  imageSrc,
  onOpenMenu,
}: {
  service: ManagedService;
  imageSrc: string | null;
  onOpenMenu: (service: ManagedService) => void;
}) {
  const visible = service.isActive !== false;

  return (
    <li
      className={`${servicesCatalogCardMobile} lg:rounded-[24px] lg:border lg:border-[#EAECEF] lg:p-0 lg:shadow-[0_2px_16px_rgba(17,24,39,0.04)] lg:ring-0`}
    >
      {/* Mobile — акцент на услуге, название до 2 строк */}
      <div className="lg:hidden">
        <div className="flex items-start gap-3.5">
          {imageSrc ? (
            <ServiceThumbnail
              src={imageSrc}
              title={service.title}
              sizeClass="h-[4.5rem] w-[4.5rem] shrink-0 rounded-[14px]"
            />
          ) : (
            <ServiceThumbnailFallback sizeClass="flex h-[4.5rem] w-[4.5rem] shrink-0 items-center justify-center rounded-[14px]" />
          )}

          <div className="min-w-0 flex-1">
            <div className="flex items-start gap-2">
              <div className="min-w-0 flex-1">
                <h3 className="line-clamp-2 text-[17px] font-bold leading-snug tracking-[-0.03em] text-[#111827]">
                  {service.title}
                </h3>
                <p className="mt-2 text-[20px] font-black tabular-nums leading-none tracking-[-0.04em] text-[#F47C8C]">
                  {formatServicePrice(service)}
                </p>
                <span
                  className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ${
                    visible ? 'bg-[#ECFDF5] text-[#16A34A]' : 'bg-[#F3F4F6] text-[#6B7280]'
                  }`}
                >
                  {visible ? 'Видимая' : 'Скрытая'}
                </span>
              </div>

              <button
                type="button"
                onClick={() => onOpenMenu(service)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-[#F5F5F5] text-[#6B7280] transition active:scale-[0.96]"
                aria-label="Меню услуги"
              >
                <HiEllipsisHorizontal className="h-5 w-5" aria-hidden />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop — акцент на услуге, на всю ширину */}
      <div className="hidden min-h-[120px] items-center gap-5 px-6 py-5 lg:flex">
        {imageSrc ? (
          <ServiceThumbnail
            src={imageSrc}
            title={service.title}
            sizeClass="h-20 w-20 rounded-[20px]"
          />
        ) : (
          <ServiceThumbnailFallback sizeClass="flex h-20 w-20 items-center justify-center rounded-[20px]" />
        )}

        <div className="min-w-0 flex-1">
          <h3 className="text-[22px] font-black leading-tight tracking-[-0.05em] text-[#111827]">
            {service.title}
          </h3>
        </div>

        <div className="shrink-0 text-right">
          <p className="text-[32px] font-black tabular-nums leading-none tracking-[-0.06em] text-[#ff5f7a]">
            {formatServicePrice(service)}
          </p>
        </div>

        <span
          className={`shrink-0 rounded-full px-4 py-2 text-[13px] font-bold ${
            visible ? 'bg-[#ECFDF5] text-[#16A34A]' : 'bg-[#f6f7fb] text-[#6B7280]'
          }`}
        >
          {visible ? 'Видимая' : 'Скрытая'}
        </span>

        <button
          type="button"
          onClick={() => onOpenMenu(service)}
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] bg-[#f6f7fb] text-[#6B7280] transition hover:bg-[#FFF1F4] hover:text-[#ff5f7a] active:scale-[0.96]"
          aria-label={`Меню: ${service.title}`}
        >
          <HiEllipsisHorizontal className="h-6 w-6" aria-hidden />
        </button>
      </div>
    </li>
  );
}

export function ServicesCatalogTab({ draft, services, onAdd, onOpenMenu }: Props) {
  const masterWrite = useMasterPlatformAccess();
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<CatalogFiltersState>(DEFAULT_CATALOG_FILTERS);
  const [filterOpen, setFilterOpen] = useState(false);

  const filtered = useMemo(
    () => filterCatalogServices(services, query, filters),
    [filters, query, services],
  );

  const filterIsActive = catalogFiltersAreActive(filters);
  const activeFilterChips = useMemo(() => getActiveCatalogFilterChips(filters), [filters]);

  const patchFilters = (patch: Partial<CatalogFiltersState>) => {
    setFilters((prev) => ({ ...prev, ...patch }));
  };

  return (
    <div className={servicesTabPanelShell}>
      <div className={`${servicesTabContentPad} ${servicesTabScrollBottomPad}`}>
      <div className="hidden lg:flex lg:items-end lg:justify-between lg:gap-4">
        <div>
          <h2 className="text-[22px] font-black tracking-[-0.05em] text-[#111827]">
            Услуги в каталоге
          </h2>
          <p className="mt-1 text-[13px] font-semibold text-[#6B7280]">
            {services.length === 0
              ? 'Добавьте услуги — клиенты увидят их при записи'
              : filterIsActive
                ? `Показано ${serviceCountLabel(filtered.length)} из ${serviceCountLabel(services.length)}`
                : `Показано ${serviceCountLabel(filtered.length)}`}
          </p>
        </div>
      </div>

      <div className="flex gap-2 lg:gap-3">
        <label className="relative min-w-0 flex-1">
          <HiMagnifyingGlass
            className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-[#9CA3AF] lg:left-4 lg:h-6 lg:w-6"
            aria-hidden
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск услуги"
            className={`${servicesCatalogSearchInput} lg:min-h-[52px] lg:rounded-[18px] lg:border lg:border-[#EAECEF] lg:bg-white lg:pl-12 lg:text-[16px]`}
          />
        </label>
        <button
          type="button"
          onClick={() => setFilterOpen(true)}
          className={`${servicesCatalogFilterBtn} active:scale-[0.96] ${
            filterIsActive ? servicesCatalogFilterBtnActive : ''
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

      <CatalogActiveFiltersBar
        filters={filters}
        onChange={patchFilters}
        onReset={() => setFilters(DEFAULT_CATALOG_FILTERS)}
      />

      {filtered.length === 0 ? (
        <div className={`${profileDashboardCard} p-6 text-center`}>
          <ServiceThumbnailFallback sizeClass="mx-auto flex h-16 w-16 items-center justify-center rounded-[22px]" />
          <h3 className="mt-4 text-[18px] font-bold tracking-[-0.04em] text-[#111827]">
            {services.length === 0 ? 'Услуг пока нет' : 'Ничего не найдено'}
          </h3>
          <p className="mx-auto mt-2 max-w-[20rem] text-[13px] leading-relaxed text-[#6B7280]">
            {services.length === 0
              ? 'Добавьте первую услугу, чтобы клиенты могли записываться'
              : activeFilterChips.length > 0
                ? `По фильтрам «${activeFilterChips.map((c) => c.label).join('», «')}» ничего не нашлось. Ослабьте условия или сбросьте фильтры.`
                : 'Попробуйте другой запрос'}
          </p>
          {services.length > 0 && activeFilterChips.length > 0 ? (
            <button
              type="button"
              onClick={() => setFilters(DEFAULT_CATALOG_FILTERS)}
              className="mt-4 text-[14px] font-semibold text-[#F47C8C]"
            >
              Сбросить фильтры
            </button>
          ) : null}
        </div>
      ) : (
        <ul className="flex w-full max-w-none flex-col gap-3 lg:gap-4 lg:rounded-[24px] lg:bg-[#f6f7fb] lg:p-4">
          {filtered.map((service) => (
            <CatalogServiceCard
              key={service.id}
              service={service}
              imageSrc={serviceCatalogThumbnailUrl(service, draft)}
              onOpenMenu={onOpenMenu}
            />
          ))}
        </ul>
      )}

      <ServicesCatalogFiltersSheet
        open={filterOpen}
        filters={filters}
        resultCount={filtered.length}
        totalCount={services.length}
        onChange={patchFilters}
        onReset={() => setFilters(DEFAULT_CATALOG_FILTERS)}
        onClose={() => setFilterOpen(false)}
      />
      </div>

      <ServicesTabFab
        ariaLabel="Добавить услугу"
        onClick={onAdd}
        disabled={!masterWrite.canMutate}
        disabledTitle={masterWrite.mutateDisabledTitle}
      />
    </div>
  );
}
