import { query } from '../config/db.js';
import { resolveStablePortraitUrl } from './mirrorPortraitToStorage.js';
import {
  isStablePortraitUrl,
  isTelegramPortraitUrl,
} from './profileAvatarUrlPolicy.js';
import { fetchTelegramUserPortraitUrl } from '../modules/telegram/telegramPortrait.api.js';

function needsPortraitStabilization(url: string | null | undefined): boolean {
  const raw = url?.trim();
  if (!raw) return true;
  if (isStablePortraitUrl(raw)) return false;
  return isTelegramPortraitUrl(raw);
}

/**
 * Если в БД протухший Telegram CDN — подтягиваем фото через Bot API и зеркалим в Storage.
 */
export async function stabilizePortraitForProfile(profileId: string): Promise<void> {
  const r = await query<{
    avatar_url: string | null;
    telegram_user_id: string | null;
    photo_url: string | null;
    has_master: boolean;
  }>(
    `select
       p.avatar_url,
       p.telegram_user_id::text as telegram_user_id,
       mp.photo_url,
       (mp.master_id is not null) as has_master
     from public.profiles p
     left join public.master_profiles mp on mp.master_id = p.id
    where p.id = $1`,
    [profileId],
  );
  const row = r.rows[0];
  if (!row) return;

  const tgIdRaw = row.telegram_user_id?.trim();
  const tgId = tgIdRaw ? Number(tgIdRaw) : NaN;
  const hasTelegram = Number.isFinite(tgId) && tgId > 0;
  if (!hasTelegram) return;

  const needsAvatar = needsPortraitStabilization(row.avatar_url);
  const needsMaster = row.has_master && needsPortraitStabilization(row.photo_url);
  if (!needsAvatar && !needsMaster) return;

  const freshTelegramUrl = await fetchTelegramUserPortraitUrl(tgId);

  let nextAvatar = row.avatar_url?.trim() || null;
  let nextMasterPhoto = row.photo_url?.trim() || null;
  let changed = false;

  if (needsAvatar) {
    const resolved = await resolveStablePortraitUrl({
      userId: profileId,
      currentUrl: row.avatar_url,
      incomingUrl: freshTelegramUrl,
      target: 'profile',
    });
    if (resolved && resolved !== nextAvatar) {
      nextAvatar = resolved;
      changed = true;
    } else if (resolved && !nextAvatar) {
      nextAvatar = resolved;
      changed = true;
    }
  }

  if (needsMaster) {
    const resolved = await resolveStablePortraitUrl({
      userId: profileId,
      currentUrl: row.photo_url,
      incomingUrl: freshTelegramUrl,
      target: 'master',
    });
    if (resolved && resolved !== nextMasterPhoto) {
      nextMasterPhoto = resolved;
      changed = true;
    } else if (resolved && !nextMasterPhoto) {
      nextMasterPhoto = resolved;
      changed = true;
    }
  }

  if (!changed) return;

  if (needsAvatar && nextAvatar !== row.avatar_url?.trim()) {
    await query(
      `update public.profiles set avatar_url = $2, updated_at = now() where id = $1`,
      [profileId, nextAvatar],
    );
  }

  if (needsMaster && nextMasterPhoto !== row.photo_url?.trim()) {
    await query(
      `update public.master_profiles set
         photo_url = case
           when nullif(trim(photo_url), '') is null then $2
           when photo_url ~* '/storage/v1/object/public/' then photo_url
           else $2
         end,
         updated_at = now()
       where master_id = $1`,
      [profileId, nextMasterPhoto],
    );
  }
}
