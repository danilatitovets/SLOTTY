import {
  masterTopClientsCount,
  masterTopRankScore,
} from '../../../features/masters/lib/masterTopScore';
import type { ServiceListingRecord } from '../../../features/services/model/demoMasters';
import { isSlotToday } from './catalogFormat';

export type MastersTopRankSection = {
  id: 'week' | 'month' | 'rating' | 'reviews' | 'new';
  title: string;
  subtitle: string;
  items: ServiceListingRecord[];
};

function takeTop(
  source: ServiceListingRecord[],
  limit: number,
): ServiceListingRecord[] {
  return source.slice(0, limit);
}

function weekScore(m: ServiceListingRecord): number {
  const slotBoost = m.nextSlotStartsAt
    ? isSlotToday(m.nextSlotStartsAt)
      ? 18
      : 8
    : 0;
  return (
    m.rating * 14 +
    Math.min(m.reviewsCount, 30) * 2.2 +
    slotBoost +
    (m.isVerified ? 6 : 0) +
    (m.isProEntitled ? 2 : 0)
  );
}

function monthScore(m: ServiceListingRecord): number {
  const clients = masterTopClientsCount(m);
  return (
    m.rating * 16 +
    Math.log10(clients + 1) * 28 +
    m.reviewsCount * 1.8 +
    (m.isVerified ? 5 : 0) +
    (m.nextSlotStartsAt ? 4 : 0)
  );
}

function isLikelyNew(m: ServiceListingRecord): boolean {
  return m.reviewsCount <= 3 && m.rating >= 4.3;
}

function pushSection(
  sections: MastersTopRankSection[],
  section: MastersTopRankSection,
): void {
  if (section.items.length === 0) return;
  sections.push(section);
}

export function buildMastersTopRankSections(masters: ServiceListingRecord[]): MastersTopRankSection[] {
  if (masters.length === 0) return [];

  const sections: MastersTopRankSection[] = [];

  const weekItems = takeTop(
    [...masters]
      .filter((m) => m.rating > 0 || m.reviewsCount > 0 || m.nextSlotStartsAt)
      .sort((a, b) => weekScore(b) - weekScore(a)),
    8,
  );
  pushSection(sections, {
    id: 'week',
    title: 'Топ недели',
    subtitle: '',
    items: weekItems,
  });

  const monthItems = takeTop(
    [...masters].sort((a, b) => monthScore(b) - monthScore(a)),
    8,
  );
  pushSection(sections, {
    id: 'month',
    title: 'Топ месяца',
    subtitle: '',
    items: monthItems,
  });

  const ratingItems = takeTop(
    [...masters]
      .filter((m) => m.rating > 0)
      .sort((a, b) => b.rating - a.rating || b.reviewsCount - a.reviewsCount),
    6,
  );
  pushSection(sections, {
    id: 'rating',
    title: 'Лучший рейтинг',
    subtitle: 'Мастера с высокими оценками и подтверждёнными отзывами',
    items: ratingItems,
  });

  const reviewsItems = takeTop(
    [...masters]
      .filter((m) => m.reviewsCount >= 1)
      .sort((a, b) => b.reviewsCount - a.reviewsCount || b.rating - a.rating),
    6,
  );
  pushSection(sections, {
    id: 'reviews',
    title: 'Больше всего отзывов',
    subtitle: 'Проверенные мастера с большим числом мнений клиентов',
    items: reviewsItems,
  });

  const newItems = takeTop(
    [...masters].filter(isLikelyNew).sort((a, b) => masterTopRankScore(b) - masterTopRankScore(a)),
    6,
  );
  if (newItems.length >= 1) {
    pushSection(sections, {
      id: 'new',
      title: 'Новые звёзды',
      subtitle: 'Недавно на Slotty — уже с хорошими оценками и свободными окнами',
      items: newItems,
    });
  }

  return sections;
}
