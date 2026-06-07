import { formatReviewsCountLabel } from '../../../features/services/model/demoMasters';
import type { ExtendedMasterProfile } from './types';
import type { NearestSlotInfo } from './types';

export type MasterProfileMetrics = {
  isNewMaster: boolean;
  ratingLabel: string | null;
  reviewsLabel: string | null;
  bookingsLabel: string | null;
  bookingsCount: number | null;
  showClientsTrust: boolean;
};

export function resolveMasterProfileMetrics(master: ExtendedMasterProfile): MasterProfileMetrics {
  const isNewMaster = master.reviewsCount <= 0 && master.rating <= 0;
  const bookingsCount =
    master.completedBookingsCount != null && master.completedBookingsCount > 0
      ? master.completedBookingsCount
      : null;

  return {
    isNewMaster,
    ratingLabel:
      !isNewMaster && master.rating > 0 ? master.rating.toFixed(1) : isNewMaster ? null : null,
    reviewsLabel: master.reviewsCount > 0 ? formatReviewsCountLabel(master.reviewsCount) : null,
    bookingsLabel: bookingsCount != null ? String(bookingsCount) : null,
    bookingsCount,
    showClientsTrust: bookingsCount != null && bookingsCount >= 20,
  };
}

export function resolveMinServicePrice(master: ExtendedMasterProfile): number | null {
  const prices = master.services
    .map((s) => s.price)
    .filter((p) => Number.isFinite(p) && p > 0);
  if (!prices.length) return null;
  return Math.min(...prices);
}

export function formatMinServicePriceLabel(price: number | null): string {
  if (price == null || price <= 0) return 'Уточните у мастера';
  return `от ${Math.round(price)} BYN`;
}

export function formatBookingsLabel(count: number): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  const word =
    mod10 === 1 && mod100 !== 11
      ? 'запись'
      : mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)
        ? 'записи'
        : 'записей';
  return `${count} ${word} выполнено`;
}

/** Короткая подпись для блока метрик профиля. */
export function formatBookingsStatLabel(count: number): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  const word =
    mod10 === 1 && mod100 !== 11
      ? 'запись'
      : mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)
        ? 'записи'
        : 'записей';
  return `${count} ${word}`;
}

export function nearestSlotShortLabel(nearest?: NearestSlotInfo | null): string | null {
  return nearest?.label?.trim() || null;
}
