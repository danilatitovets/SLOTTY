import { readYandexMapsApiKey } from '../../../shared/lib/yandexGeocodeMinsk';

export type MapProvider = 'osm' | 'yandex' | 'none';

/**
 * Провайдер карты: по умолчанию OSM (без ключа).
 * `VITE_MAP_PROVIDER=yandex` + `VITE_YANDEX_MAPS_API_KEY` — опционально Яндекс JS API.
 */
export function resolveMapProvider(): MapProvider {
  const raw = (import.meta.env.VITE_MAP_PROVIDER as string | undefined)?.trim().toLowerCase();
  if (raw === 'yandex' && readYandexMapsApiKey()) return 'yandex';
  if (raw === 'none') return 'none';
  return 'osm';
}
