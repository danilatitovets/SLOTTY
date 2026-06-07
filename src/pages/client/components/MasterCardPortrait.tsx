import type { ReactNode } from 'react';
import {
  masterCardAvatarColor,
  masterCardInitials,
  masterListingPortraitUrl,
} from '../../../features/masters/lib/masterListingPortrait';
import { ImageReveal } from '../../../shared/ui/ImageReveal';

type Props = {
  masterName: string;
  photoUrl?: string | null;
  className?: string;
  imageClassName?: string;
  loading?: 'lazy' | 'eager';
  badge?: ReactNode;
  photoMaxEdge?: number;
};

/** Портрет мастера в карточке: своё фото или цветной плейсхолдер с инициалами (без Google). */
export function MasterCardPortrait({
  masterName,
  photoUrl,
  className = 'relative h-full w-full',
  imageClassName = 'h-full w-full rounded-[14px] object-cover',
  loading = 'lazy',
  badge,
  photoMaxEdge,
}: Props) {
  const src = masterListingPortraitUrl(photoUrl, photoMaxEdge);

  if (src) {
    return (
      <div className={className}>
        <ImageReveal src={src} alt="" className={imageClassName} loading={loading} />
        {badge}
      </div>
    );
  }

  const rounded =
    imageClassName.includes('rounded-full')
      ? 'rounded-full'
      : imageClassName.match(/rounded-\[[^\]]+\]|rounded-\w+/)?.[0] ?? 'rounded-[14px]';

  return (
    <div className={className}>
      <span
        className={`flex h-full w-full items-center justify-center text-[22px] font-bold text-white ${rounded}`}
        style={{ backgroundColor: masterCardAvatarColor(masterName) }}
      >
        {masterCardInitials(masterName)}
      </span>
      {badge}
    </div>
  );
}
