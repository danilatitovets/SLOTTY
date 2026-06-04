import { env } from '../../config/env.js';
import {
  buildBookingEmailLink,
  buildBookingLink,
  type BookingLinkRole,
  type BookingLinkSource,
} from '../../lib/buildBookingLink.js';
import { ADMIN_APPOINTMENTS_PATH, ADMIN_SCHEDULE_PATH } from './appointmentNotifyPaths.js';

export { buildBookingLink, buildBookingEmailLink };
export type { BookingLinkRole, BookingLinkSource };
export { ADMIN_APPOINTMENTS_PATH, ADMIN_SCHEDULE_PATH };

function appBaseUrl(): string {
  return (env.WEB_APP_URL ?? env.CLIENT_URL).replace(/\/$/, '');
}

export function clientBookingDeepLink(
  bookingCode: string,
  source: BookingLinkSource = 'telegram',
): string {
  return buildBookingLink({ role: 'client', bookingCode, source });
}

export function masterBookingDeepLink(
  bookingCode: string,
  source: BookingLinkSource = 'telegram',
): string {
  return buildBookingLink({ role: 'master', bookingCode, source });
}

export function masterPendingAppointmentsUrl(): string {
  return `${appBaseUrl()}${ADMIN_APPOINTMENTS_PATH}?tab=pending`;
}

export function masterScheduleUrl(): string {
  return `${appBaseUrl()}${ADMIN_SCHEDULE_PATH}`;
}

export function clientAppointmentsUrl(): string {
  return `${appBaseUrl()}/profile?tab=appointments`;
}
