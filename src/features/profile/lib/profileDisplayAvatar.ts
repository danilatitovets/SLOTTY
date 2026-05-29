import type { BackendProfile } from '../../auth/types';
import { optimizeAvatarUrl } from '../../../shared/lib/optimizeAvatarUrl';

/** Сгенерированные аватарки по имени — не считаем загруженным фото. */
export function isGeneratedPlaceholderAvatarUrl(url: string | null | undefined): boolean {
  const u = url?.trim().toLowerCase();
  if (!u) return false;
  if (u.includes('ui-avatars.com')) return true;
  if (u.includes('dicebear.com')) return true;
  if (u.includes('robohash.org')) return true;
  if (u.includes('avatar.iran.liara.run')) return true;
  return false;
}

/** Портрет из Telegram CDN (не ссылка на профиль t.me/username). */
export function isTelegramPortraitUrl(url: string | null | undefined): boolean {
  const raw = url?.trim();
  if (!raw || isGeneratedPlaceholderAvatarUrl(raw)) return false;
  const u = raw.toLowerCase();
  return (
    u.includes('telegram-cdn.org') ||
    u.includes('telesco.pe') ||
    /t\.me\/i\/userpic\//i.test(u)
  );
}

/** Файл, загруженный в Supabase Storage (POST /api/me/avatar). */
export function isSupabaseProfileAvatarUrl(url: string | null | undefined): boolean {
  const raw = url?.trim();
  if (!raw || isGeneratedPlaceholderAvatarUrl(raw)) return false;
  const u = raw.toLowerCase();
  if (!u.includes('/storage/v1/object/public/')) return false;
  return /\/avatar\.(jpe?g|png|webp)(\?|#|$)/i.test(u);
}

/** Реальное фото пользователя (загрузка / Telegram / OAuth), не генератор. */
export function isUserUploadedAvatarUrl(url: string | null | undefined): boolean {
  if (isSupabaseProfileAvatarUrl(url) || isTelegramPortraitUrl(url)) return true;
  const raw = url?.trim();
  if (!raw || isGeneratedPlaceholderAvatarUrl(raw)) return false;
  const u = raw.toLowerCase();
  if (u.includes('googleusercontent.com')) return true;
  return false;
}

/** Для онбординга: только Supabase-загрузка или портрет Telegram после сохранения. */
export function isOnboardingAvatarPhotoUrl(url: string | null | undefined): boolean {
  return isSupabaseProfileAvatarUrl(url) || isTelegramPortraitUrl(url);
}

/** Инициалы для плейсхолдера: фамилия + имя, иначе первая буква. */
export function profileDisplayInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    const first = [...parts[0]!][0];
    const second = [...parts[1]!][0];
    if (first && second) return `${first}${second}`.toLocaleUpperCase('ru-RU');
  }
  const first = [...(parts[0] ?? 'S')][0];
  return (first ?? 'S').toLocaleUpperCase('ru-RU');
}

/**
 * Единый URL аватара аккаунта из GET /api/me (`header_avatar_url`, fallback `avatar_url`).
 * Используйте в хедере, клиентском профиле и кабинете мастера.
 */
export function accountAvatarUrl(profile: BackendProfile | null | undefined): string | null {
  if (!profile) return null;
  const raw = (profile.header_avatar_url ?? profile.avatar_url)?.trim() || null;
  if (!raw || isGeneratedPlaceholderAvatarUrl(raw)) return null;
  return optimizeAvatarUrl(raw, 256) || raw;
}

/** @deprecated alias — accountAvatarUrl */
export function profileDisplayAvatarUrl(profile: BackendProfile | null | undefined): string | null {
  return accountAvatarUrl(profile);
}
