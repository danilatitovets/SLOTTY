import type { NotificationType } from './notificationsInsert.js';

export type NotificationAudience = 'master' | 'client';

export type NotificationLike = {
  type: string;
  title: string;
  body: string;
};

const CLIENT_ONLY_TYPES = new Set<NotificationType>([
  'appointment_pending',
  'appointment_confirmed',
  'review_request',
]);

const MASTER_ONLY_TYPES = new Set<NotificationType>(['appointment_new', 'billing']);

function isMasterSystemNotification(row: NotificationLike): boolean {
  const title = row.title.trim();
  if (title === 'Новый отзыв') return true;
  if (title === 'Вы в топе мастеров') return true;
  if (title.startsWith('Категория профиля')) return true;
  if (title.startsWith('Заявка на смену категории')) return true;
  if (/тариф|Pro|оплат/i.test(title)) return true;
  return false;
}

export function resolveNotificationAudience(row: NotificationLike): NotificationAudience {
  const type = row.type as NotificationType;
  if (CLIENT_ONLY_TYPES.has(type)) return 'client';
  if (MASTER_ONLY_TYPES.has(type)) return 'master';
  if (type === 'appointment_cancelled') {
    return row.title === 'Клиент отменил запись' ? 'master' : 'client';
  }
  if (type === 'appointment_reminder') {
    return row.title.includes('у вас') ? 'master' : 'client';
  }
  if (type === 'system') {
    return isMasterSystemNotification(row) ? 'master' : 'client';
  }
  return 'client';
}

export function filterNotificationsForAudience<T extends NotificationLike>(
  rows: T[],
  audience: NotificationAudience,
): T[] {
  return rows.filter((row) => resolveNotificationAudience(row) === audience);
}
