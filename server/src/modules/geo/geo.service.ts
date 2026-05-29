import { GeoTtlCache, waitNominatimSlot } from './geo.cache.js';
import type { GeoAddressHit } from './geo.types.js';
import { nominatimReverseUpstream, nominatimSearchUpstream } from './nominatimUpstream.js';

const searchCache = new GeoTtlCache<GeoAddressHit[]>();
const reverseCache = new GeoTtlCache<GeoAddressHit>();

export async function geoSearch(city: string, query: string): Promise<GeoAddressHit[]> {
  const q = query.trim();
  if (q.length < 3) return [];

  const cityPart = city.trim() || 'Минск';
  const cacheKey = `search:${cityPart.toLowerCase()}:${q.toLowerCase()}`;
  const cached = searchCache.get(cacheKey);
  if (cached) return cached;

  await waitNominatimSlot();
  const hits = await nominatimSearchUpstream(cityPart, q);
  searchCache.set(cacheKey, hits);
  return hits;
}

export async function geoReverse(lat: number, lng: number): Promise<GeoAddressHit | null> {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  const cacheKey = `reverse:${lat.toFixed(5)}:${lng.toFixed(5)}`;
  const cached = reverseCache.get(cacheKey);
  if (cached) return cached;

  await waitNominatimSlot();
  const hit = await nominatimReverseUpstream(lat, lng);
  if (hit) reverseCache.set(cacheKey, hit);
  return hit;
}
