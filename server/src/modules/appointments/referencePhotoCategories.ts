const REFERENCE_PHOTO_CATEGORY_CODES = new Set([
  'manicure',
  'barbers',
  'brows-lashes',
  'tattoo',
]);

export function normalizeCategoryCode(code: string): string {
  return code.trim().toLowerCase().replace(/_/g, '-');
}

export function categorySupportsReferencePhoto(code: string | null | undefined): boolean {
  if (!code?.trim()) return false;
  return REFERENCE_PHOTO_CATEGORY_CODES.has(normalizeCategoryCode(code));
}
