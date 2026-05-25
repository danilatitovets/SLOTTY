import { useMemo } from 'react';
import type { MasterDraft } from '../../../features/profile/lib/demoMasterStorage';
import { LoadingVideo } from '../../../shared/ui/LoadingVideo';
import {
  servicesTabContentPad,
  servicesTabPanelShell,
  servicesTabScrollBottomPad,
} from './adminServicesTheme';
import { profileDashboardCard } from '../profile/adminProfileDashboardTheme';
import { ServicesBundleCard } from './ServicesBundleCard';
import { ServicesExtrasProPreview } from './ServicesExtrasProPreview';
import { useMasterPlatformAccess } from '../../../features/auth/context/MasterPlatformAccessContext';
import { ServicesTabFab } from './ServicesTabFab';
import type { ManagedService } from './servicesFormat';
import type { ServiceBundle } from './servicesTypes';
import { ServiceThumbnailFallback } from './ServicesServiceThumbnail';

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

function bundleCountLabel(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;

  if (mod100 >= 11 && mod100 <= 14) return `${n} наборов`;
  if (mod10 === 1) return `${n} набор`;
  if (mod10 >= 2 && mod10 <= 4) return `${n} набора`;

  return `${n} наборов`;
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
  const connectPro = onConnectPro ?? onExtrasLocked ?? (() => {});

  const serviceTitleById = useMemo(() => {
    const m = new Map<string, string>();
    services.forEach((s) => m.set(s.id, s.title));
    return m;
  }, [services]);

  const sortedBundles = useMemo(
    () => [...bundles].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [bundles],
  );

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
        <div>
          <h2 className="text-[18px] font-black tracking-[-0.04em] text-[#111827] lg:text-[22px] lg:tracking-[-0.05em]">
            Ваши наборы
          </h2>
          <p className="mt-1 text-[13px] font-semibold text-[#6B7280]">
            {sortedBundles.length > 0
              ? bundleCountLabel(sortedBundles.length)
              : 'Объединяйте услуги в комбо со скидкой'}
          </p>
          {canCreate && sortedBundles.length === 0 ? (
            <p className="mt-2 text-[12px] font-semibold text-[#9CA3AF] lg:hidden">
              Новый набор — кнопка «+» внизу справа
            </p>
          ) : null}
        </div>

        {!canCreate ? (
          <p className="rounded-[10px] bg-[#EBEBEB] px-4 py-3 text-[13px] font-medium text-[#6B7280]">
            Добавьте минимум 2 услуги в каталоге, чтобы создать набор.
          </p>
        ) : null}

        {sortedBundles.length === 0 ? (
          <div className={`${profileDashboardCard} p-6 text-center`}>
            <ServiceThumbnailFallback sizeClass="mx-auto flex h-16 w-16 items-center justify-center rounded-[22px]" />
            <h3 className="mt-4 text-[18px] font-bold tracking-[-0.04em] text-[#111827] lg:text-[20px]">
              Наборов пока нет
            </h3>
            <p className="mx-auto mt-2 max-w-[20rem] text-[13px] leading-relaxed text-[#6B7280]">
              {canCreate
                ? 'Нажмите «+» внизу справа, чтобы создать комбо из услуг.'
                : 'Добавьте минимум 2 услуги в каталоге.'}
            </p>
          </div>
        ) : (
          <ul className="flex w-full max-w-none flex-col gap-3 lg:gap-4 lg:rounded-[24px] lg:bg-[#f6f7fb] lg:p-4">
            {sortedBundles.map((bundle) => (
              <li key={bundle.id}>
                <ServicesBundleCard
                  bundle={bundle}
                  services={services}
                  draft={draft}
                  serviceTitleById={serviceTitleById}
                  onMenu={() => onMenu(bundle)}
                />
              </li>
            ))}
          </ul>
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
