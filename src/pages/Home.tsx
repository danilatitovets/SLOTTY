import { useCallback, useMemo } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import {
  ADMIN_PATH,
  BECOME_MASTER_PATH,
  BOOKING_PATH,
  getProfilePath,
  getServiceCategoryPath,
  MASTERS_PATH,
} from '../app/paths';
import { useIsMasterUser } from '../features/profile/hooks/useIsMasterUser';
import { setProfileRole } from '../features/profile/lib/setProfileRole';
import { useTelegram } from '../shared/hooks/useTelegram';
import { readTelegramWebAppStartParam } from '../shared/lib/telegramWebApp';
import { HomeStructuredData } from '../shared/seo/HomeStructuredData';
import { HomeHeroStack } from './home/HomeHeroStack';
import { homeShell } from './home/homeLayout';
import { HomeCategories } from './HomeCategories';
import { HomeFaq } from './HomeFaq';
import { HomeFooter } from './HomeFooter';
import { HomeHeader } from './HomeHeader';
import { HomeTariffs } from './HomeTariffs';
import { HomeTrust } from './HomeTrust';
import { WhySlottyBetterSection } from './home/WhySlottyBetterSection';

export function Home() {
  const navigate = useNavigate();
  const { isReady, masterId, isTelegramWebApp } = useTelegram();
  const nativeStart = useMemo(() => readTelegramWebAppStartParam(), []);
  const isMasterUser = useIsMasterUser();

  const masterNavPath = isMasterUser ? ADMIN_PATH : BECOME_MASTER_PATH;
  const masterCtaLabel = isMasterUser ? 'Кабинет мастера' : 'Я мастер';

  const pickClientRoleAnd = useCallback(
    async (path: string) => {
      void setProfileRole('client');
      navigate(path);
    },
    [navigate],
  );

  const onCategory = useCallback(
    (category: string) => {
      void pickClientRoleAnd(getServiceCategoryPath(category));
    },
    [pickClientRoleAnd],
  );

  const onFindMaster = useCallback(() => {
    void pickClientRoleAnd(MASTERS_PATH);
  }, [pickClientRoleAnd]);

  const onBecomeMaster = useCallback(() => {
    navigate(masterNavPath);
  }, [navigate, masterNavPath]);

  const onProfileTab = useCallback(
    (tab: 'appointments' | 'favorites') => {
      void pickClientRoleAnd(getProfilePath(tab));
    },
    [pickClientRoleAnd],
  );

  if (isTelegramWebApp && (nativeStart || (isReady && masterId))) {
    return <Navigate to={BOOKING_PATH} replace />;
  }

  return (
    <div className="min-h-dvh bg-[#E29595] text-neutral-900">
      <HomeStructuredData />
      <div className="overflow-x-visible rounded-b-[2.5rem] bg-white sm:rounded-b-[3rem]">
        <HomeHeader isDemoMaster={isMasterUser} onProfileTab={onProfileTab} />

        <HomeHeroStack
          onFindMaster={onFindMaster}
          onBecomeMaster={onBecomeMaster}
          masterCtaLabel={masterCtaLabel}
        />

        <main
          className={`relative z-10 overflow-x-visible ${homeShell} pb-[max(2.5rem,env(safe-area-inset-bottom))] pt-0`}
        >
          <HomeCategories onCategory={onCategory} />

          <WhySlottyBetterSection />

          <HomeTariffs />

          <HomeTrust />

          <HomeFaq />
        </main>
      </div>

      <HomeFooter />
    </div>
  );
}
