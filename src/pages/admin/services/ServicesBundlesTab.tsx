import { useEffect, useMemo, useState } from 'react';
import { HiChevronLeft, HiChevronRight, HiMagnifyingGlass } from 'react-icons/hi2';
import type { MasterDraft } from '../../../features/profile/lib/demoMasterStorage';
import { LoadingVideo } from '../../../shared/ui/LoadingVideo';
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
import { ServicesBundleCard } from './ServicesBundleCard';
import { ServicesExtrasProPreview } from './ServicesExtrasProPreview';
import { ServicesTabFab } from './ServicesTabFab';
import type { ManagedService } from './servicesFormat';
import type { ServiceBundle } from './servicesTypes';

type Props = {
  draft: MasterDraft;
  services: ManagedService[];
  bundles: ServiceBundle[];
  loading?: boolean;
  extrasLocked?: boolean;
  onConnectPro?: () => void;
  onExtrasLocked?: () => void;
  onCreate: () => void;
  onMenu: (bundle: ServiceBundle) => void;
};

const BUNDLE_PAGE_SIZE = 10;

function BundlePagination({
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
  const from = page * BUNDLE_PAGE_SIZE + 1;
  const to = Math.min(total, (page + 1) * BUNDLE_PAGE_SIZE);

  return (
    <nav
      className="mt-4 flex flex-wrap items-center justify-between gap-3 px-0.5 py-1"
      aria-label="Страницы наборов"
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

export function ServicesBundlesTab({
  draft,
  services,
  bundles,
  loading = false,
  extrasLocked = false,
  onConnectPro,
  onExtrasLocked,
  onCreate,
  onMenu,
}: Props) {
  const masterWrite = useMasterPlatformAccess();
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(0);
  const connectPro = onConnectPro ?? onExtrasLocked ?? (() => {});

  const serviceTitleById = useMemo(() => {
    const map = new Map<string, string>();
    services.forEach((service) => map.set(service.id, service.title));
    return map;
  }, [services]);

  const sortedBundles = useMemo(
    () => [...bundles].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [bundles],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sortedBundles;
    return sortedBundles.filter((bundle) => {
      if (bundle.title.toLowerCase().includes(q)) return true;
      return bundle.serviceIds.some((id) =>
        (serviceTitleById.get(id) ?? '').toLowerCase().includes(q),
      );
    });
  }, [query, serviceTitleById, sortedBundles]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / BUNDLE_PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);

  const pageItems = useMemo(() => {
    const start = safePage * BUNDLE_PAGE_SIZE;
    return filtered.slice(start, start + BUNDLE_PAGE_SIZE);
  }, [filtered, safePage]);

  useEffect(() => {
    setPage(0);
  }, [query]);

  useEffect(() => {
    if (page !== safePage) setPage(safePage);
  }, [page, safePage]);

  const openCreate = () => {
    if (extrasLocked) {
      connectPro();
      return;
    }
    onCreate();
  };

  const canCreate = services.length >= 2;

  if (extrasLocked) {
    return (
      <ServicesExtrasProPreview
        variant="bundles"
        draft={draft}
        services={services}
        onConnectPro={connectPro}
      />
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-[14rem] items-center justify-center py-8">
        <LoadingVideo size="lg" />
      </div>
    );
  }

  return (
    <div className={servicesTabPanelShell}>
      <div className={`${servicesTabContentPad} ${servicesTabScrollBottomPad}`}>
        <div className="space-y-1">
          <h2 className="text-[18px] font-black tracking-[-0.04em] text-[#111827] lg:text-[22px] lg:tracking-[-0.05em]">
            Наборы услуг
          </h2>
          <p className="text-[13px] font-medium leading-snug text-[#6B7280]">
            Объединяйте услуги в комбо со скидкой — клиенты увидят выгоду при записи
          </p>
        </div>

        {canCreate ? (
          <button
            type="button"
            onClick={openCreate}
            disabled={!masterWrite.canMutate}
            title={masterWrite.mutateDisabledTitle}
            className={`${servicesCatalogAddBtn} mt-3`}
          >
            <ServicesBrandPhotoLayers />
            <span className="relative z-10">Создать набор</span>
          </button>
        ) : (
          <p className="mt-3 rounded-[10px] bg-[#EBEBEB] px-4 py-3 text-[13px] font-medium text-[#6B7280]">
            Добавьте минимум 2 услуги в каталоге, чтобы создать набор.
          </p>
        )}

        {sortedBundles.length > 0 ? (
          <label className="relative mt-3 block min-w-0">
            <HiMagnifyingGlass
              className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-[#9CA3AF] lg:left-4 lg:h-6 lg:w-6"
              aria-hidden
            />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Поиск набора"
              className={servicesCatalogSearchInput}
            />
          </label>
        ) : null}

        {sortedBundles.length === 0 ? (
          <div className={`${profileDashboardCard} mt-3 p-6 text-center`}>
            <MiniPicture name="servicesEmpty" variant="empty" className="mb-2" />
            <h3 className="mt-2 text-[18px] font-bold tracking-[-0.04em] text-[#111827]">
              Наборов пока нет
            </h3>
            <p className="mx-auto mt-2 max-w-[20rem] text-[13px] leading-relaxed text-[#6B7280]">
              {canCreate
                ? 'Создайте комбо из нескольких услуг — клиенты увидят скидку при записи.'
                : 'Добавьте минимум 2 услуги в каталоге.'}
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
              {pageItems.map((bundle) => (
                <ServicesBundleCard
                  key={bundle.id}
                  as="li"
                  bundle={bundle}
                  services={services}
                  draft={draft}
                  serviceTitleById={serviceTitleById}
                  onMenu={() => onMenu(bundle)}
                />
              ))}
            </ul>
            {filtered.length > BUNDLE_PAGE_SIZE ? (
              <BundlePagination
                page={safePage}
                pageCount={pageCount}
                total={filtered.length}
                onPageChange={setPage}
              />
            ) : null}
          </>
        )}
      </div>

      {canCreate ? (
        <ServicesTabFab
          ariaLabel="Создать набор"
          onClick={openCreate}
          disabled={!masterWrite.canMutate}
          disabledTitle={masterWrite.mutateDisabledTitle}
        />
      ) : null}
    </div>
  );
}
