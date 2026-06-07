import type { CatalogSearchSuggestionDto } from '../../../features/services/api/catalogListingsApi';

export type CatalogSearchSuggestSelection =
  | { kind: 'text'; text: string }
  | { kind: 'category'; code: string; text: string }
  | { kind: 'master'; masterId: string; text: string }
  | { kind: 'service'; text: string; masterId?: string; serviceId?: string };

export function selectionFromSuggestion(item: CatalogSearchSuggestionDto): CatalogSearchSuggestSelection {
  if (item.type === 'category' && item.categoryCode) {
    return { kind: 'category', code: item.categoryCode, text: item.title };
  }
  if (item.type === 'master' && item.masterId) {
    return { kind: 'master', masterId: item.masterId, text: item.title };
  }
  if (item.type === 'service') {
    return {
      kind: 'service',
      text: item.title,
      masterId: item.masterId,
      serviceId: item.serviceId,
    };
  }
  return { kind: 'text', text: item.title };
}
