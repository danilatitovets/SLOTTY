import { PROFILE_PATH } from '../../app/paths';
import type { MeNotificationRow } from '../profile/api/clientNotifications';

export type ClientNotificationAction = {
  label: string;
  to: string;
};

const APPOINTMENT_NOTIFY_TYPES = new Set([
  'appointment_new',
  'appointment_pending',
  'appointment_confirmed',
  'appointment_cancelled',
  'appointment_reminder',
  'review_request',
]);

export function resolveClientNotificationAction(
  item: MeNotificationRow,
): ClientNotificationAction | null {
  if (item.related_entity_type === 'appointment' && item.related_entity_id) {
    const params = new URLSearchParams({
      tab: 'appointments',
      focus: item.related_entity_id,
    });
    return {
      label: 'Открыть запись',
      to: `${PROFILE_PATH}?${params.toString()}`,
    };
  }

  if (APPOINTMENT_NOTIFY_TYPES.has(item.type)) {
    const params = new URLSearchParams({ tab: 'appointments' });
    return {
      label: 'Мои записи',
      to: `${PROFILE_PATH}?${params.toString()}`,
    };
  }

  return null;
}
