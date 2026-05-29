import type { ReactNode } from 'react';
import type { BackendProfile } from '../../../features/auth/types';
import {
  masterCardAvatarColor,
  masterCardInitials,
  masterListingPortraitUrl,
} from '../../../features/masters/lib/masterListingPortrait';
import { accountAvatarUrl } from '../../../features/profile/lib/profileDisplayAvatar';
import { ImageReveal } from '../../../shared/ui/ImageReveal';
import { ProfileAvatarImage, ProfileCoverImage, ProfileMediaFrame, ProfilePreviewImage } from './adminProfileMedia';

export function resolveMasterCabinetPortraitUrl(photoUrl?: string | null): string | null {
  const url = masterListingPortraitUrl(photoUrl);
  return url || null;
}

/** GET /api/me → header_avatar_url; иначе фото кабинета мастера. */
export function resolveAccountOrCabinetPortraitUrl(
  profile: BackendProfile | null | undefined,
  masterPhotoUrl?: string | null,
): string | null {
  const account = accountAvatarUrl(profile);
  if (account) return account;
  return resolveMasterCabinetPortraitUrl(masterPhotoUrl);
}

type AvatarProps = {
  name: string;
  photoUrl?: string | null;
  accountProfile?: BackendProfile | null;
  sizeClass?: string;
  ringClassName?: string;
  initialsClassName?: string;
};

/** Аватар кабинета: GET /api/me, иначе photo кабинета / инициалы. */
export function MasterCabinetAvatar({
  name,
  photoUrl,
  accountProfile,
  sizeClass = 'h-[88px] w-[88px]',
  ringClassName = 'ring-4 ring-white',
  initialsClassName = 'text-[clamp(22px,5vw,32px)]',
}: AvatarProps) {
  const displayName = name.trim() || 'Мастер';
  const src = resolveAccountOrCabinetPortraitUrl(accountProfile, photoUrl);

  if (src) {
    return (
      <ProfileAvatarImage
        src={src}
        alt=""
        sizeClass={sizeClass}
        ringClassName={ringClassName}
      />
    );
  }

  return (
    <div
      className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#F47C8C] ${sizeClass} ${ringClassName}`}
      style={{ backgroundColor: masterCardAvatarColor(displayName) }}
      role="img"
      aria-label={displayName}
    >
      <span className={`font-bold leading-none text-white ${initialsClassName}`}>
        {masterCardInitials(displayName)}
      </span>
    </div>
  );
}

type CoverProps = {
  name: string;
  dedicatedCoverUrl?: string | null;
  photoUrl?: string | null;
  accountProfile?: BackendProfile | null;
  heightClass?: string;
  aspectClass?: string;
  children?: ReactNode;
};

/** Обложка: загруженная обложка, иначе фото аккаунта / кабинета, иначе фон с инициалами. */
export function MasterCabinetCoverBanner({
  name,
  dedicatedCoverUrl,
  photoUrl,
  accountProfile,
  heightClass = 'h-[300px] sm:h-[320px]',
  aspectClass,
  children,
}: CoverProps) {
  const displayName = name.trim() || 'Мастер';
  const cover = dedicatedCoverUrl?.trim();
  const portrait = resolveAccountOrCabinetPortraitUrl(accountProfile, photoUrl);
  const color = masterCardAvatarColor(displayName);
  const initials = masterCardInitials(displayName);

  if (cover) {
    if (aspectClass) {
      return (
        <div className="group relative">
          <ProfileCoverImage src={cover} alt="" aspectClass={aspectClass} frameClassName="bg-[#f0f1f5]" />
          {children}
        </div>
      );
    }
    return (
      <div className={`group relative w-full overflow-hidden bg-[#f0f1f5] ${heightClass}`}>
        <ImageReveal
          src={cover}
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-black/15 to-transparent"
          aria-hidden
        />
        {children}
      </div>
    );
  }

  if (portrait) {
    if (aspectClass) {
      return (
        <div className="group relative">
          <ProfileCoverImage src={portrait} alt="" aspectClass={aspectClass} frameClassName="bg-[#f0f1f5]" />
          {children}
        </div>
      );
    }
    return (
      <div className={`group relative w-full overflow-hidden bg-[#f0f1f5] ${heightClass}`}>
        <ImageReveal
          src={portrait}
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-black/15 to-transparent"
          aria-hidden
        />
        {children}
      </div>
    );
  }

  const placeholder = (
    <>
      <span
        className="pointer-events-none absolute inset-0 flex items-center justify-center font-bold text-white/25"
        style={{ fontSize: 'clamp(4rem, 18vw, 7rem)' }}
        aria-hidden
      >
        {initials}
      </span>
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-black/15 to-transparent"
        aria-hidden
      />
    </>
  );

  if (aspectClass) {
    return (
      <div className="group relative">
        <div className="relative overflow-hidden" style={{ backgroundColor: color }}>
          <ProfileMediaFrame aspectClass={aspectClass}>{placeholder}</ProfileMediaFrame>
        </div>
        {children}
      </div>
    );
  }

  return (
    <div
      className={`group relative w-full overflow-hidden ${heightClass}`}
      style={{ backgroundColor: color }}
    >
      {placeholder}
      {children}
    </div>
  );
}

export function MasterCabinetPhotoPreview({
  name,
  photoUrl,
}: {
  name: string;
  photoUrl?: string | null;
}) {
  const displayName = name.trim() || 'Мастер';
  const src = resolveMasterCabinetPortraitUrl(photoUrl);

  if (src) {
    return <ProfilePreviewImage src={src} alt="" aspectClass="aspect-[16/10]" useReveal={false} />;
  }

  return (
    <div
      className="relative overflow-hidden rounded-[12px]"
      style={{ backgroundColor: masterCardAvatarColor(displayName) }}
    >
      <ProfileMediaFrame aspectClass="aspect-[16/10] flex items-center justify-center">
        <span className="text-[clamp(2.5rem,12vw,3.5rem)] font-bold text-white">
          {masterCardInitials(displayName)}
        </span>
      </ProfileMediaFrame>
    </div>
  );
}
