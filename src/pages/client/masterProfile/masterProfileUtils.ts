import { LOCATION_EMPTY_SENTINEL } from '../../../shared/lib/emptyDisplayText';
import type { MasterLocation } from '../../../features/profile/model/masterLocation';
import type { MasterDraftCareerItem } from '../../../features/profile/lib/demoMasterStorage';
import type { DemoMasterService } from '../../../features/services/model/demoMasters';
import { masterVisitTypeLabel } from '../../../features/profile/model/masterLocation';
import { formatDurationMinutes } from '../lib/catalogFormat';

export function formatServicePrice(service: DemoMasterService): string {
  if (service.price <= 0) return 'Бесплатно';
  const prefix = service.priceType === 'from' ? 'от ' : '';
  return `${prefix}${Math.round(service.price)} BYN`;
}

export function formatMasterRoleLabel(category: string): string {
  const c = category.trim();
  if (!c || c === 'Мастер') return 'Beauty-мастер';
  if (/мастер|бровист|lash|визаж/i.test(c)) return c;
  return `Мастер ${c.toLowerCase()}`;
}

export function buildTelHref(phone: string): string | null {
  const compact = phone.trim().replace(/[^\d+]/g, '');
  if (!compact.replace(/\D/g, '')) return null;
  const normalized = compact.startsWith('+') ? compact : `+${compact.replace(/\D/g, '')}`;
  return `tel:${normalized}`;
}

/** Телефон из поля phone или из строки contact (legacy). */
export function resolveMasterCallablePhone(phone?: string, contact?: string): string | null {
  const direct = phone?.trim();
  if (direct && buildTelHref(direct)) return direct;

  const legacy = contact?.trim();
  if (!legacy) return null;

  const embedded = legacy.match(/(?:\+?\d[\d\s\-()]{7,}\d)/);
  if (embedded) {
    const candidate = embedded[0].trim();
    if (buildTelHref(candidate)) return candidate;
  }
  return null;
}

/**
 * Звонок мастеру. В Telegram Mini App обычный `<a href="tel:">` не срабатывает —
 * используем WebApp.openLink.
 */
export function openPhoneDial(phone: string): boolean {
  const telHref = buildTelHref(phone);
  if (!telHref || typeof window === 'undefined') return false;

  const tg = (window as unknown as { Telegram?: { WebApp?: { openLink?: (u: string) => void } } })
    .Telegram?.WebApp;

  try {
    if (typeof tg?.openLink === 'function') {
      tg.openLink(telHref);
      return true;
    }
  } catch {
    /* fall through */
  }

  try {
    window.location.href = telHref;
    return true;
  } catch {
    return false;
  }
}

export function telegramUrlFromContact(contact: string): string | null {
  const s = contact.trim();
  const embedded = s.match(/(?:https?:\/\/)?(?:t\.me|telegram\.me)\/([a-zA-Z0-9_]+)/i);
  if (embedded) return `https://t.me/${embedded[1]}`;
  const at = s.match(/@([a-zA-Z0-9_]{3,32})/);
  if (at) return `https://t.me/${at[1]}`;
  return null;
}

export async function shareMasterProfile(masterName: string, url: string): Promise<'shared' | 'copied'> {
  const title = `${masterName} — SLOTTY`;
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({ title, url });
      return 'shared';
    } catch {
      /* fallback */
    }
  }
  await navigator.clipboard.writeText(url);
  return 'copied';
}

export function computeExperienceYears(careerItems: MasterDraftCareerItem[] | undefined): number | null {
  if (!careerItems?.length) return null;
  const years = careerItems
    .map((item) => {
      const start = item.startYear ? Number(item.startYear) : NaN;
      const end = item.endYear ? Number(item.endYear) : new Date().getFullYear();
      if (!Number.isFinite(start)) return null;
      return Math.max(0, end - start);
    })
    .filter((y): y is number => y != null);
  if (!years.length) return null;
  return Math.max(...years);
}

export function satisfiedClientsPercent(rating: number, reviewsCount: number): number | null {
  if (reviewsCount < 5 || rating <= 0) return null;
  const pct = Math.min(99, Math.round((rating / 5) * 100));
  return pct >= 85 ? pct : null;
}

export function serviceDurationLabel(minutes: number): string {
  return formatDurationMinutes(minutes);
}

export function visitChipLabel(visitType: 'studio' | 'at_home'): string {
  return visitType === 'at_home' ? 'На дому' : 'В студии';
}

/** Короткая строка локации для карточки / шапки профиля (без «Выбранная точка на карте»). */
export function formatMasterProfileLocationChip(location: MasterLocation): string {
  const city = location.city?.trim() || 'Минск';
  const district = location.district?.trim();
  if (district && district !== LOCATION_EMPTY_SENTINEL && !/выбранн/i.test(district)) {
    const short = district.length > 22 ? `${district.slice(0, 21)}…` : district;
    return `${city}, ${short}`;
  }
  const landmark = location.landmark?.trim();
  if (landmark && !/выбранн/i.test(landmark)) {
    if (/центр/i.test(landmark)) return `${city}, Центр`;
    const m = landmark.match(/район\s+([^,.]+)/i);
    if (m?.[1]) {
      const part = m[1].trim();
      return `${city}, ${part.length > 16 ? `${part.slice(0, 15)}…` : part}`;
    }
  }
  const street = location.street?.trim();
  if (street && street !== LOCATION_EMPTY_SENTINEL && !/выбранн/i.test(street)) {
    const cleaned = street
      .replace(/^ул\.?\s*/i, '')
      .replace(/^улица\s*/i, '')
      .replace(/^пр-т\s*/i, '');
    const short = cleaned.length > 20 ? `${cleaned.slice(0, 19)}…` : cleaned;
    return `${city}, ${short}`;
  }
  return city;
}

export function locationDistrictLine(city: string | undefined, street: string): string {
  const parts = [city?.trim(), street?.trim()].filter(Boolean);
  return parts.join(', ') || 'Район уточняется';
}

export { masterVisitTypeLabel };
