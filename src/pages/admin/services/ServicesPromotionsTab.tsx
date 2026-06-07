import { useEffect, useMemo, useState } from 'react';
import { HiChevronLeft, HiChevronRight, HiMagnifyingGlass } from 'react-icons/hi2';
import type { MasterDraft } from '../../../features/profile/lib/demoMasterStorage';
import { MiniPicture } from '../../../shared/ui/MiniPicture';
import { profileDashboardCard } from '../profile/adminProfileDashboardTheme';
import { useMasterPlatformAccess } from '../../../features/auth/context/MasterPlatformAccessContext';
import {
  servicesCatalogAddBtn,
  servicesCatalogSearchInput,
  servicesTabContentPad,
  servicesTabPanelShell,
  servicesTabScrollBottomPad,
} from './adminServicesTheme';
import { ServicesBrandPhotoLayers } from './ServicesBrandPhotoLayers';
import type { ManagedService } from './servicesFormat';
import { derivePromotionStatus } from './servicesFormat';
import { normalizePromotion } from './promotionNormalize';
import type { ServicePromotion } from './servicesTypes';
import { PromotionBannerCard } from './PromotionBannerCard';
import { ServicesExtrasProPreview } from './ServicesExtrasProPreview';
import { ServicesPromotionMenuSheet } from './ServicesPromotionMenuSheet';
import { ServicesTabFab } from './ServicesTabFab';

type Props = {
  draft: MasterDraft;
  services: ManagedService[];
  promotions: ServicePromotion[];
  extrasLocked?: boolean;
  onConnectPro?: () => void;
  onExtrasLocked?: () => void;
  onCreate: () => void;
  onEdit: (promo: ServicePromotion) => void;
  onDelete: (id: string) => void;
};

const PROMO_PAGE_SIZE = 10;

function PromoPagination({
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
  const from = page * PROMO_PAGE_SIZE + 1;
  const to = Math.min(total, (page + 1) * PROMO_PAGE_SIZE);

  return (
    <nav
      className="mt-4 flex flex-wrap items-center justify-between gap-3 px-0.5 py-1"
      aria-label="Страницы акций"
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

export function ServicesPromotionsTab({
  draft,
  services,
  promotions,
  extrasLocked = false,
  onConnectPro,
  onExtrasLocked,
  onCreate,
  onEdit,
  onDelete,
}: Props) {
  const masterWrite = useMasterPlatformAccess();
  const [menuPromo, setMenuPromo] = useState<ServicePromotion | null>(null);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(0);

  const connectPro = onConnectPro ?? onExtrasLocked ?? (() => {});

  const rows = useMemo(() => {
    return promotions
      .map((promo) => {
        const normalized = normalizePromotion(promo);
        const serviceTitle =
          normalized.serviceTitle ||
          services.find((service) => service.id === normalized.serviceId)?.title ||
          '';

        return {
          ...normalized,
          serviceTitle,
          status: derivePromotionStatus(normalized),
        };
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [promotions, services]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((promo) => {
      if (promo.title.toLowerCase().includes(q)) return true;
      if (promo.serviceTitle.toLowerCase().includes(q)) return true;
      if (promo.description?.toLowerCase().includes(q)) return true;
      return false;
    });
  }, [query, rows]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PROMO_PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);

  const pageItems = useMemo(() => {
    const start = safePage * PROMO_PAGE_SIZE;
    return filtered.slice(start, start + PROMO_PAGE_SIZE);
  }, [filtered, safePage]);

  useEffect(() => {
    setPage(0);
  }, [query]);

  useEffect(() => {
    if (page !== safePage) setPage(safePage);
  }, [page, safePage]);

  const tryCreate = () => {
    if (extrasLocked) {
      connectPro();
      return;
    }
    onCreate();
  };

  if (extrasLocked) {
    return (
      <ServicesExtrasProPreview
        variant="promotions"
        draft={draft}
        services={services}
        onConnectPro={connectPro}
      />
    );
  }

  return (
    <div className={servicesTabPanelShell}>
      <div className={`${servicesTabContentPad} ${servicesTabScrollBottomPad}`}>
        <div className="space-y-1">
          <h2 className="text-[18px] font-black tracking-[-0.04em] text-[#111827] lg:text-[22px] lg:tracking-[-0.05em]">
            Акции
          </h2>
          <p className="text-[13px] font-medium leading-snug text-[#6B7280]">
            Скидки и спецпредложения — клиенты увидят их в каталоге и при записи
          </p>
        </div>

        <button
          type="button"
          onClick={tryCreate}
          disabled={!masterWrite.canMutate}
          title={masterWrite.mutateDisabledTitle}
          className={`${servicesCatalogAddBtn} mt-3`}
        >
          <ServicesBrandPhotoLayers />
          <span className="relative z-10">Создать акцию</span>
        </button>

        {rows.length > 0 ? (
          <label className="relative mt-3 block min-w-0">
            <HiMagnifyingGlass
              className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-[#9CA3AF] lg:left-4 lg:h-6 lg:w-6"
              aria-hidden
            />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Поиск акции"
              className={servicesCatalogSearchInput}
            />
          </label>
        ) : null}

        {rows.length === 0 ? (
          <div className={`${profileDashboardCard} mt-3 p-6 text-center`}>
            <MiniPicture name="servicesEmpty" variant="empty" className="mb-2" />
            <h3 className="mt-2 text-[18px] font-bold tracking-[-0.04em] text-[#111827]">
              Акций пока нет
            </h3>
            <p className="mx-auto mt-2 max-w-[20rem] text-[13px] leading-relaxed text-[#6B7280]">
              Запустите скидку на услугу — она появится в каталоге и при записи.
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
              {pageItems.map((promo) => (
                <PromotionBannerCard
                  key={promo.id}
                  as="li"
                  promo={promo}
                  onMenu={() => setMenuPromo(promo)}
                />
              ))}
            </ul>
            {filtered.length > PROMO_PAGE_SIZE ? (
              <PromoPagination
                page={safePage}
                pageCount={pageCount}
                total={filtered.length}
                onPageChange={setPage}
              />
            ) : null}
          </>
        )}
      </div>

      <ServicesTabFab
        ariaLabel="Создать акцию"
        onClick={tryCreate}
        disabled={!masterWrite.canMutate}
        disabledTitle={masterWrite.mutateDisabledTitle}
      />

      <ServicesPromotionMenuSheet
        open={Boolean(menuPromo)}
        promo={menuPromo}
        onClose={() => setMenuPromo(null)}
        onEdit={() => {
          if (menuPromo) onEdit(menuPromo);
          setMenuPromo(null);
        }}
        onDelete={() => {
          if (menuPromo) onDelete(menuPromo.id);
          setMenuPromo(null);
        }}
      />
    </div>
  );
}
