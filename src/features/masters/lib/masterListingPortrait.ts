import {
  isGeneratedPlaceholderAvatarUrl,
  isSupabaseProfileAvatarUrl,
  isTelegramPortraitUrl,
  profileDisplayInitials,
} from '../../profile/lib/profileDisplayAvatar';
import { optimizeAvatarUrl } from '../../../shared/lib/optimizeAvatarUrl';

/** Портрет из Google OAuth — в карточках каталога не показываем, только наш плейсхолдер. */
export function isGoogleOAuthAvatarUrl(url: string | null | undefined): boolean {
  const u = url?.trim().toLowerCase();
  if (!u) return false;
  return u.includes('googleusercontent.com') || u.includes('ggpht.com');
}

/** Загруженное фото мастера (кабинет / Telegram), не генератор и не Google. */
export function isMasterCardPortraitUrl(url: string | null | undefined): boolean {
  const raw = url?.trim();
  if (!raw || isGeneratedPlaceholderAvatarUrl(raw) || isGoogleOAuthAvatarUrl(raw)) return false;
  if (isTelegramPortraitUrl(raw) || isSupabaseProfileAvatarUrl(raw)) return true;
  const u = raw.toLowerCase();
  return u.includes('/storage/v1/object/public/') && u.includes('/masters/');
}

/** URL для `<img>` в карточке листинга; пустая строка → плейсхолдер с инициалами. */
export function masterListingPortraitUrl(photoUrl: string | null | undefined): string {
  const raw = photoUrl?.trim();
  if (!raw || !isMasterCardPortraitUrl(raw)) return '';
  return optimizeAvatarUrl(raw, 256) || raw;
}

const MASTER_CARD_AVATAR_COLORS = [
  '#5B7FD4',
  '#F47C8C',
  '#7C6FD6',
  '#3B9B8F',
  '#D97B35',
  '#5A9FD4',
  '#C45C8A',
  '#6B8E6B',
] as const;

export function masterCardAvatarColor(displayName: string): string {
  const name = displayName.trim() || 'Мастер';
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = (hash + name.charCodeAt(i)) | 0;
  }
  return MASTER_CARD_AVATAR_COLORS[Math.abs(hash) % MASTER_CARD_AVATAR_COLORS.length]!;
}

export { profileDisplayInitials as masterCardInitials };
