import { isSameCalendarDay, addDays } from '../../../features/booking/lib/calendar';
import type { ServiceListingRecord } from '../../../features/services/model/demoMasters';
import { formatReviewsCountLabel } from '../../../features/services/model/demoMasters';
import { masterVisitTypeLabel } from '../../../features/profile/model/masterLocation';

export { formatReviewsCountLabel };

export function formatPriceFrom(price: number): string {
  const n = Number.isFinite(price) ? price : 0;
  if (n <= 0) return 'цена по запросу';
  return `от ${Math.round(n)} BYN`;
}

export function formatDurationMinutes(min: number): string {
  const m = Math.max(0, Math.round(min));
  if (m < 60) return `${m} мин`;
  const h = Math.floor(m / 60);
  const rest = m % 60;
  if (rest === 0) return `${h} ч`;
  return `${h} ч ${rest} мин`;
}

export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function formatDistanceKm(km: number | null | undefined): string | null {
  if (km == null || !Number.isFinite(km)) return null;
  if (km < 1) return `${Math.max(100, Math.round(km * 1000))} м`;
  return `${km.toFixed(1)} км`;
}

export function listingDistanceKm(
  listing: ServiceListingRecord,
  userLat: number | null,
  userLng: number | null,
): number | null {
  const lat = listing.location.lat;
  const lng = listing.location.lng;
  if (userLat == null || userLng == null || lat == null || lng == null) return null;
  return haversineKm(userLat, userLng, lat, lng);
}

export function formatNearestSlotLabel(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const now = new Date();
  const time = d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  if (isSameCalendarDay(d, now)) return `Сегодня ${time}`;
  const tomorrow = addDays(now, 1);
  if (isSameCalendarDay(d, tomorrow)) return `Завтра ${time}`;
  const day = d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
  return `${day}, ${time}`;
}

export function isSlotToday(iso: string | null | undefined): boolean {
  if (!iso) return false;
  const d = new Date(iso);
  return !Number.isNaN(d.getTime()) && isSameCalendarDay(d, new Date());
}

export function visitFormatLabel(listing: ServiceListingRecord): string {
  return masterVisitTypeLabel(listing.location.visitType);
}
