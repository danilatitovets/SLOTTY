import type { ChangeEvent, RefObject } from 'react';
import { HiCamera } from 'react-icons/hi2';
import { optimizeAvatarUrl } from '../../../shared/lib/optimizeAvatarUrl';
import { ImageReveal } from '../../../shared/ui/ImageReveal';

const SIZE_CLASS = {
  sm: 'h-10 w-10 text-[13px] rounded-[12px]',
  md: 'h-16 w-16 text-[15px] rounded-[14px]',
  lg: 'h-24 w-24 text-[22px] rounded-[18px] sm:h-28 sm:w-28 sm:text-[26px] sm:rounded-[20px]',
} as const;

type Size = keyof typeof SIZE_CLASS;

type Props = {
  authLoading: boolean;
  isAuthenticated: boolean;
  avatarPreviewUrl: string | null;
  profileAvatarUrl: string | null;
  telegramPhotoUrl: string | null;
  profileInitials: string;
  avatarBusy: boolean;
  avatarFileInputRef: RefObject<HTMLInputElement>;
  onAvatarFileChange: (e: ChangeEvent<HTMLInputElement>) => void;
  size?: Size;
  showCameraHint?: boolean;
};

export function ClientProfileAvatar({
  authLoading,
  isAuthenticated,
  avatarPreviewUrl,
  profileAvatarUrl,
  telegramPhotoUrl,
  profileInitials,
  avatarBusy,
  avatarFileInputRef,
  onAvatarFileChange,
  size = 'sm',
  showCameraHint = false,
}: Props) {
  const sizeClass = SIZE_CLASS[size];

  if (authLoading) {
    return <div className={`${sizeClass} shrink-0 animate-pulse bg-[#EBEBEB]`} />;
  }

  const avatarSrc = avatarPreviewUrl
    ? avatarPreviewUrl
    : profileAvatarUrl
      ? profileAvatarUrl
      : telegramPhotoUrl
        ? optimizeAvatarUrl(telegramPhotoUrl, size === 'lg' ? 256 : 128)
        : null;

  return (
    <div className="relative shrink-0">
      <input
        ref={avatarFileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={onAvatarFileChange}
      />
      <button
        type="button"
        disabled={!isAuthenticated || avatarBusy}
        onClick={() => avatarFileInputRef.current?.click()}
        className={`${sizeClass} relative overflow-hidden bg-[#F47C8C] font-semibold text-white shadow-[0_8px_24px_rgba(244,124,140,0.28)] transition hover:opacity-95 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50`}
        aria-label="Загрузить фото профиля"
      >
        {avatarSrc ? (
          <ImageReveal src={avatarSrc} alt="" className="h-full w-full object-cover" loading="eager" />
        ) : (
          <span className="flex h-full w-full items-center justify-center tracking-tight">{profileInitials}</span>
        )}
        {showCameraHint && isAuthenticated ? (
          <span className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1 bg-black/45 py-1 text-[10px] font-semibold text-white sm:text-[11px]">
            <HiCamera className="h-3.5 w-3.5 shrink-0" aria-hidden />
            Фото
          </span>
        ) : null}
      </button>
      {avatarBusy ? (
        <span
          className="absolute inset-0 flex items-center justify-center rounded-[inherit] bg-white/60 text-[12px] font-semibold text-[#374151]"
          aria-hidden
        >
          …
        </span>
      ) : null}
    </div>
  );
}
