import type { ServiceCategoryDto } from './api/becomeMasterApi';

/** Те же id/code, что в seed БД — если API недоступен, онбординг всё равно работает. */
export const ONBOARDING_FALLBACK_CATEGORIES: ServiceCategoryDto[] = [
  { id: '11111111-1111-4111-8111-111111110001', code: 'manicure', name: 'Маникюр', sortOrder: 10 },
  { id: '11111111-1111-4111-8111-111111110002', code: 'barbers', name: 'Барберы', sortOrder: 20 },
  { id: '11111111-1111-4111-8111-111111110003', code: 'brows-lashes', name: 'Брови и ресницы', sortOrder: 30 },
  { id: '11111111-1111-4111-8111-111111110004', code: 'massage', name: 'Массаж', sortOrder: 40 },
  { id: '11111111-1111-4111-8111-111111110005', code: 'fitness', name: 'Фитнес', sortOrder: 50 },
  { id: '11111111-1111-4111-8111-111111110006', code: 'tattoo', name: 'Тату', sortOrder: 60 },
];

const CODE_BY_ID = Object.fromEntries(
  ONBOARDING_FALLBACK_CATEGORIES.map((c) => [c.id, c.code]),
) as Record<string, string>;

export function fallbackCategoryCodeById(categoryId: string | null | undefined): string | null {
  if (!categoryId) return null;
  return CODE_BY_ID[categoryId] ?? null;
}
