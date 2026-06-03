import { env } from '../../config/env.js';

function appBaseUrl(): string {
  return (env.WEB_APP_URL ?? env.CLIENT_URL).replace(/\/$/, '');
}

export function masterPendingAppointmentsUrl(): string {
  return `${appBaseUrl()}/admin/appointments?tab=pending`;
}

export function clientAppointmentsUrl(): string {
  return `${appBaseUrl()}/profile?tab=appointments`;
}
