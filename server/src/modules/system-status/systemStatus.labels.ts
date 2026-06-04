import type {
  OverallStatusKind,
  SystemComponentStatus,
  SystemIncidentSeverity,
  SystemIncidentStatus,
  SystemMaintenanceStatus,
} from './systemStatus.types.js';

export function componentStatusLabel(status: SystemComponentStatus): string {
  switch (status) {
    case 'operational':
      return 'Работает';
    case 'degraded':
      return 'Работает с перебоями';
    case 'partial_outage':
      return 'Частичная недоступность';
    case 'major_outage':
      return 'Недоступно';
    case 'maintenance':
      return 'Плановые работы';
    default:
      return 'Мониторинг не подключён';
  }
}

export function incidentStatusLabel(status: SystemIncidentStatus): string {
  switch (status) {
    case 'investigating':
      return 'Расследуем';
    case 'identified':
      return 'Причина найдена';
    case 'monitoring':
      return 'Наблюдаем';
    case 'resolved':
      return 'Решено';
  }
}

export function maintenanceStatusLabel(status: SystemMaintenanceStatus): string {
  switch (status) {
    case 'scheduled':
      return 'Запланировано';
    case 'in_progress':
      return 'В процессе';
    case 'completed':
      return 'Завершено';
    case 'cancelled':
      return 'Отменено';
  }
}

export function overallStatusCopy(status: OverallStatusKind): {
  title: string;
  description: string;
  badgeLabel: string;
} {
  switch (status) {
    case 'operational':
      return {
        title: 'Все системы работают',
        description: 'Сервисы SLOTTY работают штатно.',
        badgeLabel: 'Operational',
      };
    case 'degraded':
      return {
        title: 'Некоторые сервисы работают с задержкой',
        description: 'Мы уже проверяем ситуацию. Ниже указаны затронутые компоненты.',
        badgeLabel: 'Degraded',
      };
    case 'partial_outage':
      return {
        title: 'Есть проблемы с некоторыми сервисами',
        description: 'Мы уже проверяем ситуацию. Ниже указаны затронутые компоненты.',
        badgeLabel: 'Partial outage',
      };
    case 'major_outage':
      return {
        title: 'Существенные проблемы на платформе',
        description: 'Команда SLOTTY устраняет сбой. Следите за обновлениями ниже.',
        badgeLabel: 'Major outage',
      };
    case 'maintenance':
      return {
        title: 'Плановые работы',
        description: 'Некоторые функции могут быть временно недоступны.',
        badgeLabel: 'Maintenance',
      };
  }
}

export function severityLabel(severity: SystemIncidentSeverity): string {
  switch (severity) {
    case 'low':
      return 'Низкая';
    case 'medium':
      return 'Средняя';
    case 'high':
      return 'Высокая';
    case 'critical':
      return 'Критическая';
  }
}

export function formatRelativeRu(iso: string | null): string | null {
  if (!iso) return null;
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 0) return 'только что';
  const sec = Math.floor(ms / 1000);
  if (sec < 60) return `${sec} сек. назад`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} мин. назад`;
  const h = Math.floor(min / 60);
  if (h < 48) return `${h} ч. назад`;
  const d = Math.floor(h / 24);
  return `${d} дн. назад`;
}
