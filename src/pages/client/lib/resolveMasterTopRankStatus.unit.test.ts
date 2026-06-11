import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
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
      visitType: 'at_home',
      street: 'ул. Тест',
      building: '1',
    },
    priceFrom: 50,
    photoUrl: '',
    ...overrides,
  };
}

describe('resolveMasterTopRankStatus', () => {
  it('returns empty when master is not in catalog', () => {
    const status = resolveMasterTopRankStatus('missing', [listing('other')]);
    assert.deepEqual(status.achievements, []);
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

    assert.equal(week?.meta, 'В топе');
    assert.equal(week?.podiumRank, null);
    assert.equal(week?.catalogRank, 4);
  });

  it('does not show «1 место» on card even for first rank', () => {
    const masters = [
      listing('target', { rating: 5, reviewsCount: 30, nextSlotStartsAt: new Date().toISOString() }),
      listing('b', { rating: 4.5, reviewsCount: 2 }),
      listing('c', { rating: 4.2, reviewsCount: 1 }),
    ];

    const status = resolveMasterTopRankStatus('target', masters);
    const week = status.achievements.find((item) => item.id === 'week');

    assert.equal(week?.meta, 'В топе');
    assert.equal(week?.podiumRank, 1);
    assert.ok(week?.tooltipBody.includes('1-е место'));
  });

  it('skips competitive achievements when catalog is too small', () => {
    const masters = [
      listing('target', { rating: 5, reviewsCount: 2 }),
      listing('b', { rating: 4.2, reviewsCount: 1 }),
    ];

    assert.ok(masters.length < MIN_ACHIEVEMENT_CATALOG_PEERS);

    const status = resolveMasterTopRankStatus('target', masters);
    assert.equal(status.achievements.some((item) => item.id === 'week'), false);
    assert.equal(status.achievements.some((item) => item.id === 'rating'), true);
    assert.equal(status.achievements.some((item) => item.id === 'reviews'), true);
    assert.equal(status.achievements.some((item) => item.id === 'new'), true);
    assert.equal(status.achievements.find((item) => item.id === 'rating')?.title, 'Высокий рейтинг');
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

    assert.equal(rating?.meta, '5.0');
    assert.equal(reviews?.meta, '2 отзыва');
  });

  it('skips rating achievement without rating data', () => {
    const masters = [
      listing('target', { rating: 0, reviewsCount: 0, nextSlotStartsAt: new Date().toISOString() }),
      listing('b', { rating: 4, reviewsCount: 1 }),
      listing('c', { rating: 3.5, reviewsCount: 1 }),
    ];

    const status = resolveMasterTopRankStatus('target', masters);
    assert.equal(status.achievements.some((item) => item.id === 'rating'), false);
  });

  it('uses profile fallback when catalog is too small and competitive sections are empty', () => {
    const masters = [listing('target', { rating: 5, reviewsCount: 2 })];

    const status = resolveMasterTopRankStatus('target', masters);
    assert.deepEqual(status.achievements.map((item) => item.id).sort(), ['new', 'rating', 'reviews']);
  });
});
