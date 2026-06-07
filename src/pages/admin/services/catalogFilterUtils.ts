import type { ManagedService } from './servicesFormat';
import type { CatalogDurationFilter, CatalogFiltersState, CatalogSort } from './ServicesCatalogFiltersSheet';

function matchesDuration(minutes: number, duration: CatalogDurationFilter): boolean {
  if (duration === 'all') return true;
  if (duration === 'short') return minutes <= 30;
  if (duration === 'medium') return minutes >= 31 && minutes <= 90;
  return minutes > 90;
}

function sortCatalogServices(list: ManagedService[], sort: CatalogSort): ManagedService[] {
  const copy = [...list];
  switch (sort) {
    case 'title':
      return copy.sort((a, b) => a.title.localeCompare(b.title, 'ru'));
    case 'price_asc':
      return copy.sort((a, b) => a.priceByn - b.priceByn);
    case 'price_desc':
      return copy.sort((a, b) => b.priceByn - a.priceByn);
    case 'duration_asc':
      return copy.sort((a, b) => a.durationMin - b.durationMin);
    case 'duration_desc':
      return copy.sort((a, b) => b.durationMin - a.durationMin);
    default:
      return copy.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  }
}

export function filterCatalogServices(
  services: ManagedService[],
  query: string,
  filters: CatalogFiltersState,
): ManagedService[] {
  const q = query.trim().toLowerCase();

  const filtered = services.filter((s) => {
    if (filters.visibility === 'visible' && !s.isActive) return false;
    if (filters.visibility === 'hidden' && s.isActive) return false;

    const priceType = s.priceType ?? 'fixed';
    if (filters.price === 'fixed' && priceType === 'from') return false;
    if (
      filters.price === 'from' &&
      filters.priceFromMin != null &&
      s.priceByn < filters.priceFromMin
    ) {
      return false;
    }

    if (!matchesDuration(s.durationMin, filters.duration)) return false;

    if (!q) return true;
    const inTitle = s.title.toLowerCase().includes(q);
    const inDesc = s.description?.toLowerCase().includes(q) ?? false;
    return inTitle || inDesc;
  });

  return sortCatalogServices(filtered, filters.sort);
}
