import { apiFetch } from '../../../shared/api/backendClient';
import { suggestionDedupeKey } from '../../../shared/lib/location/normalizeNominatimAddress';
import type { GeoAddressHit } from '../types';

async function readApiError(res: Response): Promise<string> {
  try {
    const j = (await res.json()) as { error?: { message?: string } };
    return j?.error?.message ?? `Ошибка ${res.status}`;
  } catch {
    return `Ошибка ${res.status}`;
  }
}

export function dedupeGeoAddressHits(hits: GeoAddressHit[]): GeoAddressHit[] {
  const seen = new Set<string>();
  const out: GeoAddressHit[] = [];
  for (const hit of hits) {
    const title = hit.title?.trim() || hit.addressLine;
    const subtitle = hit.subtitle?.trim() || hit.city?.trim() || '';
    const key = suggestionDedupeKey({ title, subtitle });
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(hit);
  }
  return out;
}

export async function geoSearchAddresses(
  query: string,
  options?: { city?: string; signal?: AbortSignal },
): Promise<GeoAddressHit[]> {
  const q = query.trim();
  if (q.length < 3) return [];

  const params = new URLSearchParams({ q });
  if (options?.city?.trim()) params.set('city', options.city.trim());

  const res = await apiFetch(`/api/geo/search?${params.toString()}`, {
    skipAuth: true,
    signal: options?.signal,
  });
  if (!res.ok) throw new Error(await readApiError(res));
  const list = (await res.json()) as GeoAddressHit[];
  return dedupeGeoAddressHits(list);
}

export async function geoReverseAddress(
  lat: number,
  lng: number,
  signal?: AbortSignal,
): Promise<GeoAddressHit | null> {
  const params = new URLSearchParams({
    lat: String(lat),
    lng: String(lng),
  });
  const res = await apiFetch(`/api/geo/reverse?${params.toString()}`, {
    skipAuth: true,
    signal,
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(await readApiError(res));
  return (await res.json()) as GeoAddressHit;
}
