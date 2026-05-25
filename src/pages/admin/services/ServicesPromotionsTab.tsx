import { useMemo, useState } from 'react';
import { HiReceiptPercent } from 'react-icons/hi2';
import {
  servicesTabContentPad,
  servicesTabPanelShell,
  servicesTabScrollBottomPad,
} from './adminServicesTheme';
import { profileDashboardCard } from '../profile/adminProfileDashboardTheme';
import { cabinetIconCircle } from '../profile/adminProfileCabinetTheme';
import { PromotionBannerCard } from './PromotionBannerCard';
import type { ManagedService } from './servicesFormat';
import { derivePromotionStatus } from './servicesFormat';
import { normalizePromotion } from './promotionNormalize';
import type { ServicePromotion } from './servicesTypes';
import { ServicesExtrasProPreview } from './ServicesExtrasProPreview';
import { ServicesPromotionMenuSheet } from './ServicesPromotionMenuSheet';
import { useMasterPlatformAccess } from '../../../features/auth/context/MasterPlatformAccessContext';
import { ServicesTabFab } from './ServicesTabFab';
import type { MasterDraft } from '../../../features/profile/lib/demoMasterStorage';

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

function promoCountLabel(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;

  if (mod100 >= 11 && mod100 <= 14) return `${n} акций`;
  if (mod10 === 1) return `${n} акция`;
  if (mod10 >= 2 && mod10 <= 4) return `${n} акции`;

  return `${n} акций`;
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

  const connectPro = onConnectPro ?? onExtrasLocked ?? (() => {});

  const rows = useMemo(() => {
    return promotions
      .map((p) => {
        const normalized = normalizePromotion(p);
        const serviceTitle =
          normalized.serviceTitle ||
          services.find((s) => s.id === normalized.serviceId)?.title ||
          '';

        return {
          ...normalized,
          serviceTitle,
          status: derivePromotionStatus(normalized),
        };
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [promotions, services]);

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
        <div>
          <h2 className="text-[18px] font-black tracking-[-0.04em] text-[#111827] lg:text-[22px] lg:tracking-[-0.05em]">
            Акции
          </h2>
          <p className="mt-1 text-[13px] font-medium text-[#6B7280]">
            {promotions.length > 0
              ? promoCountLabel(promotions.length)
              : 'Скидки и спецпредложения для клиентов'}
          </p>
        </div>

        {rows.length === 0 ? (
          <div className={`${profileDashboardCard} p-6 text-center`}>
            <span className={`${cabinetIconCircle} mx-auto flex h-16 w-16 items-center justify-center rounded-[14px]`}>
              <HiReceiptPercent className="h-8 w-8" aria-hidden />
            </span>
            <h3 className="mt-4 text-[18px] font-bold tracking-[-0.04em] text-[#111827] lg:text-[20px]">
              Акций пока нет
            </h3>
          </div>
        ) : (
          <ul className="flex w-full max-w-none flex-col gap-3 lg:gap-4 lg:rounded-[24px] lg:bg-[#f6f7fb] lg:p-4">
            {rows.map((promo) => (
              <li key={promo.id}>
                <PromotionBannerCard promo={promo} onMenu={() => setMenuPromo(promo)} />
              </li>
            ))}
          </ul>
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
