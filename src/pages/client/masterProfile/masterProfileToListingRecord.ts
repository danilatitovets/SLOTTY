import type { ServiceListingRecord } from '../../../features/services/model/demoMasters';
import type { ExtendedMasterProfile, NearestSlotInfo } from './types';

/** Карточка профиля для расчёта топа, если мастера нет в выборке каталога. */
export function masterProfileToListingRecord(
  master: ExtendedMasterProfile,
  nearest?: NearestSlotInfo | null,
): ServiceListingRecord {
  const prices = master.services.map((s) => s.price).filter((p) => Number.isFinite(p) && p >= 0);
  const minPrice = prices.length ? Math.min(...prices) : 0;
  const primary = master.services[0];

  return {
    id: `${master.masterId}-profile`,
    masterId: master.masterId,
    masterName: master.masterName,
    category: master.category,
    categoryCode: master.categoryCode,
    serviceName: primary?.title ?? 'Услуга',
    rating: master.rating,
    reviewsCount: master.reviewsCount,
    isVerified: Boolean(master.isVerified),
    location: master.location,
    priceFrom: minPrice,
    photoUrl: master.photoUrl,
    primaryServiceId: primary?.id,
    nextSlotStartsAt: nearest?.startsAt ?? null,
    nextSlotId: null,
    portfolioTotal: master.portfolio?.length ?? 0,
  };
}

/** Актуальные рейтинг и отзывы с профиля поверх записи каталога. */
export function mergeCatalogRecordsWithProfile(
  records: ServiceListingRecord[],
  self: ServiceListingRecord,
): ServiceListingRecord[] {
  const index = records.findIndex((row) => row.masterId === self.masterId);
  if (index < 0) return [...records, self];

  const existing = records[index];
  const merged: ServiceListingRecord = {
    ...existing,
    rating: Math.max(existing.rating, self.rating),
    reviewsCount: Math.max(existing.reviewsCount, self.reviewsCount),
    nextSlotStartsAt: self.nextSlotStartsAt ?? existing.nextSlotStartsAt,
    isVerified: existing.isVerified || self.isVerified,
    portfolioTotal: Math.max(existing.portfolioTotal ?? 0, self.portfolioTotal ?? 0),
  };

  return [...records.slice(0, index), merged, ...records.slice(index + 1)];
}
