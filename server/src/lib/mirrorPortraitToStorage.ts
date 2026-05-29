import { uploadMasterHeroPhoto } from '../modules/masters/masters.storage.js';
import { uploadProfileAvatar } from '../modules/profiles/profiles.storage.js';
import { isTelegramPortraitUrl } from './profileAvatarUrlPolicy.js';

const allowedFetchHosts = ['telegram-cdn.org', 'telesco.pe', 't.me', 'api.telegram.org'];

function isAllowedRemotePortraitUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:') return false;
    const host = parsed.hostname.toLowerCase();
    if (allowedFetchHosts.some((h) => host === h || host.endsWith(`.${h}`))) return true;
    if (host.includes('googleusercontent.com') || host.includes('ggpht.com')) return true;
    return false;
  } catch {
    return false;
  }
}

async function downloadRemoteImage(url: string): Promise<{ buffer: Buffer; mime: string } | null> {
  if (!isAllowedRemotePortraitUrl(url)) return null;
  try {
    const res = await fetch(url, { redirect: 'follow' });
    if (!res.ok) return null;
    const mime = res.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase() || '';
    if (!mime.startsWith('image/')) return null;
    const buffer = Buffer.from(await res.arrayBuffer());
    if (buffer.length < 32) return null;
    return { buffer, mime };
  } catch {
    return null;
  }
}

/** Telegram / OAuth CDN → Supabase Storage (стабильный URL). */
export async function mirrorPortraitToMasterStorage(
  userId: string,
  sourceUrl: string,
): Promise<string | null> {
  const downloaded = await downloadRemoteImage(sourceUrl.trim());
  if (!downloaded) return null;
  try {
    return await uploadMasterHeroPhoto(userId, downloaded.buffer, downloaded.mime);
  } catch {
    return null;
  }
}

export async function mirrorPortraitToProfileStorage(
  userId: string,
  sourceUrl: string,
): Promise<string | null> {
  const downloaded = await downloadRemoteImage(sourceUrl.trim());
  if (!downloaded) return null;
  try {
    return await uploadProfileAvatar(userId, downloaded.buffer, downloaded.mime);
  } catch {
    return null;
  }
}

export async function resolveStablePortraitUrl(params: {
  userId: string;
  currentUrl: string | null | undefined;
  incomingUrl: string | null | undefined;
  target: 'profile' | 'master';
}): Promise<string | null> {
  const current = params.currentUrl?.trim() || null;
  const incoming = params.incomingUrl?.trim() || null;

  if (current && !isTelegramPortraitUrl(current)) {
    return current;
  }

  const telegramSource = incoming && isTelegramPortraitUrl(incoming) ? incoming : current;
  if (!telegramSource) return incoming || current;

  const mirror =
    params.target === 'master'
      ? await mirrorPortraitToMasterStorage(params.userId, telegramSource)
      : await mirrorPortraitToProfileStorage(params.userId, telegramSource);

  if (mirror) return mirror;
  if (current && !isTelegramPortraitUrl(current)) return current;
  return null;
}
