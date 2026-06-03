import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiBellAlert } from 'react-icons/hi2';
import type { MeNotificationRow } from '../../../features/profile/api/clientNotifications';
import { formatNotificationListTime } from '../../../features/notifications/formatNotificationTime';
import { AdminBottomSheet } from '../shared/AdminBottomSheet';
import {
  catalogSheetPrimaryBtn,
  catalogSheetSecondaryBtn,
} from '../shared/adminCatalogSheetTheme';
import { notifIconFallback } from './adminNotificationsTheme';
import { resolveMasterNotificationAction } from './notificationAction';
import { parseNotificationSummary } from '../../../features/notifications/parseNotificationSummary';

function notificationTypeLabel(type: string): string {
  switch (type) {
    case 'appointment_new':
      return 'Новая запись';
    case 'appointment_pending':
      return 'Заявка на запись';
    case 'appointment_confirmed':
      return 'Подтверждение записи';
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

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-[#EEEEEE] py-3 last:border-0">
      <span className="shrink-0 text-[13px] font-medium text-[#6B7280]">{label}</span>
      <span className="min-w-0 text-right text-[14px] font-semibold leading-snug text-[#111827]">
        {value}
      </span>
    </div>
  );
}

type Props = {
  item: MeNotificationRow | null;
  onClose: () => void;
  onMarkRead?: (id: string) => void;
};

export function AdminNotificationDetailSheet({ item, onClose, onMarkRead }: Props) {
  const navigate = useNavigate();

  useEffect(() => {
    if (!item?.id || item.read_at) return;
    onMarkRead?.(item.id);
  }, [item, onMarkRead]);

  const action = useMemo(() => (item ? resolveMasterNotificationAction(item) : null), [item]);
  const summary = useMemo(() => (item ? parseNotificationSummary(item) : []), [item]);

  const isNew = item ? !item.read_at : false;

  const goToAction = () => {
    if (!action) return;
    onClose();
    navigate(action.to);
  };

  return (
    <AdminBottomSheet
      open={Boolean(item)}
      onClose={onClose}
      variant="catalog"
      badge={isNew ? 'Новое' : undefined}
      title={item?.title ?? 'Уведомление'}
      subtitle={item ? formatNotificationListTime(item.created_at) : undefined}
      footer={
        action ? (
          <div className="flex w-full flex-col gap-2 sm:flex-row">
            <button type="button" onClick={onClose} className={catalogSheetSecondaryBtn}>
              Закрыть
            </button>
            <button type="button" onClick={goToAction} className={catalogSheetPrimaryBtn}>
              {action.label}
            </button>
          </div>
        ) : (
          <button type="button" onClick={onClose} className={catalogSheetPrimaryBtn}>
            Понятно
          </button>
        )
      }
    >
      {item ? (
        <div className="space-y-4">
          <div className="rounded-[10px] bg-white px-4 py-4 ring-1 ring-[#EEEEEE]">
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

          {summary.length > 0 ? (
            <div className="rounded-[10px] bg-white px-4 ring-1 ring-[#EEEEEE]">
              {summary.map((row) => (
                <SummaryRow key={row.label} label={row.label} value={row.value} />
              ))}
            </div>
          ) : null}

          <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-[#374151]">{item.body}</p>

          {action ? (
            <p className="text-[13px] font-medium text-[#6B7280]">
              Нажмите «{action.label}», чтобы перейти к записи и принять решение по заявке.
            </p>
          ) : null}
        </div>
      ) : null}
    </AdminBottomSheet>
  );
}
