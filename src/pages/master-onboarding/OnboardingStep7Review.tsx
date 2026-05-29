import type { DemoMasterService } from '../../features/services/model/demoMasters';
import { MasterExtraSections } from '../client/masterProfile/MasterExtraSections';
import { MasterHeroCard } from '../client/masterProfile/MasterHeroCard';
import { MasterReviewsSection } from '../client/masterProfile/MasterReviewsSection';
import { MasterServicesList } from '../client/masterProfile/MasterServicesList';
import { MasterTrustStats } from '../client/masterProfile/MasterTrustStats';
import {
  catalogCanvasClass,
  masterProfileDesktopLayout,
  masterProfileDesktopMainCol,
  masterProfileDesktopSidebarCol,
} from '../client/masterProfile/masterProfileTheme';
import {
  buildOnboardingPublicProfile,
  type BuildOnboardingPublicProfileInput,
} from './buildOnboardingPublicProfile';
import { OnboardingReviewTrustTabs } from './OnboardingReviewTrustTabs';

type Props = BuildOnboardingPublicProfileInput;

/** Превью публичного профиля — те же блоки, что на `/master/:id`, плюс вкладки доверия. */
export function OnboardingStep7Review(props: Props) {
  const master = buildOnboardingPublicProfile(props);

  const onServiceSelect = (_service: DemoMasterService) => {
    /* превью: без карточки услуги */
  };

  return (
    <div className="mt-6 pb-2">
      <div
        className={`overflow-visible rounded-[16px] ring-1 ring-[#EAECEF] ${catalogCanvasClass}`}
        aria-label="Превью профиля мастера"
      >
        <div className="mx-auto w-full max-w-lg lg:max-w-none lg:px-6 lg:py-6 xl:px-8">
          <div className={masterProfileDesktopLayout}>
            <div className={`space-y-4 ${masterProfileDesktopMainCol}`}>
              <main className="space-y-4 px-4 py-4 text-[#111827] lg:px-0 lg:py-0">
                <MasterHeroCard
                  master={master}
                  userLat={null}
                  userLng={null}
                  nearest={null}
                />

                <div className="pointer-events-none">
                  <MasterServicesList
                    services={master.services}
                    categoryCode={master.categoryCode}
                    categoryLabel={master.category}
                    onSelect={onServiceSelect}
                    previewMode
                  />
                </div>

                <OnboardingReviewTrustTabs
                  certificates={props.certificates ?? []}
                  educationItems={props.educationItems ?? []}
                  className="lg:shadow-[0_4px_24px_rgba(17,24,39,0.06)]"
                />

                <div className="pointer-events-none opacity-95 lg:hidden">
                  <MasterTrustStats master={master} />
                  <MasterReviewsSection reviews={master.reviews} />
                </div>

                <div className="pointer-events-none lg:hidden">
                  <MasterExtraSections master={master} />
                </div>
              </main>
            </div>

            <aside className={`space-y-4 ${masterProfileDesktopSidebarCol}`}>
              <div className="pointer-events-none space-y-4 px-4 lg:px-0">
                <div className="hidden opacity-95 lg:block">
                  <MasterTrustStats master={master} layout="desktop" />
                  <div className="mt-4">
                    <MasterReviewsSection reviews={master.reviews} layout="desktop" />
                  </div>
                </div>
                <MasterExtraSections master={master} layout="desktop" />
              </div>
            </aside>
          </div>
        </div>
      </div>

      <p className="mt-4 rounded-[12px] bg-[#F5F5F5] px-3 py-2.5 text-center text-[12px] font-medium leading-snug text-[#6B7280] lg:mx-6 xl:mx-8">
        График записи и свободные окна появятся в кабинете после публикации
      </p>
    </div>
  );
}
