/** Запись об образовании в онбординге (тип всегда `education` на бэкенде). */
export type OnboardingEducationItem = {
  id: string;
  title: string;
  place: string;
  startYear?: string;
  endYear?: string;
  description?: string;
};

export function newOnboardingEducationId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `edu-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function formatEducationPeriod(startYear?: string, endYear?: string): string {
  const start = startYear?.trim();
  const end = endYear?.trim();
  if (start && end) return `${start}–${end}`;
  if (start) return `с ${start}`;
  if (end) return `до ${end}`;
  return '';
}

function parseEducationYear(raw?: string): number | null {
  const t = raw?.trim();
  if (!t || !/^\d{4}$/.test(t)) return null;
  const y = Number.parseInt(t, 10);
  return Number.isInteger(y) ? y : null;
}

/**
 * Хронология: раньше учился — выше в списке; без дат — в конце.
 * Не зависит от порядка добавления в форме.
 */
export function sortEducationItemsChronologically(
  items: OnboardingEducationItem[],
): OnboardingEducationItem[] {
  return [...items].sort((a, b) => {
    const aStart = parseEducationYear(a.startYear);
    const bStart = parseEducationYear(b.startYear);
    const aEnd = parseEducationYear(a.endYear);
    const bEnd = parseEducationYear(b.endYear);

    const aAnchor = aStart ?? aEnd;
    const bAnchor = bStart ?? bEnd;

    if (aAnchor == null && bAnchor == null) {
      return a.title.localeCompare(b.title, 'ru');
    }
    if (aAnchor == null) return 1;
    if (bAnchor == null) return -1;
    if (aAnchor !== bAnchor) return aAnchor - bAnchor;

    const aEndVal = aEnd ?? aStart ?? aAnchor;
    const bEndVal = bEnd ?? bStart ?? bAnchor;
    if (aEndVal !== bEndVal) return aEndVal - bEndVal;

    return a.title.localeCompare(b.title, 'ru');
  });
}
