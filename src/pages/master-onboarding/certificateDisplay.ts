/** Первая буква заглавная — для аккуратного отображения без правки ввода пользователя. */
export function formatCertificateDisplayTitle(title: string): string {
  const t = title.trim();
  if (!t) return t;
  return t.charAt(0).toLocaleUpperCase('ru-RU') + t.slice(1);
}

/** Организация и год отдельно — без «организация · год» в одной строке. */
export function resolveCertificateOrganizationAndYear(
  organization?: string,
  year?: string,
): { organization?: string; year?: string } {
  const yearTrim = year?.trim();
  if (yearTrim) {
    return {
      organization: organization?.trim() || undefined,
      year: yearTrim,
    };
  }

  const orgRaw = organization?.trim() ?? '';
  if (!orgRaw) return {};

  const splitMatch = orgRaw.match(/^(.+?)\s*[·•|,/–—-]\s*(\d{4})\s*$/u);
  if (splitMatch) {
    return {
      organization: splitMatch[1].trim() || undefined,
      year: splitMatch[2],
    };
  }

  const trailingYear = orgRaw.match(/^(.+?)\s+(\d{4})\s*$/u);
  if (trailingYear) {
    return {
      organization: trailingYear[1].trim() || undefined,
      year: trailingYear[2],
    };
  }

  return { organization: orgRaw };
}
