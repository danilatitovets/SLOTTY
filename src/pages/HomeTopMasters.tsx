import { useEffect, type FC } from 'react';
import { Link } from 'react-router-dom';
import { useClientGeo } from './client/hooks/useClientGeo';
import { MASTERS_PATH } from '../app/paths';
import type { ServiceListingRecord } from '../features/services/model/demoMasters';
import { NothingFoundCard } from '../shared/ui/NothingFoundCard';
import { LoadingVideo } from '../shared/ui/LoadingVideo';
import { MasterCard } from './client/components/MasterCard';
import { ClientErrorModalProvider } from './client/ClientErrorModalContext';
import { homeLink, homePinkBtn, homeScrollRow, homeSection } from './home/homeTheme';

export type HomeTopMastersProps = {
  masters: ServiceListingRecord[];
  isLoading: boolean;
};

export const HomeTopMasters: FC<HomeTopMastersProps> = ({ masters, isLoading }) => {
  const { userLat, userLng, hasGeo, requestGeo } = useClientGeo();

  useEffect(() => {
    if (!hasGeo) requestGeo();
  }, [hasGeo, requestGeo]);

  return (
    <section
      className={homeSection}
      style={{ animationDelay: '140ms' }}
      aria-labelledby="top-masters-heading"
    >
      <div className="mx-auto max-w-[40rem] text-center">
        <h2
          id="top-masters-heading"
          className="text-[clamp(2rem,6vw,3.25rem)] font-bold leading-[1.05] tracking-[-0.04em] text-[#111827]"
        >
          Мастера рядом с вами
        </h2>
        <Link to={MASTERS_PATH} className={`${homeLink} mt-4 inline-flex`}>
          Все мастера
        </Link>
      </div>

      <ClientErrorModalProvider>
        <div className={`${homeScrollRow} mt-10 items-stretch bg-transparent sm:mt-14`}>
          {isLoading ? (
            <div className="flex min-h-[14rem] w-full min-w-0 shrink-0 items-center justify-center py-8">
              <LoadingVideo size="lg" label="Загрузка мастеров…" />
            </div>
          ) : masters.length === 0 ? (
            <div className="w-full min-w-0 shrink-0 px-0.5">
              <NothingFoundCard
                title="Мастера скоро появятся"
                text="Откройте каталог и выберите услугу — мы подберём специалиста."
                action={
                  <Link to={MASTERS_PATH} className={`${homePinkBtn} w-full max-w-xs`}>
                    Все мастера
                  </Link>
                }
              />
            </div>
          ) : (
            masters.map((listing) => (
              <div
                key={listing.masterId}
                className="flex w-[min(88vw,21.25rem)] shrink-0 snap-start sm:w-[21.25rem]"
              >
                <MasterCard listing={listing} userLat={userLat} userLng={userLng} layout="home" />
              </div>
            ))
          )}
        </div>
      </ClientErrorModalProvider>
    </section>
  );
};
