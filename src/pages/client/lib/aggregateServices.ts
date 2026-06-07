import type { ServiceCategoryDto } from '../../../features/master-onboarding/api/becomeMasterApi';
import type { ServiceListingRecord } from '../../../features/services/model/demoMasters';
import { isSlotToday } from './catalogFormat';

export type AggregatedServiceCard = {
  id: string;
  categoryCode: string;
  categoryName: string;
  /** Название услуги мастера */
  title: string;
  /** Имя мастера */
  subtitle: string;
  masterId: string;
  masterName: string;
  primaryServiceId?: string;
  nextSlotId?: string | null;
  photoUrl?: string;
  serviceCoverUrl?: string;
  minPrice: number;
  durationMinutes: number;
  /** Всегда 1 для карточки конкретной услуги */
  masterCount: number;
  nearestSlotIso: string | null;
  hasToday: boolean;
  promotionOnly: boolean;
  badge: 'popular' | 'hit' | 'sale' | null;
  promoText: string | null;
  avgRating: number;
  totalReviews: number;
  tags: string[];
  isNew: boolean;
  /** Оценка просмотров за 7 дней (клиентский скоринг до API). */
  weeklyViews: number;
};

function resolveCategoryCode(
  row: ServiceListingRecord,
  categories: ServiceCategoryDto[],
): string {
  if (row.categoryCode?.trim()) return row.categoryCode.trim();
  const match =
    categories.find((c) => c.name === row.category) ??
    categories.find((c) => row.category.toLowerCase().includes(c.name.toLowerCase()));
  return match?.code ?? row.category.toLowerCase().replace(/\s+/g, '-');
}

function parseDurationMinutes(serviceName: string): number {
  const m = serviceName.match(/(\d+)\s*мин/);
  if (m) return Number(m[1]);
  const h = serviceName.match(/(\d+)\s*ч/);
  if (h) return Number(h[1]) * 60;
  return 90;
}

function estimateWeeklyViews(input: {
  totalReviews: number;
  hasToday: boolean;
  badge: AggregatedServiceCard['badge'];
  avgRating: number;
}): number {
  const base =
    140 +
    input.totalReviews * 22 +
    Math.round(input.avgRating * 45) +
    (input.hasToday ? 120 : 0) +
    (input.badge === 'popular' ? 260 : input.badge === 'hit' ? 180 : input.badge === 'sale' ? 90 : 0);

  return Math.max(48, base);
}

function listingBadge(row: ServiceListingRecord, hasToday: boolean): {
  badge: AggregatedServiceCard['badge'];
  promoText: string | null;
  promotionOnly: boolean;
} {
  let badge: AggregatedServiceCard['badge'] = null;
  let promoText: string | null = null;

  if (row.reviewsCount > 50 && row.rating >= 4.8) {
    badge = 'popular';
  } else if (hasToday && row.rating >= 4.5) {
    badge = 'hit';
  }

  if (!badge && hasToday && row.priceFrom > 0 && row.priceFrom <= 55) {
    badge = 'sale';
    promoText = '-10% на первое посещение';
  }

  return { badge, promoText, promotionOnly: badge === 'sale' };
}

/** Одна карточка каталога = одна услуга конкретного мастера. */
export function mapListingsToServiceCards(
  listings: ServiceListingRecord[],
  categories: ServiceCategoryDto[],
): AggregatedServiceCard[] {
  return listings
    .map((row) => {
      const categoryCode = resolveCategoryCode(row, categories);
      const categoryName =
        categories.find((c) => c.code === categoryCode)?.name ?? row.category;
      const hasToday = row.nextSlotStartsAt ? isSlotToday(row.nextSlotStartsAt) : false;
      const { badge, promoText, promotionOnly } = listingBadge(row, hasToday);
      const avgRating = Math.round(row.rating * 10) / 10;

      return {
        id: row.id,
        categoryCode,
        categoryName,
        title: row.serviceName,
        subtitle: row.masterName,
        masterId: row.masterId,
        masterName: row.masterName,
        primaryServiceId: row.primaryServiceId,
        nextSlotId: row.nextSlotId,
        photoUrl: row.photoUrl,
        serviceCoverUrl: row.serviceCoverUrl,
        minPrice: row.priceFrom,
        durationMinutes: parseDurationMinutes(row.serviceName),
        masterCount: 1,
        nearestSlotIso: row.nextSlotStartsAt ?? null,
        hasToday,
        promotionOnly,
        badge,
        promoText,
        avgRating,
        totalReviews: row.reviewsCount,
        tags: categoryName ? [categoryName] : [],
        isNew: row.reviewsCount < 10,
        weeklyViews: estimateWeeklyViews({
          totalReviews: row.reviewsCount,
          hasToday,
          badge,
          avgRating: row.rating,
        }),
      };
    })
    .sort((a, b) => {
      const slotA = a.nearestSlotIso ? new Date(a.nearestSlotIso).getTime() : Number.POSITIVE_INFINITY;
      const slotB = b.nearestSlotIso ? new Date(b.nearestSlotIso).getTime() : Number.POSITIVE_INFINITY;
      if (slotA !== slotB) return slotA - slotB;
      if (b.avgRating !== a.avgRating) return b.avgRating - a.avgRating;
      return b.totalReviews - a.totalReviews;
    });
}

/** @deprecated Используйте mapListingsToServiceCards */
export function aggregateServicesByCategory(
  listings: ServiceListingRecord[],
  categories: ServiceCategoryDto[],
): AggregatedServiceCard[] {
  return mapListingsToServiceCards(listings, categories);
}
