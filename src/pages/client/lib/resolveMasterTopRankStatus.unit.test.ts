import { describe, expect, it } from 'vitest';
import type { ServiceListingRecord } from '../../../features/services/model/demoMasters';
import {
  MIN_ACHIEVEMENT_CATALOG_PEERS,
  resolveMasterTopRankStatus,
} from './resolveMasterTopRankStatus';

function listing(
  masterId: string,
  overrides: Partial<ServiceListingRecord> = {},
): ServiceListingRecord {
  return {
    id: `${masterId}-listing`,
    masterId,
    masterName: `Master ${masterId}`,
    category: 'Маникюр',
    categoryCode: 'manicure',
    serviceName: 'Услуга',
    rating: 4.8,
    reviewsCount: 5,
    location: {
      city: 'Минск',
      street: 'ул. Тест',
      visitType: 'at_home',
    },
    priceFrom: 50,
    photoUrl: null,
    ...overrides,
  };
}

describe('resolveMasterTopRankStatus', () => {
  it('returns empty when master is not in catalog', () => {
    const status = resolveMasterTopRankStatus('missing', [listing('other')]);
    expect(status.achievements).toEqual([]);
  });

  it('uses «В топе» meta for week/month regardless of rank', () => {
    const masters = [
      listing('a', { rating: 5, reviewsCount: 20 }),
      listing('b', { rating: 4.9, reviewsCount: 15 }),
      listing('c', { rating: 4.8, reviewsCount: 10 }),
      listing('target', { rating: 4.7, reviewsCount: 8 }),
    ];

    const status = resolveMasterTopRankStatus('target', masters);
    const week = status.achievements.find((item) => item.id === 'week');

    expect(week?.meta).toBe('В топе');
    expect(week?.podiumRank).toBeNull();
    expect(week?.catalogRank).toBe(4);
  });

  it('does not show «1 место» on card even for first rank', () => {
    const masters = [
      listing('target', { rating: 5, reviewsCount: 30, nextSlotStartsAt: new Date().toISOString() }),
      listing('b', { rating: 4.5, reviewsCount: 2 }),
      listing('c', { rating: 4.2, reviewsCount: 1 }),
    ];

    const status = resolveMasterTopRankStatus('target', masters);
    const week = status.achievements.find((item) => item.id === 'week');

    expect(week?.meta).toBe('В топе');
    expect(week?.podiumRank).toBe(1);
    expect(week?.tooltipBody).toContain('1-е место');
  });

  it('skips competitive achievements when catalog is too small', () => {
    const masters = [
      listing('target', { rating: 5, reviewsCount: 2 }),
      listing('b', { rating: 4.2, reviewsCount: 1 }),
    ];

    expect(masters.length).toBeLessThan(MIN_ACHIEVEMENT_CATALOG_PEERS);

    const status = resolveMasterTopRankStatus('target', masters);
    expect(status.achievements.some((item) => item.id === 'week')).toBe(false);
    expect(status.achievements.some((item) => item.id === 'rating')).toBe(true);
    expect(status.achievements.some((item) => item.id === 'reviews')).toBe(true);
    expect(status.achievements.some((item) => item.id === 'new')).toBe(true);
    expect(status.achievements.find((item) => item.id === 'rating')?.title).toBe('Высокий рейтинг');
  });

  it('uses real rating and reviews in meta when enough peers', () => {
    const masters = [
      listing('target', { rating: 5, reviewsCount: 2 }),
      listing('b', { rating: 4.2, reviewsCount: 1 }),
      listing('c', { rating: 4.0, reviewsCount: 1 }),
    ];

    const status = resolveMasterTopRankStatus('target', masters);
    const rating = status.achievements.find((item) => item.id === 'rating');
    const reviews = status.achievements.find((item) => item.id === 'reviews');

    expect(rating?.meta).toBe('5.0');
    expect(reviews?.meta).toBe('2 отзыва');
  });

  it('skips rating achievement without rating data', () => {
    const masters = [
      listing('target', { rating: 0, reviewsCount: 0, nextSlotStartsAt: new Date().toISOString() }),
      listing('b', { rating: 4, reviewsCount: 1 }),
      listing('c', { rating: 3.5, reviewsCount: 1 }),
    ];

    const status = resolveMasterTopRankStatus('target', masters);
    expect(status.achievements.some((item) => item.id === 'rating')).toBe(false);
  });

  it('uses profile fallback when catalog is too small and competitive sections are empty', () => {
    const masters = [listing('target', { rating: 5, reviewsCount: 2 })];

    const status = resolveMasterTopRankStatus('target', masters);
    expect(status.achievements.map((item) => item.id).sort()).toEqual(['new', 'rating', 'reviews']);
  });
});
