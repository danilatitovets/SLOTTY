import {
  augmentNominatimSearchQuery,
  normalizeNominatimHits,
  queryMentionsByCity,
  type NominatimRawHit,
  type NormalizedAddressSuggestion,
} from '../../lib/location/normalizeNominatimAddress.js';
import type { GeoAddressHit } from './geo.types.js';

const NOMINATIM_SEARCH = 'https://nominatim.openstreetmap.org/search';
const NOMINATIM_REVERSE = 'https://nominatim.openstreetmap.org/reverse';
const MINSK_VIEWBOX = '27.38,53.95,27.72,53.82';

const HEADERS: Record<string, string> = {
  Accept: 'application/json',
  'Accept-Language': 'ru',
  'User-Agent': 'SLOTTY/1.0 (https://slotty.app; geo-api)',
};

function normalizedToGeo(row: NormalizedAddressSuggestion): GeoAddressHit {
  const raw = row.raw as NominatimRawHit | undefined;
  const street =
    raw?.address?.road?.trim() ||
    raw?.address?.pedestrian?.trim() ||
    raw?.address?.footway?.trim() ||
    undefined;
  const building = raw?.address?.house_number?.trim() || undefined;
  const city =
    raw?.address?.city?.trim() ||
    raw?.address?.town?.trim() ||
    raw?.address?.village?.trim() ||
    row.subtitle.split(',')[0]?.trim() ||
    undefined;

  return {
    id: row.id,
    title: row.title,
    subtitle: row.subtitle,
    addressLine: row.cleanAddress,
    cleanAddress: row.cleanAddress,
    fullAddress: row.fullAddress,
    city,
    street,
    building,
    lat: row.latitude,
    lng: row.longitude,
  };
}

async function fetchNominatimSearch(url: URL): Promise<NominatimRawHit[]> {
  const res = await fetch(url.toString(), { headers: HEADERS });
  if (!res.ok) throw new Error(`nominatim search ${res.status}`);
  const data = (await res.json()) as unknown;
  if (!Array.isArray(data)) return [];
  return data as NominatimRawHit[];
}

function buildSearchUrl(city: string, query: string): URL {
  const cityPart = city.trim() || 'Минск';
  const q = augmentNominatimSearchQuery(query, cityPart);
  const mentionsOtherCity = queryMentionsByCity(query) && !query.toLowerCase().includes('минск');

  const url = new URL(NOMINATIM_SEARCH);
  url.searchParams.set('format', 'jsonv2');
  url.searchParams.set('addressdetails', '1');
  url.searchParams.set('limit', '8');
  url.searchParams.set('countrycodes', 'by');
  url.searchParams.set('accept-language', 'ru');
  url.searchParams.set('q', mentionsOtherCity ? query.trim() : q);

  if (!mentionsOtherCity) {
    url.searchParams.set('bounded', '1');
    url.searchParams.set('viewbox', MINSK_VIEWBOX);
  }

  return url;
}

export async function nominatimSearchUpstream(city: string, query: string): Promise<GeoAddressHit[]> {
  const q = query.trim();
  if (q.length < 1) return [];

  const url = buildSearchUrl(city, q);
  const raw = await fetchNominatimSearch(url);
  const normalized = normalizeNominatimHits(raw);

  return normalized.map(normalizedToGeo);
}

export async function nominatimReverseUpstream(lat: number, lng: number): Promise<GeoAddressHit | null> {
  const url = new URL(NOMINATIM_REVERSE);
  url.searchParams.set('format', 'jsonv2');
  url.searchParams.set('lat', String(lat));
  url.searchParams.set('lon', String(lng));
  url.searchParams.set('addressdetails', '1');
  url.searchParams.set('accept-language', 'ru');

  const res = await fetch(url.toString(), { headers: HEADERS });
  if (!res.ok) throw new Error(`nominatim reverse ${res.status}`);
  const data = (await res.json()) as NominatimRawHit & { error?: string };
  if (data?.error) return null;

  const rows = normalizeNominatimHits([{ ...data, lat: String(lat), lon: String(lng) }]);
  const row = rows[0];
  if (!row) return null;
  return { ...normalizedToGeo(row), lat, lng };
}
