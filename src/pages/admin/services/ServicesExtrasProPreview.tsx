import type { MasterDraft } from '../../../features/profile/lib/demoMasterStorage';
import {
  servicesDesktopCardPad,
  servicesTabPanelShell,
  servicesTabScrollBottomPad,
} from './adminServicesTheme';
import { ServicesBundleCard } from './ServicesBundleCard';
import { PromotionBannerCard } from './PromotionBannerCard';
import { demoBundlesForPreview, demoPromotionsForPreview } from './servicesExtrasDemo';
import { derivePromotionStatus } from './servicesFormat';
import type { ManagedService } from './servicesFormat';
import { ServicesTabFab } from './ServicesTabFab';
import { MasterProUpsellBanner } from '../shared/MasterProUpsellBanner';
import { servicesProUpsellCopy, type ServicesProUpsellVariant } from './servicesProUpsell';

type Props = {
  variant: ServicesProUpsellVariant;
  draft: MasterDraft;
  services: ManagedService[];
  onConnectPro: () => void;
};

export function ServicesExtrasProPreview({ variant, draft, services, onConnectPro }: Props) {
  const copy = servicesProUpsellCopy(variant);
  const demoBundles = demoBundlesForPreview(services);
  const demoPromos = demoPromotionsForPreview(services).map((p) => ({
    ...p,
    status: derivePromotionStatus(p),
  }));

  const serviceTitleById = new Map(services.map((s) => [s.id, s.title]));

  return (
    <div className={`relative ${servicesTabPanelShell} lg:overflow-hidden`}>
      <div className={`space-y-5 lg:space-y-6 ${servicesTabScrollBottomPad} ${servicesDesktopCardPad}`}>
        <MasterProUpsellBanner variant={variant} />

        <section
          className="rounded-[18px] bg-[#F6F7FB] p-4 lg:rounded-[20px] lg:p-5"
          aria-label={`${copy.exampleTitle} — демонстрация`}
        >
          <p className="text-[13px] font-semibold text-[#6B7280]">{copy.exampleNote}</p>
          <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.08em] text-[#9CA3AF]">
            {copy.exampleTitle}
          </p>

          <div className="pointer-events-none mt-4 select-none space-y-4" aria-hidden>
            {variant === 'bundles'
              ? demoBundles.map((bundle) => (
                  <ServicesBundleCard
                    key={bundle.id}
                    bundle={bundle}
                    services={services}
                    draft={draft}
                    serviceTitleById={serviceTitleById}
                    examplePreview
                  />
                ))
              : demoPromos.map((promo) => (
                  <PromotionBannerCard
                    key={promo.id}
                    promo={promo}
                    examplePreview
                    className="lg:min-h-[180px]"
                  />
                ))}
          </div>
        </section>
      </div>

      <ServicesTabFab ariaLabel={copy.fabLabel} onClick={onConnectPro} />
    </div>
  );
}
