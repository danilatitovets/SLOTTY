import {
  dedupeGeoAddressHits,
  geoReverseAddress,
  geoSearchAddresses,
} from '../../../features/geo/api/geoApi';
import type { GeoAddressHit } from '../../../features/geo/types';
import {
  dedupeNormalizedSuggestions,
  normalizeNominatimAddress,
  type NominatimRawHit,
  type NormalizedAddressSuggestion,
} from './normalizeNominatimAddress';

export type { NormalizedAddressSuggestion };

const SEARCH_MIN_CHARS = 3;

function isMessySuggestion(row: { title: string; subtitle: string }): boolean {
  const title = row.title.trim();
  const subtitle = row.subtitle.trim();
  if (!subtitle) return false;
  if (subtitle.length > 56) return true;
  if (/\d{5,6}/.test(subtitle) || /\d{5,6}/.test(title)) return true;
  if (/беларусь/i.test(subtitle)) return true;
  if (subtitle.split(',').length > 3) return true;
  const t = title.toLowerCase();
  const s = subtitle.toLowerCase();
  if (s.startsWith(t) && subtitle.length > title.length + 12) return true;
  return false;
}

function rawFromGeoHit(hit: GeoAddressHit): NominatimRawHit {
  const embedded = hit.raw as NominatimRawHit | undefined;
  if (embedded?.address || embedded?.display_name) {
    return {
      ...embedded,
      lat: String(hit.lat),
      lon: String(hit.lng),
    };
  }

  return {
    lat: String(hit.lat),
    lon: String(hit.lng),
    display_name: hit.displayName?.trim() || hit.fullAddress?.trim() || hit.addressLine,
    address: {
      road: hit.street,
      house_number: hit.building,
      city: hit.city,
      town: hit.city,
    },
  };
}

/** Всегда прогоняем через normalizeNominatimAddress — даже если API отдал сырой текст. */
export function geoHitToNormalized(hit: GeoAddressHit): NormalizedAddressSuggestion | null {
  const fromRaw = normalizeNominatimAddress(rawFromGeoHit(hit));
  if (fromRaw && !isMessySuggestion(fromRaw)) {
    return fromRaw;
  }

  if (fromRaw) {
    const subtitle =
      fromRaw.subtitle && !isMessySuggestion({ title: fromRaw.title, subtitle: fromRaw.subtitle })
        ? fromRaw.subtitle
        : hit.city?.trim() || 'Минск';
    return { ...fromRaw, subtitle };
  }

  const cleanAddress = hit.cleanAddress?.trim() || hit.addressLine.trim();
  const title = hit.title?.trim() || cleanAddress.split(',')[0]?.trim() || cleanAddress;
  let subtitle = hit.subtitle?.trim() || hit.city?.trim() || 'Минск';
  if (isMessySuggestion({ title, subtitle })) {
    const parts = cleanAddress.split(',').map((p) => p.trim()).filter(Boolean);
    subtitle = parts.length > 1 ? parts[parts.length - 1] : 'Минск';
  }

  return {
    id: hit.id ?? `${hit.lat.toFixed(5)},${hit.lng.toFixed(5)}`,
    title,
    subtitle,
    fullAddress: hit.fullAddress?.trim() || cleanAddress,
    cleanAddress,
    latitude: hit.lat,
    longitude: hit.lng,
    raw: hit.raw,
  };
}

export async function searchAddress(
  query: string,
  options?: { city?: string; signal?: AbortSignal },
): Promise<NormalizedAddressSuggestion[]> {
  const q = query.trim();
  if (q.length < SEARCH_MIN_CHARS) return [];

  try {
    const hits = await geoSearchAddresses(q, options);
    const rows: NormalizedAddressSuggestion[] = [];
    for (const hit of dedupeGeoAddressHits(hits)) {
      const row = geoHitToNormalized(hit);
      if (row) rows.push(row);
    }
    return dedupeNormalizedSuggestions(rows);
  } catch (err: unknown) {
    if ((err as { name?: string }).name === 'AbortError') return [];
    return [];
  }
}

export async function reverseGeocode(
  lat: number,
  lon: number,
  signal?: AbortSignal,
): Promise<NormalizedAddressSuggestion | null> {
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;

  try {
    const hit = await geoReverseAddress(lat, lon, signal);
    if (!hit) return null;
    return geoHitToNormalized(hit);
  } catch (err: unknown) {
    if ((err as { name?: string }).name === 'AbortError') return null;
    return null;
  }
}
