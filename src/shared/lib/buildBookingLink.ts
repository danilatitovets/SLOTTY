/** Пути и ссылки на конкретную запись (синхронно с server/src/lib/buildBookingLink.ts). */

export type BookingLinkRole = 'client' | 'master';
export type BookingLinkSource = 'telegram' | 'email' | 'web';

const VOUCHER_PATTERN = /^SL-[A-Z0-9]{12}$/i;

export function normalizeBookingCode(raw: string): string {
  const code = raw.trim().toUpperCase();
  if (!VOUCHER_PATTERN.test(code)) {
    throw new Error('INVALID_BOOKING_CODE');
  }
  return code;
}

export function buildBookingPath(role: BookingLinkRole, bookingCode: string): string {
  const code = encodeURIComponent(normalizeBookingCode(bookingCode));
  return role === 'client' ? `/client/appointments/${code}` : `/master/appointments/${code}`;
}

function readPublicAppOrigin(): string {
  const fromEnv = import.meta.env.VITE_PUBLIC_APP_URL?.trim().replace(/\/$/, '');
  if (fromEnv) return fromEnv;
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin.replace(/\/$/, '');
  }
  return 'https://slotty.of.by';
}

export function buildBookingLink(params: {
  role: BookingLinkRole;
  bookingCode: string;
  source?: BookingLinkSource;
}): string {
  const path = buildBookingPath(params.role, params.bookingCode);
  const base = readPublicAppOrigin();
  const url = new URL(path, `${base}/`);
  if (params.source) {
    url.searchParams.set('source', params.source);
  }
  return url.toString();
}
