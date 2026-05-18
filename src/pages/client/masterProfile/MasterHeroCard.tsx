import type { ReactNode } from 'react';
import { HiCheckBadge, HiMapPin, HiHomeModern, HiStar } from 'react-icons/hi2';
import type { MasterLocation } from '../../../features/profile/model/masterLocation';
import { ImageReveal } from '../../../shared/ui/ImageReveal';
import { optimizeAvatarUrl } from '../../../shared/lib/optimizeAvatarUrl';
import { formatReviewsCountLabel } from '../../../features/services/model/demoMasters';
import { formatDistanceKm, haversineKm } from '../lib/catalogFormat';
import type { ExtendedMasterProfile } from './types';
import { formatMasterRoleLabel, visitChipLabel } from './masterProfileUtils';

type Props = {
  master: ExtendedMasterProfile;
  userLat: number | null;
  userLng: number | null;
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
  return (name[0] ?? 'M').toUpperCase();
}

/** Адрес для чипа без дублирования города. */
function formatHeroAddressChip(location: MasterLocation): string | null {
  const city = location.city?.trim();
  const street = location.street?.trim();
  if (!street || street === '—') return city || null;
  if (city && (street === city || street.startsWith(`${city},`) || street.startsWith(`${city} `))) {
    return street;
  }
  if (city) return `${city}, ${street}`;
  return street;
}

/** Короткая подпись района, если нет расстояния. */
function formatHeroDistrictShort(location: MasterLocation): string | null {
  const street = location.street?.trim();
  const city = location.city?.trim();
  if (street && street !== '—') {
    const s = street.length > 22 ? `${street.slice(0, 21)}…` : street;
    return s;
  }
  return city || null;
}

type HeroStat = {
  key: string;
  value: ReactNode;
  label: string;
};

export function MasterHeroCard({ master, userLat, userLng }: Props) {
  const lat = master.location.lat;
  const lng = master.location.lng;
  const distanceKm =
    userLat != null && userLng != null && lat != null && lng != null
      ? haversineKm(userLat, userLng, lat, lng)
      : null;
  const distanceLabel = formatDistanceKm(distanceKm);
  const addressChip = formatHeroAddressChip(master.location);
  const showVerified = master.rating >= 4.5 && master.reviewsCount >= 10;

  const hasRating = master.rating > 0;
  const hasReviews = master.reviewsCount > 0;
  const isNewMaster = !hasRating && !hasReviews;

  const stats: HeroStat[] = [];

  if (isNewMaster) {
    stats.push({
      key: 'new',
      value: <span className="text-[#F47C8C]">Новый</span>,
      label: 'мастер',
    });
  } else {
    if (hasRating) {
      stats.push({
        key: 'rating',
        value: (
          <span className="inline-flex items-center justify-center gap-0.5">
            <HiStar className="h-4 w-4 text-[#F47C8C]" aria-hidden />
            {master.rating.toFixed(1)}
          </span>
        ),
        label: hasReviews
          ? formatReviewsCountLabel(master.reviewsCount)
          : 'Пока нет отзывов',
      });
    } else if (hasReviews) {
      stats.push({
        key: 'reviews',
        value: formatReviewsCountLabel(master.reviewsCount),
        label: 'отзывы',
      });
    }
  }

  if (distanceLabel) {
    stats.push({
      key: 'distance',
      value: distanceLabel,
      label: 'от вас',
    });
  } else {
    const district = formatHeroDistrictShort(master.location);
    if (district) {
      stats.push({
        key: 'district',
        value: district,
        label: 'район',
      });
    }
  }

  const gridCols =
    stats.length >= 3 ? 'grid-cols-3' : stats.length === 2 ? 'grid-cols-2' : 'grid-cols-1';

  return (
    <section className="flex gap-4">
      <div className="relative shrink-0">
        <div className="h-[7.5rem] w-[7.5rem] overflow-hidden rounded-[24px] bg-[#FFF1F4] shadow-[0_10px_28px_rgba(244,124,140,0.12)]">
          {master.photoUrl ? (
            <ImageReveal
              src={optimizeAvatarUrl(master.photoUrl, 400)}
              alt=""
              className="h-full w-full object-cover"
              loading="eager"
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-[28px] font-bold text-[#F47C8C]">
              {initials(master.masterName)}
            </span>
          )}
        </div>
      </div>

      <div className="min-w-0 flex-1 pt-0.5">
        <div className="flex items-start gap-1.5">
          <h1 className="text-[26px] font-semibold leading-tight tracking-tight text-[#111827]">
            {master.masterName}
          </h1>
          {showVerified ? (
            <HiCheckBadge className="mt-1 h-5 w-5 shrink-0 text-[#F47C8C]" aria-label="Проверенный мастер" />
          ) : null}
        </div>
        <p className="mt-0.5 text-[14px] font-medium text-[#6B7280]">{formatMasterRoleLabel(master.category)}</p>

        {stats.length > 0 ? (
          <div className={`mt-3 grid ${gridCols} gap-2 text-center`}>
            {stats.map((s) => (
              <div key={s.key}>
                <p className="text-[15px] font-semibold leading-snug text-[#111827]">{s.value}</p>
                <p className="mt-0.5 text-[11px] text-[#9CA3AF]">{s.label}</p>
              </div>
            ))}
          </div>
        ) : null}

        {(addressChip || master.location.visitType) && (
          <div className="mt-3 flex flex-wrap gap-2">
            {addressChip ? (
              <span className="inline-flex max-w-full items-center gap-1 rounded-full bg-[#F1EFEF] px-3 py-1.5 text-[12px] font-medium text-[#374151]">
                <HiMapPin className="h-3.5 w-3.5 shrink-0 text-[#9CA3AF]" aria-hidden />
                <span className="truncate">{addressChip}</span>
              </span>
            ) : null}
            <span className="inline-flex items-center gap-1 rounded-full bg-[#F1EFEF] px-3 py-1.5 text-[12px] font-medium text-[#374151]">
              <HiHomeModern className="h-3.5 w-3.5 text-[#9CA3AF]" aria-hidden />
              {visitChipLabel(master.location.visitType)}
            </span>
          </div>
        )}
      </div>
    </section>
  );
}
