/** Статусы записи (синхронно с server/src/lib/appointmentStatus.ts). */

export type UiAppointmentStatus =
  | 'pending'
  | 'confirmed'
  | 'client_arrived'
  | 'in_progress'
  | 'master_marked_completed'
  | 'client_confirmed_completed'
  | 'completed'
  | 'no_show'
  | 'cancelled'
  | 'disputed';

const DB_STATUSES = new Set([
  'pending',
  'confirmed',
  'client_arrived',
  'in_progress',
  'master_marked_completed',
  'client_confirmed_completed',
  'completed',
  'no_show',
  'cancelled_by_client',
  'cancelled_by_master',
  'cancelled_by_admin',
  'disputed_by_client',
  'disputed_by_master',
  'expired',
]);

export function normalizeDbStatus(raw: string): string {
  const s = raw.trim();
  return DB_STATUSES.has(s) ? s : 'pending';
}

export function dbStatusToUi(status: string): UiAppointmentStatus {
  const s = normalizeDbStatus(status);
  switch (s) {
    case 'pending':
      return 'pending';
    case 'confirmed':
      return 'confirmed';
    case 'client_arrived':
      return 'client_arrived';
    case 'in_progress':
      return 'in_progress';
    case 'master_marked_completed':
      return 'master_marked_completed';
    case 'client_confirmed_completed':
      return 'client_confirmed_completed';
    case 'completed':
      return 'completed';
    case 'no_show':
      return 'no_show';
    case 'disputed_by_client':
    case 'disputed_by_master':
      return 'disputed';
    case 'cancelled_by_client':
    case 'cancelled_by_master':
    case 'cancelled_by_admin':
    case 'expired':
      return 'cancelled';
    default:
      return 'pending';
  }
}

export function appointmentStatusLabel(status: string | UiAppointmentStatus): string {
  const ui =
    typeof status === 'string' && status.includes('_') && !['client_arrived', 'in_progress'].includes(status)
      ? dbStatusToUi(status)
      : (status as UiAppointmentStatus);
  switch (ui) {
    case 'pending':
      return 'Новая заявка';
    case 'confirmed':
      return 'Подтверждена';
    case 'client_arrived':
      return 'Клиент пришёл';
    case 'in_progress':
      return 'Визит начат';
    case 'master_marked_completed':
      return 'Подтвердите выполнение';
    case 'client_confirmed_completed':
      return 'Ожидает завершения';
    case 'completed':
      return 'Завершена';
    case 'no_show':
      return 'Неявка';
    case 'disputed':
      return 'Обращение на рассмотрении';
    case 'cancelled':
      return 'Отменена';
    default:
      return String(status);
  }
}

export function statusHint(status: string): string {
  const s = normalizeDbStatus(status);
  switch (s) {
    case 'pending':
      return 'Ожидает подтверждения мастера';
    case 'confirmed':
      return 'Можно сообщить о приходе или отменить';
    case 'client_arrived':
    case 'in_progress':
      return 'Отметьте выполнение услуги после визита';
    case 'master_marked_completed':
      return 'Подтвердите, что услуга выполнена, или сообщите о проблеме';
    case 'client_confirmed_completed':
      return 'Мастер завершит запись';
    case 'completed':
      return 'Можно оставить отзыв';
    case 'no_show':
      return 'Мастер отметил неявку — можно оспорить';
    case 'disputed_by_client':
    case 'disputed_by_master':
      return 'Администратор рассмотрит обращение';
    default:
      return '';
  }
}

export function isUpcomingTabStatus(status: string): boolean {
  const s = normalizeDbStatus(status);
  return (
    s === 'confirmed' ||
    s === 'client_arrived' ||
    s === 'in_progress' ||
    s === 'master_marked_completed' ||
    s === 'client_confirmed_completed'
  );
}

export function isHistoryTabStatus(status: string): boolean {
  const s = normalizeDbStatus(status);
  return (
    s === 'completed' ||
    s === 'no_show' ||
    s === 'cancelled_by_client' ||
    s === 'cancelled_by_master' ||
    s === 'cancelled_by_admin' ||
    s === 'disputed_by_client' ||
    s === 'disputed_by_master' ||
    s === 'expired'
  );
}
