/**
 * Уменьшает запрашиваемый размер у генераторов аватаров (меньше трафик и быстрее декодирование).
 * Остальные URL не трогаем.
 */
export function optimizeAvatarUrl(url: string, maxEdge = 256): string {
  const u = typeof url === 'string' ? url.trim() : '';
  if (!u) return u;
  try {
    if (u.includes('ui-avatars.com/api')) {
      const parsed = new URL(u, 'https://ui-avatars.com');
      const size = Math.max(64, Math.min(maxEdge, 512));
      parsed.searchParams.set('size', String(size));
      return parsed.toString();
    }
  } catch {
    return url;
  }
  return url;
}
