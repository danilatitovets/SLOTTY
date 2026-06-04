import {
  ADMIN_APPOINTMENTS_PATH,
  ADMIN_BILLING_PATH,
  MASTER_SETTINGS_SUPPORT_TICKETS_PATH,
  getMasterAppointmentPath,
} from '../../../app/paths';
import type { MeNotificationRow } from '../../../features/profile/api/clientNotifications';
import type { AppointmentsTabId } from '../appointments/appointmentsTypes';

export type MasterNotificationAction = {
  label: string;
  pathname: string;
  /** Полный путь с query, например /admin/appointments?tab=requests&focus=… */
  to: string;
};

const APPOINTMENT_NOTIFY_TYPES = new Set([
  'appointment_new',
  'appointment_pending',
  'appointment_confirmed',
  'appointment_cancelled',
  'appointment_reminder',
]);

function appointmentsTabForNotifyType(type: string): AppointmentsTabId {
  switch (type) {
    case 'appointment_new':
    case 'appointment_pending':
      return 'requests';
    case 'appointment_confirmed':
    case 'appointment_reminder':
      return 'upcoming';
    default:
      return 'history';
  }
}

function buildAppointmentsAction(
  item: MeNotificationRow,
  appointmentId?: string | null,
): MasterNotificationAction {
  const tab = appointmentsTabForNotifyType(item.type);
  const params = new URLSearchParams();
  if (tab !== 'requests') params.set('tab', tab);
  if (appointmentId) params.set('focus', appointmentId);
  const qs = params.toString();
  const to = qs ? `${ADMIN_APPOINTMENTS_PATH}?${qs}` : ADMIN_APPOINTMENTS_PATH;
  const label =
    tab === 'requests'
      ? appointmentId
        ? 'Открыть заявку'
        : 'К заявкам'
      : appointmentId
        ? 'Открыть запись'
        : 'К записям';
  return { label, pathname: ADMIN_APPOINTMENTS_PATH, to };
}

export function resolveMasterNotificationAction(
  item: MeNotificationRow,
): MasterNotificationAction | null {
  const bookingCode = item.booking_code?.trim().toUpperCase();
  if (item.related_entity_type === 'appointment') {
    if (bookingCode) {
      const to = getMasterAppointmentPath(bookingCode);
      return { label: 'Открыть запись', pathname: to, to };
    }
    if (item.related_entity_id) {
      console.warn('[notifications] appointment without booking_code', {
        id: item.id,
        appointmentId: item.related_entity_id,
      });
      return buildAppointmentsAction(item, item.related_entity_id);
    }
  }

  if (APPOINTMENT_NOTIFY_TYPES.has(item.type)) {
    if (bookingCode) {
      const to = getMasterAppointmentPath(bookingCode);
      return { label: 'Открыть запись', pathname: to, to };
    }
    return buildAppointmentsAction(item, null);
  }

  if (item.type === 'billing') {
    return {
      label: 'Тариф и оплата',
      pathname: ADMIN_BILLING_PATH,
      to: ADMIN_BILLING_PATH,
    };
  }

  if (item.related_entity_type === 'support_ticket' && item.related_entity_id) {
    const ticketPath = `${MASTER_SETTINGS_SUPPORT_TICKETS_PATH}/${item.related_entity_id}`;
    return {
      label: 'Открыть обращение',
      pathname: MASTER_SETTINGS_SUPPORT_TICKETS_PATH,
      to: ticketPath,
    };
  }

  if (item.type === 'system' && item.title.includes('SUP-')) {
    const match = item.title.match(/SUP-[A-Z0-9-]+/i);
    if (match) {
      const to = `${MASTER_SETTINGS_SUPPORT_TICKETS_PATH}/${match[0]}`;
      return { label: 'Открыть обращение', pathname: MASTER_SETTINGS_SUPPORT_TICKETS_PATH, to };
    }
  }

  return null;
}
