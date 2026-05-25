const DEFAULT_TTL_MS = 4_000;

type CacheEntry<T> = { at: number; data: T };

const cache = new Map<string, CacheEntry<unknown>>();
const inflight = new Map<string, Promise<unknown>>();

/**
 * Короткий in-memory cache + dedupe одинаковых GET (каталог, слоты, список мастеров).
 * Снижает лишние запросы при StrictMode и быстрых переключениях фильтров.
 */
export async function fetchPublicGetCached<T>(
  cacheKey: string,
  fetcher: () => Promise<T>,
  ttlMs = DEFAULT_TTL_MS,
): Promise<T> {
  const now = Date.now();
  const hit = cache.get(cacheKey);
  if (hit && now - hit.at < ttlMs) {
    return hit.data as T;
  }

  const pending = inflight.get(cacheKey);
  if (pending) {
    return pending as Promise<T>;
  }

  const promise = fetcher()
    .then((data) => {
      cache.set(cacheKey, { at: Date.now(), data });
      inflight.delete(cacheKey);
      return data;
    })
    .catch((err) => {
      inflight.delete(cacheKey);
      throw err;
    });

  inflight.set(cacheKey, promise);
  return promise;
}
