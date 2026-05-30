import { env } from '../config/env.js';

const CANONICAL_ORIGIN = 'https://slotty.of.by';

function isDisallowedOrigin(url: string): boolean {
  try {
    const { hostname } = new URL(url);
    if (hostname === 'localhost' || hostname === '127.0.0.1') return true;
    if (hostname.endsWith('.up.railway.app') || hostname.includes('railway.app')) return true;
    return false;
  } catch {
    return true;
  }
}

/** Public-facing origin for links in emails (never localhost / Railway). */
export function resolvePublicAppOrigin(): string {
  const clientUrl = env.CLIENT_URL?.trim().replace(/\/$/, '');
  if (clientUrl && !isDisallowedOrigin(clientUrl)) {
    return clientUrl;
  }
  return CANONICAL_ORIGIN;
}

export function publicAppUrl(path: string): string {
  const base = resolvePublicAppOrigin();
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${base}${normalized}`;
}
