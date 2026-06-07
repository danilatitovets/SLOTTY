import { useEffect, useMemo, useState } from 'react';
import { HiChevronLeft, HiChevronRight, HiMagnifyingGlass, HiPencilSquare } from 'react-icons/hi2';
import type { MasterDraft } from '../../../features/profile/lib/demoMasterStorage';
import { MiniPicture } from '../../../shared/ui/MiniPicture';
import { profileDashboardCard } from '../profile/adminProfileDashboardTheme';
import {
  servicesCatalogBadgeHidden,
  servicesCatalogBadgeVisible,
  servicesCatalogCardBody,
  servicesCatalogCardShell,
  servicesCatalogCardThumbCol,
  servicesCatalogMenuBtn,
  servicesCatalogMetaMuted,
  servicesCatalogPriceText,
  servicesCatalogSearchInput,
  servicesTabContentPad,
  servicesTabPanelShell,
  servicesTabScrollBottomPad,
} from './adminServicesTheme';
import type { ManagedService } from './servicesFormat';
import { formatServicePrice, serviceCatalogThumbnailUrl } from './servicesFormat';
import { ServiceThumbnail, ServiceThumbnailFallback } from './ServicesServiceThumbnail';

type Props = {
  draft: MasterDraft;
  services: ManagedService[];
  categoryLabel?: string | null;
  onEditPrice: (service: ManagedService) => void;
};

const PRICE_PAGE_SIZE = 10;

function PricePagination({
  page,
  pageCount,
  total,
  onPageChange,
}: {
  page: number;
  pageCount: number;
  total: number;
  onPageChange: (next: number) => void;
}) {
  const from = page * PRICE_PAGE_SIZE + 1;
  const to = Math.min(total, (page + 1) * PRICE_PAGE_SIZE);

  return (
    <nav
      className="mt-4 flex flex-wrap items-center justify-between gap-3 px-0.5 py-1"
      aria-label="Страницы прайса"
    >
      <p className="text-[13px] font-semibold text-[#6B7280]">
        {from}–{to} из {total}
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={page <= 0}
          onClick={() => onPageChange(page - 1)}
          className="inline-flex h-9 items-center gap-1 rounded-[10px] bg-[#F5F5F5] px-3 text-[13px] font-semibold text-[#374151] transition enabled:hover:bg-[#EBEBEB] disabled:cursor-not-allowed disabled:opacity-40"
        >
          <HiChevronLeft className="h-4 w-4" aria-hidden />
          Назад
        </button>
        <span className="min-w-[4.5rem] text-center text-[13px] font-bold tabular-nums text-[#111827]">
          {page + 1} / {pageCount}
        </span>
        <button
          type="button"
          disabled={page >= pageCount - 1}
          onClick={() => onPageChange(page + 1)}
          className="inline-flex h-9 items-center gap-1 rounded-[10px] bg-[#F5F5F5] px-3 text-[13px] font-semibold text-[#374151] transition enabled:hover:bg-[#EBEBEB] disabled:cursor-not-allowed disabled:opacity-40"
        >
          Вперёд
          <HiChevronRight className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </nav>
  );
}

function formatDurationLabel(minutes: number): string {
  if (!Number.isFinite(minutes) || minutes <= 0) return '—';
  if (minutes < 60) return `${minutes} мин`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (rest === 0) return `${hours} ч`;
  return `${hours} ч ${rest} мин`;
}

function priceTypeLabel(service: ManagedService): string {
  return service.priceType === 'from' ? 'Цена от' : 'Точная цена';
}

function PriceServiceCard({
  service,
  imageSrc,
  categoryLabel,
  onEditPrice,
}: {
  service: ManagedService;
  imageSrc: string | null;
  categoryLabel?: string | null;
  onEditPrice: () => void;
}) {
  const visible = service.isActive !== false;
  const subtitle = categoryLabel?.trim() || null;

  return (
    <li className={servicesCatalogCardShell}>
      <div className={servicesCatalogCardBody}>
        <div className={servicesCatalogCardThumbCol}>
          {imageSrc ? (
            <ServiceThumbnail
              src={imageSrc}
              title={service.title}
              edge="flush-left"
              sizeClass="block h-full min-h-[5.5rem] w-full"
            />
          ) : (
            <ServiceThumbnailFallback
              edge="flush-left"
              sizeClass="flex h-full min-h-[5.5rem] w-full items-center justify-center"
            />
          )}
        </div>

        <div className="flex min-w-0 flex-1 items-center gap-2 px-3.5 py-3 sm:gap-3 sm:px-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <h3 className="line-clamp-2 text-[16px] font-bold leading-snug tracking-[-0.02em] text-[#111827]">
                {service.title}
              </h3>
              <span className={`shrink-0 ${visible ? servicesCatalogBadgeVisible : servicesCatalogBadgeHidden}`}>
                {visible ? 'Видимая' : 'Скрытая'}
              </span>
            </div>

            {subtitle ? (
              <p className={`mt-0.5 line-clamp-1 ${servicesCatalogMetaMuted}`}>{subtitle}</p>
            ) : null}

            <p className={`mt-1 text-[12px] ${servicesCatalogMetaMuted}`}>
              {formatDurationLabel(service.durationMin)} · {priceTypeLabel(service)}
            </p>

            <button
              type="button"
              onClick={onEditPrice}
              className={`${servicesCatalogPriceText} mt-2 transition hover:opacity-90 active:scale-[0.98]`}
              aria-label={`Изменить цену: ${service.title}`}
            >
              {formatServicePrice(service)}
            </button>
          </div>

          <button
            type="button"
            onClick={onEditPrice}
            className={servicesCatalogMenuBtn}
            aria-label={`Изменить цену: ${service.title}`}
          >
            <HiPencilSquare className="h-5 w-5" aria-hidden />
          </button>
        </div>
      </div>
    </li>
  );
}

export function ServicesPriceTab({ draft, services, categoryLabel, onEditPrice }: Props) {
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return services;
    return services.filter((service) => service.title.toLowerCase().includes(q));
  }, [query, services]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PRICE_PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);

  const pageItems = useMemo(() => {
    const start = safePage * PRICE_PAGE_SIZE;
    return filtered.slice(start, start + PRICE_PAGE_SIZE);
  }, [filtered, safePage]);

  useEffect(() => {
    setPage(0);
  }, [query]);

  useEffect(() => {
    if (page !== safePage) setPage(safePage);
  }, [page, safePage]);

  return (
    <div className={servicesTabPanelShell}>
      <div className={`${servicesTabContentPad} ${servicesTabScrollBottomPad}`}>
        <div className="space-y-1">
          <h2 className="text-[18px] font-black tracking-[-0.04em] text-[#111827] lg:text-[22px] lg:tracking-[-0.05em]">
            Прайс-лист
          </h2>
          <p className="text-[13px] font-medium leading-snug text-[#6B7280]">
            Нажмите на цену или карандаш — быстро изменить без полного редактирования
          </p>
        </div>

        <label className="relative mt-3 block min-w-0">
          <HiMagnifyingGlass
            className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-[#9CA3AF] lg:left-4 lg:h-6 lg:w-6"
            aria-hidden
          />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Поиск в прайсе"
            className={servicesCatalogSearchInput}
          />
        </label>

        {services.length === 0 ? (
          <div className={`${profileDashboardCard} mt-3 p-6 text-center`}>
            <MiniPicture name="servicesEmpty" variant="empty" className="mb-2" />
            <h3 className="mt-2 text-[18px] font-bold tracking-[-0.04em] text-[#111827]">
              Услуг пока нет
            </h3>
            <p className="mx-auto mt-2 max-w-[20rem] text-[13px] leading-relaxed text-[#6B7280]">
              Добавьте услуги в каталоге — здесь появится быстрое редактирование цен.
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className={`${profileDashboardCard} mt-3 p-6 text-center`}>
            <MiniPicture name="searchEmpty" variant="empty" className="mb-2" />
            <h3 className="mt-2 text-[18px] font-bold tracking-[-0.04em] text-[#111827]">
              Ничего не найдено
            </h3>
            <p className="mx-auto mt-2 max-w-[20rem] text-[13px] leading-relaxed text-[#6B7280]">
              Попробуйте другой запрос
            </p>
          </div>
        ) : (
          <>
            <ul className="mt-3 flex w-full max-w-none flex-col gap-2.5 lg:gap-3">
              {pageItems.map((service) => (
                <PriceServiceCard
                  key={service.id}
                  service={service}
                  imageSrc={serviceCatalogThumbnailUrl(service, draft)}
                  categoryLabel={categoryLabel}
                  onEditPrice={() => onEditPrice(service)}
                />
              ))}
            </ul>
            {filtered.length > PRICE_PAGE_SIZE ? (
              <PricePagination
                page={safePage}
                pageCount={pageCount}
                total={filtered.length}
                onPageChange={setPage}
              />
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
