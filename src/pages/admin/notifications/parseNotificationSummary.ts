import type { MeNotificationRow } from '../../../features/profile/api/clientNotifications';

export type NotificationSummaryField = { label: string; value: string };

function fieldsOrEmpty(rows: NotificationSummaryField[]): NotificationSummaryField[] {
  return rows.every((r) => r.value.trim()) ? rows : [];
}

/** Разбор текста уведомления в поля для карточки (старые и новые шаблоны). */
export function parseNotificationSummary(item: MeNotificationRow): NotificationSummaryField[] {
  const body = item.body.trim();

  const newRequest = body.match(/^Новая заявка:\s*(.+?),\s*(.+?),\s*(.+?)\./);
  if (newRequest) {
    return fieldsOrEmpty([
      { label: 'Клиент', value: newRequest[1].trim() },
      { label: 'Услуга', value: newRequest[2].trim() },
      { label: 'Когда', value: newRequest[3].trim() },
    ]);
  }

  const legacyRequest = body.match(/^Новая заявка на запись:\s*(.+?),\s*(.+?)\./);
  if (legacyRequest) {
    return fieldsOrEmpty([
      { label: 'Услуга', value: legacyRequest[1].trim() },
      { label: 'Когда', value: legacyRequest[2].trim() },
    ]);
  }

  const cancelled = body.match(/^(.+?)\s+отменил(?:а)?\s+запись:\s*(.+?)\s+\((.+?)\)/);
  if (cancelled) {
    return fieldsOrEmpty([
      { label: 'Клиент', value: cancelled[1].trim() },
      { label: 'Услуга', value: cancelled[2].trim() },
      { label: 'Когда', value: cancelled[3].trim() },
    ]);
  }

  const booked = body.match(
    /^(.+?)\s+(?:забронировал(?:а)?|записал(?:ся|ась)|оформил(?:а)?\s+запись):\s*(.+?)\s*[—–-]\s*(.+?)(?:\.\s*Номер|$)/i,
  );
  if (booked) {
    const voucher = body.match(/Номер:\s*(\S+)/i);
    const rows: NotificationSummaryField[] = [
      { label: 'Клиент', value: booked[1].trim() },
      { label: 'Услуга', value: booked[2].trim() },
      { label: 'Когда', value: booked[3].trim() },
    ];
    if (voucher) rows.push({ label: 'Номер', value: voucher[1].trim() });
    return fieldsOrEmpty(rows);
  }

  const confirmed = body.match(/^Запись подтверждена:\s*(.+?)\./);
  if (confirmed) {
    return [{ label: 'Когда', value: confirmed[1].trim() }];
  }

  return [];
}
