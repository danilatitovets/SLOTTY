import type { PoolClient } from 'pg';
import { withTransaction } from '../../config/db.js';
import { isProfileEmptyDuplicate, isProfileSubstantial } from './profileDuplicatePolicy.js';
import {
  isStablePortraitUrl,
  isTelegramPortraitUrl,
} from '../../lib/profileAvatarUrlPolicy.js';

export { isTelegramPortraitUrl };

/** Не затираем загруженный в Storage портрет при слиянии профилей. */
export function pickMergedAvatarUrl(
  current: string | null | undefined,
  incoming: string | null | undefined,
): string | null {
  const c = current?.trim() || null;
  const i = incoming?.trim() || null;
  if (isStablePortraitUrl(c)) return c;
  if (isStablePortraitUrl(i)) return i;
  if (i) return i;
  return c;
}

async function mergeProfilesRow(
  client: PoolClient,
  targetProfileId: string,
  sourceProfileId: string,
): Promise<void> {
  const r = await client.query<{
    tgt_name: string | null;
    tgt_phone: string | null;
    tgt_avatar: string | null;
    tgt_tg: string | null;
    tgt_tg_user: string | null;
    src_name: string | null;
    src_phone: string | null;
    src_avatar: string | null;
    src_tg: string | null;
    src_tg_user: string | null;
  }>(
    `select
       tgt.full_name as tgt_name,
       tgt.phone as tgt_phone,
       tgt.avatar_url as tgt_avatar,
       tgt.telegram_user_id::text as tgt_tg,
       tgt.telegram_username as tgt_tg_user,
       src.full_name as src_name,
       src.phone as src_phone,
       src.avatar_url as src_avatar,
       src.telegram_user_id::text as src_tg,
       src.telegram_username as src_tg_user
     from public.profiles tgt
     join public.profiles src on src.id = $2
    where tgt.id = $1`,
    [targetProfileId, sourceProfileId],
  );
  const row = r.rows[0];
  if (!row) return;

  const avatar = pickMergedAvatarUrl(row.tgt_avatar, row.src_avatar);

  await client.query(
    `update public.profiles set
       full_name = coalesce(nullif(trim($2), ''), nullif(trim(full_name), '')),
       phone = coalesce(nullif(trim($3), ''), nullif(trim(phone), '')),
       avatar_url = $4,
       telegram_user_id = coalesce(telegram_user_id, $5),
       telegram_username = coalesce(nullif(trim(telegram_username), ''), nullif(trim($6), '')),
       updated_at = now()
     where id = $1`,
    [
      targetProfileId,
      row.src_name,
      row.src_phone,
      avatar,
      row.src_tg,
      row.src_tg_user,
    ],
  );
}

async function mergeMasterProfilesRow(
  client: PoolClient,
  targetProfileId: string,
  sourceProfileId: string,
): Promise<void> {
  const exists = await client.query<{ tgt: boolean; src: boolean }>(
    `select
       exists (select 1 from public.master_profiles where master_id = $1) as tgt,
       exists (select 1 from public.master_profiles where master_id = $2) as src`,
    [targetProfileId, sourceProfileId],
  );
  if (!exists.rows[0]?.src) return;

  if (!exists.rows[0]?.tgt) {
    await client.query(
      `insert into public.master_profiles (
         master_id, display_name, slug, primary_category_id, bio, phone, contact, contacts,
         photo_url, publication_status, is_profile_active, rating_avg, reviews_count, global_buffer_minutes
       )
       select
         $1, display_name, slug, primary_category_id, bio, phone, contact, contacts,
         photo_url, publication_status, is_profile_active, rating_avg, reviews_count, global_buffer_minutes
         from public.master_profiles
        where master_id = $2
       on conflict (master_id) do nothing`,
      [targetProfileId, sourceProfileId],
    );
    return;
  }

  const photos = await client.query<{ tgt_photo: string | null; src_photo: string | null }>(
    `select
       tgt.photo_url as tgt_photo,
       src.photo_url as src_photo
     from public.master_profiles tgt
     join public.master_profiles src on src.master_id = $2
    where tgt.master_id = $1`,
    [targetProfileId, sourceProfileId],
  );
  const photo = pickMergedAvatarUrl(
    photos.rows[0]?.tgt_photo,
    photos.rows[0]?.src_photo,
  );

  await client.query(
    `update public.master_profiles tgt set
       display_name = coalesce(nullif(trim(tgt.display_name), ''), nullif(trim(src.display_name), '')),
       phone = coalesce(nullif(trim(tgt.phone), ''), nullif(trim(src.phone), '')),
       photo_url = coalesce(nullif(trim($3), ''), nullif(trim(tgt.photo_url), '')),
       bio = coalesce(nullif(trim(tgt.bio), ''), nullif(trim(src.bio), '')),
       contact = coalesce(nullif(trim(tgt.contact), ''), nullif(trim(src.contact), '')),
       contacts = case
         when tgt.contacts is not null and tgt.contacts::text <> 'null' and tgt.contacts::text <> '[]'
           then tgt.contacts
         else src.contacts
       end,
       updated_at = now()
     from public.master_profiles src
    where tgt.master_id = $1 and src.master_id = $2`,
    [targetProfileId, sourceProfileId, photo],
  );
}

/**
 * Переносит данные с «другого» profile.id на текущий аккаунт (привязка TG/Google, canonical).
 * Не удаляет source profile — только сливает поля и (опционально) identities снаружи.
 */
export async function mergeLinkedProfileIntoTarget(
  targetProfileId: string,
  sourceProfileId: string,
): Promise<void> {
  if (targetProfileId === sourceProfileId) return;

  const sourceEmpty = await isProfileEmptyDuplicate(sourceProfileId);
  const sourceSubstantial = await isProfileSubstantial(sourceProfileId);
  const targetSubstantial = await isProfileSubstantial(targetProfileId);

  if (sourceSubstantial && targetSubstantial && !sourceEmpty) {
    return;
  }

  await withTransaction(async (client) => {
    await mergeProfilesRow(client, targetProfileId, sourceProfileId);
    await mergeMasterProfilesRow(client, targetProfileId, sourceProfileId);
  });
}
