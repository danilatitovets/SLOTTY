/**
 * Типы и утилиты для записей клиента (данные приходят с GET /api/me/appointments).
 */

import type { MasterLocation } from '../../profile/model/masterLocation';

export type DemoAppointmentStatus = 'confirmed' | 'pending' | 'completed' | 'cancelled';

export type DemoAppointmentTab = 'upcoming' | 'past';

/** Центр и метка для встраиваемого виджета Яндекс.Карт (долгота, широта). */
export type DemoAppointmentYandexMap = {
  lon: number;
  lat: number;
  /** Масштаб карты, по умолчанию 16 */
  zoom?: number;
};

/** Строка записи для UI и PDF (источник — API). */
export type DemoAppointmentRecord = {
  id: string;
  masterId: string;
  masterName: string;
  serviceTitle: string;
  dateLabel: string;
  timeLabel: string;
  location: MasterLocation;
  addressShort: string;
  yandexMap?: DemoAppointmentYandexMap;
  price: number;
  status: DemoAppointmentStatus;
  type: DemoAppointmentTab;
  voucherNumber?: string | null;
  /** Клиент уже оставил отзыв к этой записи. */
  hasReview?: boolean;
};

/** URL встраиваемого виджета Яндекс.Карт для адреса записи. */
export function buildYandexMapWidgetUrl(
  row: Pick<DemoAppointmentRecord, 'addressShort' | 'yandexMap' | 'location'>,
): string {
  if (row.yandexMap) {
    const { lon, lat, zoom = 16 } = row.yandexMap;
    const p = new URLSearchParams();
    p.set('ll', `${lon},${lat}`);
    p.set('z', String(zoom));
    p.set('pt', `${lon},${lat},pm2rdm`);
    return `https://yandex.ru/map-widget/v1/?${p.toString()}`;
  }
  const loc = row.location;
  if (loc.lat != null && loc.lng != null) {
    const p = new URLSearchParams();
    p.set('ll', `${loc.lng},${loc.lat}`);
    p.set('z', '16');
    p.set('pt', `${loc.lng},${loc.lat},pm2rdm`);
    return `https://yandex.ru/map-widget/v1/?${p.toString()}`;
  }

  const p = new URLSearchParams();
  p.set('text', row.addressShort);
  p.set('z', '14');
  p.set('lang', 'ru_RU');
  return `https://yandex.ru/map-widget/v1/?${p.toString()}`;
}

const MAP_PIN_STYLES = ['pm2rdm', 'pm2org', 'pm2dbl', 'pm2gnm', 'pm2vrm', 'pm2ywm'] as const;

/** Максимум меток в одном URL виджета (ограничение статического API Яндекса). */
export const MAX_WIDGET_PLACEMARKS = 99;

/** Виджет с несколькими метками (долгота, широта). Без точек — как `buildYandexMapWidgetUrl` для Минска. */
export function buildYandexMapWidgetUrlForPoints(points: { lon: number; lat: number }[]): string {
  const valid = points
    .filter((p) => Number.isFinite(p.lon) && Number.isFinite(p.lat))
    .slice(0, MAX_WIDGET_PLACEMARKS);
  if (valid.length === 0) {
    return buildYandexMapWidgetUrl({
      addressShort: 'Минск',
      yandexMap: { lon: 27.5615, lat: 53.9045, zoom: 11 },
      location: { visitType: 'studio', street: 'Минск', building: '' },
    });
  }
  if (valid.length === 1) {
    const { lon, lat } = valid[0]!;
    return buildYandexMapWidgetUrl({
      addressShort: 'Минск',
      yandexMap: { lon, lat, zoom: 13 },
      location: { visitType: 'studio', street: '', building: '', lat, lng: lon },
    });
  }
  let minLat = valid[0]!.lat;
  let maxLat = minLat;
  let minLon = valid[0]!.lon;
  let maxLon = minLon;
  for (const p of valid) {
    minLat = Math.min(minLat, p.lat);
    maxLat = Math.max(maxLat, p.lat);
    minLon = Math.min(minLon, p.lon);
    maxLon = Math.max(maxLon, p.lon);
  }
  const centerLon = (minLon + maxLon) / 2;
  const centerLat = (minLat + maxLat) / 2;
  const span = Math.max(maxLat - minLat, maxLon - minLon, 0.0005);
  let z = 14;
  if (span > 4) z = 8;
  else if (span > 1.5) z = 9;
  else if (span > 0.6) z = 10;
  else if (span > 0.25) z = 11;
  else if (span > 0.1) z = 12;
  else if (span > 0.04) z = 13;
  const pt = valid
    .map((p, i) => `${p.lon},${p.lat},${MAP_PIN_STYLES[i % MAP_PIN_STYLES.length]}`)
    .join('~');
  const p = new URLSearchParams();
  p.set('ll', `${centerLon},${centerLat}`);
  p.set('z', String(z));
  p.set('pt', pt);
  return `https://yandex.ru/map-widget/v1/?${p.toString()}`;
}

/**
 * Ссылка на полные Яндекс.Карты с маршрутом «от вас до точки приёма».
 * `rtext=~широта,долгота` — тильда означает старт от текущей геопозиции (в приложении/браузере).
 */
export function buildYandexMapsRouteUrl(
  row: Pick<DemoAppointmentRecord, 'addressShort' | 'yandexMap' | 'location'>,
): string {
  let lat: number | undefined;
  let lon: number | undefined;

  if (row.yandexMap) {
    lat = row.yandexMap.lat;
    lon = row.yandexMap.lon;
  } else {
    const loc = row.location;
    if (loc.lat != null && loc.lng != null) {
      lat = loc.lat;
      lon = loc.lng;
    }
  }

  if (lat != null && lon != null) {
    const p = new URLSearchParams();
    p.set('rtext', `~${lat},${lon}`);
    return `https://yandex.ru/maps/?${p.toString()}`;
  }

  const u = new URL('https://yandex.ru/maps/');
  u.searchParams.set('text', row.addressShort);
  return u.toString();
}
