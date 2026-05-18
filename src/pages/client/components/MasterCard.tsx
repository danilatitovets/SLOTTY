import { Link } from 'react-router-dom';
import { HiHeart, HiStar } from 'react-icons/hi2';
import { getBookingPath, getMasterPath } from '../../../app/paths';
import type { ServiceListingRecord } from '../../../features/services/model/demoMasters';
import {
  formatNearestSlotLabel,
  formatPriceFrom,
  formatReviewsCountLabel,
  formatDistanceKm,
  listingDistanceKm,
  visitFormatLabel,
  isSlotToday,
} from '../lib/catalogFormat';
import { clientCard, clientPinkBtn } from '../clientTheme';
import { ImageReveal } from '../../../shared/ui/ImageReveal';
import { useCallback, useState } from 'react';
import {
  addMyFavoriteMaster,
  removeMyFavoriteMaster,
} from '../../../features/profile/api/clientFavorites';
import {
  isFavoriteMasterId,
  toggleFavoriteMasterId,
} from '../../../features/profile/lib/favoriteMastersStorage';

type Props = {
  listing: ServiceListingRecord;
  userLat: number | null;
  userLng: number | null;
  compact?: boolean;
};

export function MasterCard({ listing, userLat, userLng, compact }: Props) {
  const [fav, setFav] = useState(() => isFavoriteMasterId(listing.masterId));
  const km = listingDistanceKm(listing, userLat, userLng);
  const dist = formatDistanceKm(km);
  const slot = formatNearestSlotLabel(listing.nextSlotStartsAt);
  const district =
    listing.location.street && listing.location.street !== '—'
      ? listing.location.street
      : listing.location.city ?? null;

  const onToggleFav = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const next = toggleFavoriteMasterId(listing.masterId);
      setFav(next);
      try {
        if (next) await addMyFavoriteMaster(listing.masterId);
        else await removeMyFavoriteMaster(listing.masterId);
      } catch {
        /* local state kept */
      }
    },
    [listing.masterId],
  );

  return (
    <article className={`${clientCard} overflow-hidden`}>
      <Link to={getMasterPath(listing.masterId)} className="block p-4 pb-3">
        <div className="flex gap-3">
          <ImageReveal
            src={listing.photoUrl}
            alt=""
            className={`${compact ? 'h-16 w-16' : 'h-20 w-20'} shrink-0 rounded-[22px] object-cover`}
            loading="lazy"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="text-[18px] font-semibold leading-tight text-[#111827]">
                  {listing.masterName}
                </h3>
                <p className="mt-0.5 text-[13px] text-[#6B7280]">Мастер · {listing.category}</p>
              </div>
              <button
                type="button"
                onClick={onToggleFav}
                aria-label={fav ? 'Убрать из избранного' : 'В избранное'}
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition ${
                  fav ? 'bg-[#FFF1F4] text-[#F47C8C]' : 'bg-[#FAFAFA] text-[#9CA3AF]'
                }`}
              >
                <HiHeart className={`h-5 w-5 ${fav ? 'fill-current' : ''}`} />
              </button>
            </div>

            <p className="mt-2 flex flex-wrap items-center gap-x-1 text-[13px] text-[#374151]">
              <HiStar className="h-4 w-4 text-amber-400" aria-hidden />
              <span className="font-semibold">{listing.rating.toFixed(1)}</span>
              <span className="text-[#9CA3AF]">·</span>
              <span>{formatReviewsCountLabel(listing.reviewsCount)}</span>
              {dist ? (
                <>
                  <span className="text-[#9CA3AF]">·</span>
                  <span>{dist}</span>
                </>
              ) : district ? (
                <>
                  <span className="text-[#9CA3AF]">·</span>
                  <span className="truncate">{district}</span>
                </>
              ) : null}
            </p>

            <p className="mt-1 text-[13px] text-[#6B7280]">{visitFormatLabel(listing)}</p>

            {slot ? (
              <p className="mt-2 text-[14px] font-semibold text-[#111827]">{slot}</p>
            ) : null}
            {isSlotToday(listing.nextSlotStartsAt) ? (
              <p className="text-[12px] font-medium text-[#22C55E]">Свободно сегодня</p>
            ) : null}

            <p className="mt-1 text-[15px] font-semibold text-[#F47C8C]">
              {formatPriceFrom(listing.priceFrom)}
            </p>
          </div>
        </div>

        {!compact ? (
          <div className="mt-3 flex gap-2">
            {[listing.photoUrl, listing.photoUrl, listing.photoUrl].map((src, i) => (
              <ImageReveal
                key={i}
                src={src}
                alt=""
                className="h-14 flex-1 rounded-2xl object-cover opacity-90"
                loading="lazy"
              />
            ))}
          </div>
        ) : null}
      </Link>

      <div className="px-4 pb-4">
        <Link
          to={getBookingPath(
            listing.masterId,
            listing.primaryServiceId ?? null,
            listing.nextSlotId ?? null,
            { from: 'services' },
          )}
          className={`${clientPinkBtn} w-full`}
        >
          Записаться
        </Link>
      </div>
    </article>
  );
}
