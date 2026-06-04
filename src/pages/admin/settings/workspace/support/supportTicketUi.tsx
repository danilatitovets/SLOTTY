import {
  SUPPORT_AFFECTED_SERVICE_OPTIONS,
  SUPPORT_CATEGORY_OPTIONS,
  SUPPORT_SEVERITY_OPTIONS,
} from './supportConstants';

export type TicketStatusTone = 'neutral' | 'success' | 'warning' | 'pink';

export const TICKET_STATUS: Record<string, { label: string; tone: TicketStatusTone }> = {
  OPEN: { label: 'Открыто', tone: 'pink' },
  IN_PROGRESS: { label: 'В работе', tone: 'warning' },
  WAITING_USER: { label: 'Ждём ответа', tone: 'neutral' },
  RESOLVED: { label: 'Решено', tone: 'success' },
  CLOSED: { label: 'Закрыто', tone: 'neutral' },
};

const TICKET_ACTIVE_STATUSES = new Set(['OPEN', 'IN_PROGRESS', 'WAITING_USER']);

export function isTicketActive(status: string): boolean {
  return TICKET_ACTIVE_STATUSES.has(status);
}

const categoryMap = Object.fromEntries(SUPPORT_CATEGORY_OPTIONS.map((o) => [o.value, o.label]));
const severityMap = Object.fromEntries(SUPPORT_SEVERITY_OPTIONS.map((o) => [o.value, o.label]));
const serviceMap = Object.fromEntries(SUPPORT_AFFECTED_SERVICE_OPTIONS.map((o) => [o.value, o.label]));

export function ticketCategoryLabel(value: string): string {
  return categoryMap[value] ?? value;
}

export function ticketSeverityLabel(value: string): string {
  return severityMap[value] ?? value;
}

export function ticketServicesLabel(values: string[]): string {
  if (!values.length) return '—';
  return values.map((v) => serviceMap[v] ?? v).join(', ');
}

export function formatTicketWhen(iso: string): string {
  return new Date(iso).toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function ticketEventTypeLabel(type: string): string {
  const map: Record<string, string> = {
    CREATED: 'Создано',
    STATUS_CHANGED: 'Статус изменён',
    COMMENT: 'Комментарий',
    ASSIGNED: 'Назначено',
    CLOSED: 'Закрыто',
  };
  return map[type] ?? type;
}

export function ticketActorLabel(role: string): string {
  const map: Record<string, string> = {
    user: 'Вы',
    support: 'Поддержка',
    system: 'Система',
  };
  return map[role] ?? role;
}
