import { useMemo } from 'react';
import type { FC } from 'react';
import { useQuery } from '@tanstack/react-query';
import { buildYandexMapWidgetUrlForPoints, MAX_WIDGET_PLACEMARKS } from '../features/appointments/model/demoAppointments';
import { fetchPublishedMasters } from '../features/services/api/publishedMastersApi';
import { getApiBaseUrl } from '../shared/api/backendClient';

const MAP_FETCH_LIMIT = 300;

export const HomeMapSection: FC = () => {
  const { data: masters, isLoading } = useQuery({
    queryKey: ['masters-feed', 'map-pins', MAP_FETCH_LIMIT],
    queryFn: async () => {
      if (!getApiBaseUrl()) return [];
      return fetchPublishedMasters({ limit: MAP_FETCH_LIMIT });
    },
  });

  const { mapSrc, pinCount, mapShown, publishedCount } = useMemo(() => {
    const list = masters ?? [];
    const ptsAll = list
      .map((m) => {
        const lat = m.location?.lat;
        const lng = m.location?.lng;
        if (lat == null || lng == null) return null;
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
        return { lon: lng, lat };
      })
      .filter(Boolean) as { lon: number; lat: number }[];
    const mapShown = Math.min(ptsAll.length, MAX_WIDGET_PLACEMARKS);
    return {
      mapSrc: buildYandexMapWidgetUrlForPoints(ptsAll),
      pinCount: ptsAll.length,
      mapShown,
      publishedCount: list.length,
    };
  }, [masters]);

  return (
    <section className="mt-14 animate-fade-enter scroll-mt-28 sm:mt-16" style={{ animationDelay: '100ms' }}>
      <div className="mb-4 px-1 text-center sm:text-left">
        <h2 className="mt-2 text-[28px] font-semibold tracking-[-0.05em] text-neutral-950 sm:text-[32px]">
          Мастера на карте
        </h2>
        {!isLoading && pinCount > 0 ? (
          <p className="mt-2 max-w-xl text-[14px] leading-relaxed text-neutral-500">
            {pinCount > mapShown
              ? `На карте — первые ${mapShown} из ${pinCount} точек приёма (ограничение виджета Яндекса).`
              : `На карте — ${mapShown} точек приёма мастеров с сохранёнными координатами.`}
            {publishedCount > pinCount ? ` В каталоге ещё ${publishedCount - pinCount} без координат на карте.` : ''}
          </p>
        ) : !isLoading && publishedCount > 0 && pinCount === 0 ? (
          <p className="mt-2 max-w-xl text-[14px] leading-relaxed text-neutral-500">
            Пока ни у кого из мастеров не указаны координаты на карте — отображается Минск. После сохранения точки в
            профиле метка появится здесь.
          </p>
        ) : null}
      </div>

      <div className="rounded-[36px] bg-[#F1EFEF] p-3 shadow-[0_24px_70px_rgba(17,17,17,0.05)]">
        <div className="overflow-hidden rounded-[28px] bg-white p-2 shadow-[0_10px_30px_rgba(17,17,17,0.035)]">
          <p className="px-2 pb-2 text-[12px] font-semibold uppercase tracking-[0.14em] text-neutral-400">
            Яндекс.Карты
          </p>
          <div className="overflow-hidden rounded-[22px] bg-neutral-200 shadow-[inset_0_0_0_1px_rgba(17,17,17,0.04)]">
            <iframe
              title="Карта — мастера"
              src={mapSrc}
              className="block h-[min(280px,50dvh)] w-full min-h-[220px] border-0 sm:h-[min(320px,45dvh)]"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </div>
    </section>
  );
};
