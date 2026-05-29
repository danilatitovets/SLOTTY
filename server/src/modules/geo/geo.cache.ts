const DEFAULT_TTL_MS = 10 * 60 * 1000;

type CacheEntry<T> = {
  expiresAt: number;
  value: T;
};

export class GeoTtlCache<T> {
  private readonly store = new Map<string, CacheEntry<T>>();

  constructor(private readonly ttlMs = DEFAULT_TTL_MS) {}

  get(key: string): T | undefined {
    const row = this.store.get(key);
    if (!row) return undefined;
    if (Date.now() > row.expiresAt) {
      this.store.delete(key);
      return undefined;
    }
    return row.value;
  }

  set(key: string, value: T): void {
    this.store.set(key, { value, expiresAt: Date.now() + this.ttlMs });
  }
}

/** Глобальный интервал между запросами к Nominatim (политика OSM). */
let lastUpstreamAt = 0;

export async function waitNominatimSlot(minIntervalMs = 1100): Promise<void> {
  const now = Date.now();
  const waitMs = Math.max(0, minIntervalMs - (now - lastUpstreamAt));
  if (waitMs > 0) {
    await new Promise((resolve) => setTimeout(resolve, waitMs));
  }
  lastUpstreamAt = Date.now();
}
