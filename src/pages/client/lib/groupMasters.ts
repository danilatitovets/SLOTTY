import type { ServiceListingRecord } from '../../../features/services/model/demoMasters';
import { listingDistanceKm } from './catalogFormat';

export function groupListingsByMaster(listings: ServiceListingRecord[]): ServiceListingRecord[] {
  const map = new Map<string, ServiceListingRecord>();
  for (const row of listings) {
    const prev = map.get(row.masterId);
    if (!prev) {
      map.set(row.masterId, row);
      continue;
    }
    const betterRating = row.rating > prev.rating;
    const moreReviews = row.reviewsCount > prev.reviewsCount;
    const sooner =
      row.nextSlotStartsAt &&
      (!prev.nextSlotStartsAt ||
        new Date(row.nextSlotStartsAt).getTime() < new Date(prev.nextSlotStartsAt).getTime());
    if (betterRating || moreReviews || sooner) map.set(row.masterId, row);
  }
  return [...map.values()];
}

export function sortMastersByDistance(
  listings: ServiceListingRecord[],
  userLat: number | null,
  userLng: number | null,
): ServiceListingRecord[] {
  if (userLat == null || userLng == null) return listings;
  return [...listings].sort((a, b) => {
    const da = listingDistanceKm(a, userLat, userLng) ?? Number.POSITIVE_INFINITY;
    const db = listingDistanceKm(b, userLat, userLng) ?? Number.POSITIVE_INFINITY;
    return da - db;
  });
}
