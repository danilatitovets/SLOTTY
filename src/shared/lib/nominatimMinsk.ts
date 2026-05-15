/**
 * Поиск адресов через Nominatim (OSM), смещение к Беларуси / Минску — как в анкете мастера.
 */

import {
  refineMinskGeocodeHits,
  scoreStreetRelevance,
  streetMatchesQuery,
  type GeocodeSuggestHit,
} from './minskAddressSuggest';

const NOMINATIM_SEARCH = 'https://nominatim.openstreetmap.org/search';
const NOMINATIM_REVERSE = 'https://nominatim.openstreetmap.org/reverse';

/** lon1, lat1, lon2, lat2 — границы Минска. */
const MINSK_VIEWBOX = '27.38,53.95,27.72,53.82';

const NOMINATIM_HEADERS: HeadersInit = {
  Accept: 'application/json',
  'Accept-Language': 'ru',
};

type NominatimAddress = {
  road?: string;
  pedestrian?: string;
  neighbourhood?: string;
  suburb?: string;
  city?: string;
  town?: string;
  village?: string;
  house_number?: string;
  state?: string;
};

export type NominatimMinskHit = {
  place_id: number;
  lat: string;
  lon: string;
  display_name: string;
  address?: NominatimAddress;
  type?: string;
  class?: string;
};

function normalizeAddressKey(line: string): string {
  return line
    .trim()
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/\s+/g, ' ');
}

function isMinskHit(hit: NominatimMinskHit): boolean {
  const dn = hit.display_name.toLowerCase();
  const a = hit.address;
  const city = (a?.city ?? a?.town ?? '').toLowerCase();
  if (city.includes('минск')) return true;
  if (dn.includes('минск')) return true;
  const state = (a?.state ?? '').toLowerCase();
  if (state.includes('минск') && (a?.suburb || a?.road || a?.pedestrian)) return true;
  return false;
}

function streetLabelFromHit(hit: NominatimMinskHit): string {
  const a = hit.address;
  if (a?.road?.trim()) return a.road.trim();
  if (a?.pedestrian?.trim()) return a.pedestrian.trim();
  const parts = hit.display_name.split(',').map((s) => s.trim());
  return parts[0] ?? hit.display_name;
}

function suggestKeyFromHit(hit: NominatimMinskHit): string {
  const a = hit.address;
  const road = (a?.road ?? a?.pedestrian ?? '').trim();
  if (road) return normalizeAddressKey(road);
  return normalizeAddressKey(nominatimLineForForm(hit));
}

function rankNominatimHits(hits: NominatimMinskHit[], streetPart: string): NominatimMinskHit[] {
  const q = streetPart.trim();
  const withScore = hits.map((hit) => {
    const label = nominatimLineForForm(hit);
    const street = streetLabelFromHit(hit);
    let score = scoreStreetRelevance(label, q);
    if (streetMatchesQuery(street, q)) score += 40;
    const cls = hit.class ?? '';
    const typ = hit.type ?? '';
    if (cls === 'highway' || typ === 'residential' || typ === 'tertiary' || typ === 'secondary') {
      score += 25;
    }
    if (typ === 'house' || typ === 'building') score += 8;
    if (cls === 'place' && typ === 'suburb') score -= 15;
    return { hit, score, label };
  });

  const strict = withScore.filter(
    (x) => streetMatchesQuery(x.label, q) || streetMatchesQuery(streetLabelFromHit(x.hit), q),
  );
  const pool = strict.length > 0 ? strict : withScore.filter((x) => x.score > -5000);

  pool.sort((a, b) => b.score - a.score);

  const seen = new Set<string>();
  const out: NominatimMinskHit[] = [];
  for (const { hit } of pool) {
    const key = suggestKeyFromHit(hit);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(hit);
    if (out.length >= 10) break;
  }
  return out;
}

async function nominatimFetch(url: URL, signal: AbortSignal): Promise<NominatimMinskHit[]> {
  const res = await fetch(url.toString(), { signal, headers: NOMINATIM_HEADERS });
  if (!res.ok) throw new Error(`nominatim ${res.status}`);
  const data = (await res.json()) as unknown;
  if (!Array.isArray(data)) return [];
  return (data as NominatimMinskHit[]).filter(isMinskHit);
}

function baseSearchParams(): URLSearchParams {
  const p = new URLSearchParams();
  p.set('format', 'jsonv2');
  p.set('limit', '15');
  p.set('addressdetails', '1');
  p.set('countrycodes', 'by');
  p.set('viewbox', MINSK_VIEWBOX);
  p.set('bounded', '1');
  return p;
}

function applyBaseParams(url: URL): void {
  for (const [k, v] of baseSearchParams().entries()) {
    url.searchParams.set(k, v);
  }
}

async function nominatimStructuredSearch(
  city: string,
  streetPart: string,
  signal: AbortSignal,
): Promise<NominatimMinskHit[]> {
  const street = streetPart.trim();
  if (street.length < 1) return [];

  const url = new URL(NOMINATIM_SEARCH);
  applyBaseParams(url);
  url.searchParams.set('street', street);
  url.searchParams.set('city', city.trim() || 'Минск');
  url.searchParams.set('country', 'Беларусь');

  return nominatimFetch(url, signal);
}

async function nominatimStreetFeatureSearch(
  city: string,
  streetPart: string,
  signal: AbortSignal,
): Promise<NominatimMinskHit[]> {
  const q = streetPart.trim();
  if (q.length < 1) return [];

  const cityPart = city.trim() || 'Минск';
  const url = new URL(NOMINATIM_SEARCH);
  applyBaseParams(url);
  url.searchParams.set('q', `${q}, ${cityPart}`);
  url.searchParams.set('featuretype', 'street');

  return nominatimFetch(url, signal);
}

async function nominatimFreeTextSearch(
  city: string,
  streetPart: string,
  signal: AbortSignal,
): Promise<NominatimMinskHit[]> {
  const q = streetPart.trim();
  if (q.length < 1) return [];

  const cityPart = city.trim() || 'Минск';
  const url = new URL(NOMINATIM_SEARCH);
  applyBaseParams(url);
  url.searchParams.set('q', `${cityPart}, ${q}`);

  return nominatimFetch(url, signal);
}

function mergeNominatimHits(...lists: NominatimMinskHit[][]): NominatimMinskHit[] {
  const byId = new Map<number, NominatimMinskHit>();
  for (const list of lists) {
    for (const hit of list) {
      if (!byId.has(hit.place_id)) byId.set(hit.place_id, hit);
    }
  }
  return [...byId.values()];
}

/** Короткая строка для поля из ответа Nominatim (как при вводе адреса мастером). */
export function nominatimLineForForm(hit: NominatimMinskHit): string {
  const a = hit.address;
  if (a?.road && a.house_number) return `${a.road}, ${a.house_number}`;
  if (a?.pedestrian && a.house_number) return `${a.pedestrian}, ${a.house_number}`;
  if (a?.road) return a.road;
  if (a?.pedestrian) return a.pedestrian;
  const parts = hit.display_name.split(',').map((s) => s.trim());
  const withoutCountry = parts.filter((p) => {
    const pl = p.toLowerCase();
    return pl !== 'беларусь' && !pl.startsWith('беларусь ');
  });
  return withoutCountry.slice(0, 2).join(', ') || 'Адрес в Минске';
}

/**
 * Прямой геокодинг: `streetPart` — то, что вводит пользователь; к запросу добавляется город.
 */
export async function nominatimSearchMinsk(
  city: string,
  streetPart: string,
  signal: AbortSignal,
): Promise<NominatimMinskHit[]> {
  const q = streetPart.trim();
  if (q.length < 1) return [];

  const [structured, byStreet, free] = await Promise.all([
    nominatimStructuredSearch(city, q, signal),
    nominatimStreetFeatureSearch(city, q, signal),
    nominatimFreeTextSearch(city, q, signal),
  ]);

  const merged = mergeNominatimHits(structured, byStreet, free);
  return rankNominatimHits(merged, q);
}

export async function nominatimReverseMinsk(
  lat: number,
  lon: number,
  signal: AbortSignal,
): Promise<NominatimMinskHit | null> {
  const url = new URL(NOMINATIM_REVERSE);
  url.searchParams.set('format', 'jsonv2');
  url.searchParams.set('lat', String(lat));
  url.searchParams.set('lon', String(lon));
  url.searchParams.set('addressdetails', '1');

  const res = await fetch(url.toString(), { signal, headers: NOMINATIM_HEADERS });
  if (!res.ok) throw new Error(`nominatim reverse ${res.status}`);
  const data = (await res.json()) as NominatimMinskHit & { error?: string };
  if (data?.error) return null;
  return data;
}

/** Nominatim → общий формат подсказок с ранжированием и дедупом. */
export function nominatimHitsToGeocodeSuggest(
  hits: NominatimMinskHit[],
  query: string,
  city: string,
): GeocodeSuggestHit[] {
  const mapped = hits
    .map((hit) => {
      const lat = Number.parseFloat(hit.lat);
      const lon = Number.parseFloat(hit.lon);
      if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
      return { displayLine: nominatimLineForForm(hit), lat, lon };
    })
    .filter((h): h is GeocodeSuggestHit => h != null);

  return refineMinskGeocodeHits(mapped, query, city);
}

export { refineMinskGeocodeHits };
