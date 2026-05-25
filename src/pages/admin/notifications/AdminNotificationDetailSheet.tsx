import { useEffect } from 'react';
import { HiBellAlert } from 'react-icons/hi2';
import type { MeNotificationRow } from '../../../features/profile/api/clientNotifications';
import { formatNotificationListTime } from '../../../features/notifications/formatNotificationTime';
import { AdminBottomSheet } from '../shared/AdminBottomSheet';
import { catalogSheetPrimaryBtn } from '../shared/adminCatalogSheetTheme';
import { notifIconFallback } from './adminNotificationsTheme';

function notificationTypeLabel(type: string): string {
  switch (type) {
    case 'appointment_new':
      return 'Новая запись';
    case 'appointment_cancelled':
      return 'Отмена записи';
    case 'appointment_reminder':
      return 'Напоминание';
    case 'billing':
      return 'Тариф';
    default:
      return 'Уведомление';
  }
}

type Props = {
  item: MeNotificationRow | null;
  onClose: () => void;
  onMarkRead?: (id: string) => void;
};

export function AdminNotificationDetailSheet({ item, onClose, onMarkRead }: Props) {
  useEffect(() => {
    if (!item?.id || item.read_at) return;
    onMarkRead?.(item.id);
  }, [item, onMarkRead]);

  const isNew = item ? !item.read_at : false;

  return (
    <AdminBottomSheet
      open={Boolean(item)}
      onClose={onClose}
      variant="catalog"
      badge={isNew ? 'Новое' : undefined}
      title={item?.title ?? 'Уведомление'}
      subtitle={item ? formatNotificationListTime(item.created_at) : undefined}
      footer={
        <button type="button" onClick={onClose} className={catalogSheetPrimaryBtn}>
          Понятно
        </button>
      }
    >
      {item ? (
        <div className="space-y-4">
          <div className="rounded-[10px] bg-[#F5F5F5] px-4 py-4">
            <div className="flex items-start gap-3">
              <span className={`${notifIconFallback} h-11 w-11`}>
                <HiBellAlert className="h-5 w-5" aria-hidden />
              </span>
              <div className="min-w-0 pt-0.5">
                <p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-[#9CA3AF]">
                  {notificationTypeLabel(item.type)}
                </p>
                <p className="mt-1 text-[15px] font-bold leading-snug text-[#111827]">{item.title}</p>
              </div>
            </div>
          </div>
          <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-[#374151]">{item.body}</p>
        </div>
      ) : null}
    </AdminBottomSheet>
  );
}
