/**
 * Геокодер Яндекса, ограниченный Минском (bbox).
 * Ключ в URL: VITE_YANDEX_MAPS_API_KEY / NEXT_PUBLIC_YANDEX_MAPS_API_KEY (без ключа HTTP-геокодинг недоступен; карта JS может работать без него).
 */

export type YandexGeocodeHit = {
  /** Текст для формы / подсказки */
  displayLine: string;
  lat: number;
  lon: number;
};

const MINSK_BBOX = '27.35,53.75~27.72,54.05';

function apiKey(): string | undefined {
  const vite = import.meta.env.VITE_YANDEX_MAPS_API_KEY as string | undefined;
  if (vite && vite.trim()) return vite.trim();
  const next = import.meta.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY as string | undefined;
  if (next && next.trim()) return next.trim();
  return undefined;
}

function parseGeoObject(raw: unknown): YandexGeocodeHit | null {
  if (!raw || typeof raw !== 'object') return null;
  const go = raw as {
    metaDataProperty?: { GeocoderMetaData?: { text?: string } };
    Point?: { pos?: string };
  };
  const text = go.metaDataProperty?.GeocoderMetaData?.text?.trim();
  const pos = go.Point?.pos?.trim();
  if (!text || !pos) return null;
  const [lonS, latS] = pos.split(/\s+/);
  const lat = Number.parseFloat(latS ?? '');
  const lon = Number.parseFloat(lonS ?? '');
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  return { displayLine: text, lat, lon };
}

function collectMembers(node: unknown, out: unknown[]): void {
  if (!node || typeof node !== 'object') return;
  const o = node as Record<string, unknown>;
  if (Array.isArray(o.featureMember)) {
    for (const m of o.featureMember) {
      const g = (m as { GeoObject?: unknown })?.GeoObject;
      if (g) out.push(g);
    }
  }
  if (Array.isArray(o.member)) {
    for (const m of o.member) collectMembers(m, out);
  }
  if (o.GeoObjectCollection && typeof o.GeoObjectCollection === 'object') {
    collectMembers(o.GeoObjectCollection, out);
  }
}

export function hasYandexGeocoderKey(): boolean {
  return Boolean(apiKey());
}

/** Bias / limit area: south-west lat,lon — north-east lat,lon (Минск и окрестности). */
const MINSK_BOUNDED_BY: [[number, number], [number, number]] = [
  [53.75, 27.35],
  [54.05, 27.72],
];

export type YmapsGeocodeApi = {
  geocode: (
    request: string,
    options?: { results?: number; boundedBy?: [[number, number], [number, number]]; strictBounds?: boolean },
  ) => Promise<unknown>;
};

function hitsFromGeocodeResult(res: unknown): YandexGeocodeHit[] {
  if (!res || typeof res !== 'object') return [];
  const geoObjects = (res as { geoObjects?: { each?: (fn: (obj: unknown) => void) => void } }).geoObjects;
  if (!geoObjects || typeof geoObjects.each !== 'function') return [];

  const hits: YandexGeocodeHit[] = [];
  geoObjects.each((obj: unknown) => {
    if (!obj || typeof obj !== 'object') return;
    const o = obj as {
      geometry?: { getCoordinates?: () => number[] };
      getAddressLine?: () => string;
      properties?: { get?: (k: string) => unknown };
    };
    const coords = o.geometry?.getCoordinates?.();
    if (!Array.isArray(coords) || coords.length < 2) return;
    const lat = coords[0];
    const lon = coords[1];
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return;
    const line =
      typeof o.getAddressLine === 'function'
        ? o.getAddressLine()?.trim()
        : String(o.properties?.get?.('text') ?? o.properties?.get?.('name') ?? '').trim();
    if (!line) return;
    hits.push({ displayLine: line, lat, lon });
  });
  return hits;
}

/**
 * Геокодинг через уже загруженный JS API Яндекс.Карт (тот же сценарий, что и карта).
 * Полезно, когда HTTP-геокодер без ключа недоступен, а скрипт карты с `apikey` уже подключён.
 */
export async function yandexGeocodeMinskViaYmaps(ymaps: YmapsGeocodeApi, city: string, localQuery: string): Promise<YandexGeocodeHit[]> {
  const q = localQuery.trim();
  if (q.length < 1) return [];
  if (typeof ymaps.geocode !== 'function') return [];

  const request = `${city}, ${q}`;
  const opts = { results: 6, boundedBy: MINSK_BOUNDED_BY, strictBounds: true as const };

  let res = await ymaps.geocode(request, opts);
  let hits = hitsFromGeocodeResult(res);
  if (hits.length === 0) {
    res = await ymaps.geocode(request, { ...opts, strictBounds: false });
    hits = hitsFromGeocodeResult(res);
  }
  return hits;
}

/** Прямой геокодинг (подсказки), с debounce вызывать снаружи. */
export async function yandexGeocodeMinsk(query: string, signal: AbortSignal): Promise<YandexGeocodeHit[]> {
  const key = apiKey();
  if (!key) return [];
  const q = query.trim();
  if (q.length < 1) return [];

  const geocode = q;
  const url = new URL('https://geocode-maps.yandex.ru/1.x/');
  url.searchParams.set('apikey', key);
  url.searchParams.set('geocode', geocode);
  url.searchParams.set('format', 'json');
  url.searchParams.set('results', '6');
  url.searchParams.set('bbox', MINSK_BBOX);
  url.searchParams.set('rspn', '1');

  const res = await fetch(url.toString(), { signal, headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`geocoder ${res.status}`);
  const data = (await res.json()) as unknown;
  const root = (data as { response?: { GeoObjectCollection?: unknown } })?.response?.GeoObjectCollection;
  const members: unknown[] = [];
  collectMembers(root, members);

  const hits: YandexGeocodeHit[] = [];
  for (const m of members) {
    const h = parseGeoObject(m);
    if (h) hits.push(h);
  }
  return hits;
}

/** Обратное геокодирование по координатам. */
export async function yandexReverseMinsk(lat: number, lon: number, signal: AbortSignal): Promise<string | null> {
  const key = apiKey();
  if (!key) return null;
  const url = new URL('https://geocode-maps.yandex.ru/1.x/');
  url.searchParams.set('apikey', key);
  url.searchParams.set('geocode', `${lon},${lat}`);
  url.searchParams.set('format', 'json');
  url.searchParams.set('results', '1');
  url.searchParams.set('bbox', MINSK_BBOX);
  url.searchParams.set('rspn', '1');

  const res = await fetch(url.toString(), { signal, headers: { Accept: 'application/json' } });
  if (!res.ok) return null;
  const data = (await res.json()) as unknown;
  const root = (data as { response?: { GeoObjectCollection?: unknown } })?.response?.GeoObjectCollection;
  const members: unknown[] = [];
  collectMembers(root, members);
  const h = members[0] ? parseGeoObject(members[0]) : null;
  return h?.displayLine ?? null;
}
