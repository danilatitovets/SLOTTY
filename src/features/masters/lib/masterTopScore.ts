import type { ServiceListingRecord } from '../../services/model/demoMasters';

function logBoost(value: number, weight: number): number {
  return Math.log10(Math.max(0, value) + 1) * weight;
}

/** Число клиентов/записей для ранжирования: с бэка или оценка по отзывам. */
export function masterTopClientsCount(listing: ServiceListingRecord): number {
  const fromApi = listing.completedBookingsCount;
  if (fromApi != null && Number.isFinite(fromApi) && fromApi > 0) {
    return Math.round(fromApi);
  }
  const reviews = Math.max(0, listing.reviewsCount ?? 0);
  if (reviews <= 0) return 0;
  return Math.max(Math.round(reviews * 2.4), reviews + 12);
}

/**
 * Сводный балл для блока «Топ мастера»:
 * рейтинг × отзывы × завершённые записи + небольшие бонусы (верификация, окно, портфолио).
 */
export function masterTopRankScore(listing: ServiceListingRecord): number {
  const rating = Number.isFinite(listing.rating) ? Math.max(0, listing.rating) : 0;
  const reviews = Math.max(0, listing.reviewsCount ?? 0);
  const clients = masterTopClientsCount(listing);

  const ratingPart = rating * 28;
  const reviewsPart = logBoost(reviews, 32);
  const clientsPart = logBoost(clients, 48);
  const verifiedBoost = listing.isVerified ? 10 : 0;
  const slotBoost = listing.nextSlotStartsAt ? 6 : 0;
  const portfolioCount = listing.portfolioTotal ?? listing.portfolioPreview?.length ?? 0;
  const portfolioBoost = portfolioCount > 0 ? 4 : 0;

  return ratingPart + reviewsPart + clientsPart + verifiedBoost + slotBoost + portfolioBoost;
}

export function compareMastersByTopRank(a: ServiceListingRecord, b: ServiceListingRecord): number {
  const scoreDiff = masterTopRankScore(b) - masterTopRankScore(a);
  if (scoreDiff !== 0) return scoreDiff;

  if (b.rating !== a.rating) return b.rating - a.rating;
  if (b.reviewsCount !== a.reviewsCount) return b.reviewsCount - a.reviewsCount;

  const clientsDiff = masterTopClientsCount(b) - masterTopClientsCount(a);
  if (clientsDiff !== 0) return clientsDiff;

  return a.masterName.localeCompare(b.masterName, 'ru');
}

export function sortMastersByTopRank(listings: ServiceListingRecord[]): ServiceListingRecord[] {
  return [...listings].sort(compareMastersByTopRank);
}
