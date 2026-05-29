/**
 * Нормализация ответов Nominatim (OSM) для UI подсказок и полей адреса.
 * Держите в синхроне с `server/src/lib/location/normalizeNominatimAddress.ts`.
 */

export type NominatimAddressFields = {
  house_number?: string;
  road?: string;
  pedestrian?: string;
  footway?: string;
  path?: string;
  residential?: string;
  neighbourhood?: string;
  suburb?: string;
  quarter?: string;
  borough?: string;
  city_district?: string;
  city?: string;
  town?: string;
  village?: string;
  county?: string;
  state?: string;
  country?: string;
  postcode?: string;
  amenity?: string;
  shop?: string;
  building?: string;
  tourism?: string;
  office?: string;
};

export type NominatimRawHit = {
  place_id?: number;
  osm_id?: number;
  osm_type?: string;
  display_name?: string;
  name?: string;
  lat?: string;
  lon?: string;
  type?: string;
  class?: string;
  addresstype?: string;
  importance?: number;
  address?: NominatimAddressFields;
};

export type NormalizedAddressSuggestion = {
  id: string;
  title: string;
  subtitle: string;
  fullAddress: string;
  cleanAddress: string;
  latitude: number;
  longitude: number;
  raw?: unknown;
};

const SKIP_PART = new Set([
  'беларусь',
  'белоруссия',
  'belarus',
  'by',
  'republic of belarus',
]);

const POSTCODE_RE = /^\d{5,6}$/;

function normPart(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/\s+/g, ' ');
}

function shouldSkipPart(part: string): boolean {
  const p = normPart(part);
  if (!p) return true;
  if (SKIP_PART.has(p)) return true;
  if (POSTCODE_RE.test(p.replace(/\s/g, ''))) return true;
  if (/^[a-z]{2}$/i.test(p)) return true;
  return false;
}

function uniqueParts(parts: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of parts) {
    const t = raw.trim();
    if (!t || shouldSkipPart(t)) continue;
    const key = normPart(t);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(t);
  }
  return out;
}

function getStreet(address?: NominatimAddressFields): string {
  if (!address) return '';
  return (
    address.road ||
    address.pedestrian ||
    address.footway ||
    address.residential ||
    address.path ||
    ''
  ).trim();
}

function getHouse(address?: NominatimAddressFields): string {
  return address?.house_number?.trim() || '';
}

function getDistrict(address?: NominatimAddressFields): string {
  if (!address) return '';
  return (
    address.city_district ||
    address.suburb ||
    address.borough ||
    address.quarter ||
    address.neighbourhood ||
    ''
  ).trim();
}

function getCity(address?: NominatimAddressFields, fallback = ''): string {
  if (!address) return fallback;
  return (address.city || address.town || address.village || address.county || fallback).trim();
}

function getPlaceName(hit: NominatimRawHit): string {
  const a = hit.address;
  const named =
    hit.name?.trim() ||
    a?.amenity?.trim() ||
    a?.shop?.trim() ||
    a?.tourism?.trim() ||
    a?.office?.trim() ||
    a?.building?.trim() ||
    '';
  if (named) return named;

  const isNamedType =
    hit.class === 'amenity' ||
    hit.class === 'shop' ||
    hit.class === 'tourism' ||
    hit.class === 'office' ||
    hit.class === 'building';

  if (isNamedType && hit.display_name) {
    const first = hit.display_name.split(',')[0]?.trim();
    if (first && !shouldSkipPart(first)) return first;
  }
  return '';
}

function cleanDisplayName(displayName: string): string {
  return uniqueParts(displayName.split(',').map((p) => p.trim())).join(', ');
}

function buildTitle(street: string, house: string, placeName: string): string {
  if (placeName && !street) return placeName;
  if (street && house) return `${street}, ${house}`;
  if (street) return street;
  if (placeName) return placeName;
  return '';
}

function buildSubtitle(city: string, district: string, suburbOnly: string): string {
  const parts = uniqueParts([city, district || suburbOnly].filter(Boolean));
  if (parts.length >= 2 && normPart(parts[0]) === normPart(parts[1])) {
    return parts[0];
  }
  return parts.join(', ');
}

function buildCleanAddress(street: string, house: string, city: string, placeName: string): string {
  if (placeName && street) {
    const line = house ? `${street}, ${house}` : street;
    return uniqueParts([placeName, line, city]).slice(0, 3).join(', ');
  }
  if (street) {
    const line = house ? `${street}, ${house}` : street;
    return city ? `${line}, ${city}` : line;
  }
  if (placeName) return city ? `${placeName}, ${city}` : placeName;
  return city;
}

function buildFullAddress(
  title: string,
  subtitle: string,
  street: string,
  house: string,
  city: string,
  district: string,
  suburb: string,
): string {
  const chunks = uniqueParts([
    title,
    street && house && title !== `${street}, ${house}` ? `${street}, ${house}` : '',
    district,
    suburb && normPart(suburb) !== normPart(district) ? suburb : '',
    city,
    subtitle,
  ]);
  return chunks.join(', ').slice(0, 240);
}

const STREET_PART_RE =
  /^(ул\.|улица|пр\.|проспект|пр-т|пер\.|переулок|бульвар|бул\.|шоссе|пл\.|площадь|наб\.|набережная|тракт|мкр\.|микрорайон)/i;

function fallbackFromDisplayName(hit: NominatimRawHit, city: string): {
  title: string;
  subtitle: string;
} {
  const cleaned = cleanDisplayName(hit.display_name || '');
  const parts = cleaned.split(',').map((p) => p.trim()).filter(Boolean);

  const housePart = parts.find((p) => /^\d+[а-яa-z0-9/-]*$/i.test(p));
  const streetPart =
    parts.find((p) => STREET_PART_RE.test(p)) ||
    parts.find((p) => p.length > 2 && !POSTCODE_RE.test(p.replace(/\s/g, '')) && normPart(p) !== normPart(city));

  let title = 'Адрес';
  if (streetPart && housePart) title = `${streetPart}, ${housePart}`;
  else if (streetPart) title = streetPart;
  else if (parts[0]) title = parts[0];

  const districtPart = parts.find(
    (p) =>
      /район/i.test(p) ||
      (/^(микрорайон|мкр\.|квартал|жилой массив)/i.test(p) && normPart(p) !== normPart(city)),
  );
  const suburbPart = parts.find(
    (p) =>
      !STREET_PART_RE.test(p) &&
      !/район/i.test(p) &&
      normPart(p) !== normPart(city) &&
      normPart(p) !== normPart(title) &&
      p.length < 40,
  );

  const subtitle = buildSubtitle(city, districtPart || '', suburbPart || '');
  return { title, subtitle: subtitle || city };
}

function isMessySubtitle(subtitle: string, title: string): boolean {
  const s = subtitle.trim();
  if (!s) return false;
  if (s.length > 56) return true;
  if (/\d{5,6}/.test(s)) return true;
  if (/беларусь/i.test(s)) return true;
  if (s.split(',').length > 3) return true;
  if (normPart(s) === normPart(title)) return true;
  if (normPart(s).startsWith(`${normPart(title)},`)) return true;
  return false;
}

function stripSearchEchoFromTitle(title: string): string {
  const m = title.match(/^[^,]{2,24},\s*(.+)$/);
  if (m?.[1] && STREET_PART_RE.test(m[1].trim())) {
    return m[1].trim();
  }
  return title;
}

function polishSuggestionCopy(
  title: string,
  subtitle: string,
  address?: NominatimAddressFields,
): { title: string; subtitle: string } {
  let t = stripSearchEchoFromTitle(title.trim());
  let s = subtitle.trim();

  if (isMessySubtitle(s, t) && address) {
    s = buildSubtitle(getCity(address), getDistrict(address), address.suburb?.trim() || '');
  }

  if (normPart(s).startsWith(`${normPart(t)},`)) {
    s = s.slice(t.length).replace(/^,\s*/, '').trim();
  }
  if (normPart(s) === normPart(t)) {
    s = address ? buildSubtitle(getCity(address), getDistrict(address), '') : '';
  }

  return { title: t, subtitle: s };
}

export function suggestionDedupeKey(row: Pick<NormalizedAddressSuggestion, 'title' | 'subtitle'>): string {
  return `${normPart(row.title)}|${normPart(row.subtitle)}`;
}

export function dedupeNormalizedSuggestions(
  items: NormalizedAddressSuggestion[],
): NormalizedAddressSuggestion[] {
  const seen = new Set<string>();
  const out: NormalizedAddressSuggestion[] = [];
  for (const row of items) {
    const key = suggestionDedupeKey(row);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(row);
  }
  return out;
}

export function normalizeNominatimAddress(hit: NominatimRawHit): NormalizedAddressSuggestion | null {
  const lat = Number.parseFloat(hit.lat ?? '');
  const lon = Number.parseFloat(hit.lon ?? '');
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;

  const address = hit.address;
  const city = getCity(address);
  const street = getStreet(address);
  const house = getHouse(address);
  const district = getDistrict(address);
  const suburb = address?.suburb?.trim() || '';
  const placeName = getPlaceName(hit);

  let title = buildTitle(street, house, placeName);
  let subtitle = buildSubtitle(city, district, suburb);

  if (!title) {
    const fb = fallbackFromDisplayName(hit, city);
    title = fb.title;
    if (!subtitle) subtitle = fb.subtitle;
  }

  if (!subtitle && city) subtitle = city;

  ({ title, subtitle } = polishSuggestionCopy(title, subtitle, address));

  const cleanAddress = buildCleanAddress(street, house, city, placeName);
  const fullAddress = buildFullAddress(title, subtitle, street, house, city, district, suburb);

  const id =
    hit.place_id != null
      ? `place:${hit.place_id}`
      : `coord:${lat.toFixed(5)},${lon.toFixed(5)}`;

  return {
    id,
    title,
    subtitle,
    fullAddress: fullAddress || cleanAddress || title,
    cleanAddress: cleanAddress || title,
    latitude: lat,
    longitude: lon,
    raw: hit,
  };
}

export function normalizeNominatimHits(hits: NominatimRawHit[]): NormalizedAddressSuggestion[] {
  const rows: NormalizedAddressSuggestion[] = [];
  for (const hit of hits) {
    const row = normalizeNominatimAddress(hit);
    if (row) rows.push(row);
  }
  return dedupeNormalizedSuggestions(rows);
}

/** Города РБ — если в запросе уже есть город, не дополняем «Минск». */
export const BY_CITY_HINTS = [
  'минск',
  'гродно',
  'брест',
  'витебск',
  'гомель',
  'могилёв',
  'могилев',
  'барановичи',
  'бобруйск',
  'пинск',
  'орша',
  'новополоцк',
  'лида',
  'солигорск',
  'молодечно',
  'полоцк',
  'жлобин',
  'светлогорск',
  'речица',
  'слуцк',
  'кобрин',
] as const;

export function queryMentionsByCity(query: string): boolean {
  const lower = query.trim().toLowerCase();
  return BY_CITY_HINTS.some((city) => lower.includes(city));
}

/** Строка для Nominatim (не для UI). */
export function augmentNominatimSearchQuery(query: string, defaultCity = 'Минск'): string {
  const q = query.trim();
  if (q.length < 1) return q;
  if (queryMentionsByCity(q)) return q;
  return `${q}, ${defaultCity}, Беларусь`;
}
