import { getBotToken, TG_API_BASE } from './telegram.botApi.js';

type TgApiResult<T> = { ok?: boolean; result?: T; description?: string };

type ProfilePhotoSize = { file_id: string; width: number; height: number };
type ProfilePhotosResult = { photos?: ProfilePhotoSize[][] };
type FileResult = { file_path?: string };

/** Свежий URL портрета через Bot API (работает, когда initData photo_url протух). */
export async function fetchTelegramUserPortraitUrl(telegramUserId: number): Promise<string | null> {
  const token = getBotToken();
  if (!token || !Number.isFinite(telegramUserId)) return null;

  try {
    const photosRes = await fetch(`${TG_API_BASE}/bot${token}/getUserProfilePhotos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: telegramUserId, limit: 1 }),
    });
    const photosData = (await photosRes.json().catch(() => ({}))) as TgApiResult<ProfilePhotosResult>;
    const sizes = photosData.result?.photos?.[0];
    if (!photosData.ok || !sizes?.length) return null;

    const fileId = sizes[sizes.length - 1]!.file_id;
    const fileRes = await fetch(`${TG_API_BASE}/bot${token}/getFile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ file_id: fileId }),
    });
    const fileData = (await fileRes.json().catch(() => ({}))) as TgApiResult<FileResult>;
    const filePath = fileData.result?.file_path?.trim();
    if (!fileData.ok || !filePath) return null;

    return `${TG_API_BASE}/file/bot${token}/${filePath}`;
  } catch {
    return null;
  }
}
