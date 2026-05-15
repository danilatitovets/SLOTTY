/**
 * Ранжирование и дедупликация подсказок адреса в Минске (Яндекс + Nominatim).
 */

export type GeocodeSuggestHit = {
  displayLine: string;
  lat: number;
  lon: number;
};

const SKIP_LINE_PARTS = new Set([
  'беларусь',
  'belarus',
  'республика беларусь',
  'minsk',
  'минск',
  'город минск',
]);

const STREET_PREFIX_RE = /^(ул\.?|улица|пр\.?|проспект|пр-т|пер\.?|переулок|бул\.?|бульвар|пл\.?|площадь|ш\.?|шоссе|наб\.?|набережная|тракт|аллея)\s+/i;

export function normalizeAddressKey(line: string): string {
  return line
    .trim()
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/\s+/g, ' ');
}

/** Токены запроса без типовых префиксов улиц. */
export function queryTokens(query: string): string[] {
  return query
    .trim()
    .toLowerCase()
    .replace(/ё/g, 'е')
    .split(/[\s,.-]+/)
    .map((t) => t.replace(STREET_PREFIX_RE, ''))
    .filter((t) => t.length >= 2);
}

export function streetMatchesQuery(streetLine: string, query: string): boolean {
  const tokens = queryTokens(query);
  if (tokens.length === 0) return true;
  const hay = normalizeAddressKey(streetLine);
  const words = hay.split(/[\s,.-]+/).filter(Boolean);
  return tokens.every((tok) => {
    if (hay.includes(tok)) return true;
    if (tok.length >= 3 && words.some((w) => w.startsWith(tok))) return true;
    return false;
  });
}

/** Границы Минска для отсечения Москвы и других городов. */
export function isMinskAreaCoords(lat: number, lon: number): boolean {
  return lat >= 53.78 && lat <= 53.98 && lon >= 27.32 && lon <= 27.78;
}

export function filterGeocodeHitsToMinskArea<T extends GeocodeSuggestHit>(hits: T[]): T[] {
  return hits.filter((h) => isMinskAreaCoords(h.lat, h.lon));
}

export function mergeGeocodeSuggestHits(...lists: GeocodeSuggestHit[][]): GeocodeSuggestHit[] {
  const seen = new Set<string>();
  const out: GeocodeSuggestHit[] = [];
  for (const list of lists) {
    for (const h of list) {
      const key = `${normalizeAddressKey(h.displayLine)}|${h.lat.toFixed(5)}|${h.lon.toFixed(5)}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(h);
    }
  }
  return out;
}

export function scoreStreetRelevance(streetLine: string, query: string): number {
  const tokens = queryTokens(query);
  if (tokens.length === 0) return 0;

  const hay = normalizeAddressKey(streetLine);
  let score = 0;

  for (const tok of tokens) {
    const idx = hay.indexOf(tok);
    if (idx < 0) return -10_000;

    if (hay === tok) score += 80;
    else if (hay.startsWith(tok)) score += 55;
    else if (idx === 0 || hay[idx - 1] === ' ' || hay[idx - 1] === ',') score += 35;
    else score += 12;

    const wordRe = new RegExp(`(?:^|[\\s,])${tok.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'u');
    if (wordRe.test(hay)) score += 18;
  }

  score -= Math.min(hay.length, 100) * 0.08;
  return score;
}

/** Короткая строка для списка подсказок из полного ответа геокодера. */
export function shortenGeocoderDisplayLine(line: string, city: string): string {
  const cityKey = normalizeAddressKey(city);
  const parts = line
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean);

  const kept = parts.filter((p) => {
    const pl = normalizeAddressKey(p);
    if (SKIP_LINE_PARTS.has(pl)) return false;
    if (pl === cityKey || pl.startsWith(`${cityKey} `)) return false;
    if (pl.startsWith('город ')) return false;
    return true;
  });

  if (kept.length === 0) return line.trim();
  if (kept.length === 1) return kept[0];

  const [first, second] = kept;
  if (/^\d/.test(second) || /^д\.?\s*\d/i.test(second) || /^дом\s*\d/i.test(second)) {
    return `${first}, ${second}`;
  }
  return first;
}

export function dedupeGeocodeHits<T extends GeocodeSuggestHit>(hits: T[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const h of hits) {
    const key = normalizeAddressKey(h.displayLine);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(h);
  }
  return out;
}

export type RefineMinskGeocodeOpts = {
  max?: number;
  /** Если true — при отсутствии строгих совпадений вернуть лучшие из исходного списка. */
  softFallback?: boolean;
};

/**
 * Оставляет релевантные подсказки, сортирует по совпадению с запросом, убирает дубли.
 */
export function refineMinskGeocodeHits<T extends GeocodeSuggestHit>(
  hits: T[],
  query: string,
  city: string,
  opts: RefineMinskGeocodeOpts = {},
): T[] {
  const { max = 8, softFallback = true } = opts;
  const q = query.trim();
  if (hits.length === 0) return [];

  const prepared = hits.map((h) => ({
    ...h,
    displayLine: shortenGeocoderDisplayLine(h.displayLine, city),
  }));

  const strict = prepared.filter((h) => streetMatchesQuery(h.displayLine, q));
  const pool = strict.length > 0 ? strict : softFallback ? prepared : [];

  const sorted = pool
    .slice()
    .sort((a, b) => scoreStreetRelevance(b.displayLine, q) - scoreStreetRelevance(a.displayLine, q));

  return dedupeGeocodeHits(sorted).slice(0, max);
}
