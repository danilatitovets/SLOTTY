import { useEffect, useMemo } from 'react';
import { HiBell, HiXMark } from 'react-icons/hi2';
import { useNavigate } from 'react-router-dom';
import { formatNotificationListTime } from '../../../features/notifications/formatNotificationTime';
import { parseNotificationSummary } from '../../../features/notifications/parseNotificationSummary';
import { resolveClientNotificationAction } from '../../../features/notifications/clientNotificationAction';
import type { MeNotificationRow } from '../../../features/profile/api/clientNotifications';
import { ProfileSheetShell } from '../components/ProfileSheetShell';
import { catalogPrimaryBtn, catalogSecondaryBtn } from '../clientProfile/clientProfileTheme';

function notificationTypeLabel(type: string): string {
  switch (type) {
    case 'appointment_pending':
      return 'Заявка';
    case 'appointment_confirmed':
      return 'Подтверждение';
    case 'appointment_cancelled':
      return 'Отмена';
    case 'appointment_reminder':
      return 'Напоминание';
    case 'review_request':
      return 'Отзыв';
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

export function ClientNotificationDetailSheet({ item, onClose, onMarkRead }: Props) {
  const navigate = useNavigate();

  useEffect(() => {
    if (!item?.id || item.read_at) return;
    onMarkRead?.(item.id);
  }, [item, onMarkRead]);

  const action = useMemo(() => (item ? resolveClientNotificationAction(item) : null), [item]);
  const summary = useMemo(() => (item ? parseNotificationSummary(item) : []), [item]);

  if (!item) return null;

  const goToAction = () => {
    if (!action) return;
    onClose();
    navigate(action.to);
  };

  return (
    <ProfileSheetShell onClose={onClose} labelledBy="client-notification-detail-title">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {!item.read_at ? (
            <span className="mb-2 inline-flex rounded-full bg-[#FFF1F4] px-2.5 py-1 text-[11px] font-bold text-[#F47C8C]">
              Новое
            </span>
          ) : null}
          <p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-[#9CA3AF]">
            {notificationTypeLabel(item.type)}
          </p>
          <h2
            id="client-notification-detail-title"
            className="mt-1 text-[20px] font-bold leading-snug tracking-[-0.03em] text-[#111827]"
          >
            {item.title}
          </h2>
          <time className="mt-1 block text-[13px] font-medium text-[#9CA3AF]">
            {formatNotificationListTime(item.created_at)}
          </time>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-[#F5F5F5] text-[#6B7280] transition hover:bg-[#EBEBEB]"
          aria-label="Закрыть"
        >
          <HiXMark className="h-5 w-5" aria-hidden />
        </button>
      </div>

      <div className="mt-5 flex items-start gap-3 rounded-[14px] bg-[#F5F5F5] px-4 py-3.5">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] bg-white text-[#111827] ring-1 ring-[#EEEEEE]">
          <HiBell className="h-5 w-5" aria-hidden />
        </span>
        <p className="min-w-0 pt-1 text-[15px] leading-relaxed text-[#374151]">{item.body}</p>
      </div>

      {summary.length > 0 ? (
        <div className="mt-4 rounded-[14px] bg-white px-4 ring-1 ring-[#EEEEEE]">
          {summary.map((row) => (
            <SummaryRow key={row.label} label={row.label} value={row.value} />
          ))}
        </div>
      ) : null}

      <div className="mt-6 flex flex-col gap-2 sm:flex-row">
        {action ? (
          <>
            <button type="button" onClick={onClose} className={`${catalogSecondaryBtn} flex-1`}>
              Закрыть
            </button>
            <button type="button" onClick={goToAction} className={`${catalogPrimaryBtn} flex-1`}>
              {action.label}
            </button>
          </>
        ) : (
          <button type="button" onClick={onClose} className={`${catalogPrimaryBtn} w-full`}>
            Понятно
          </button>
        )}
      </div>
    </ProfileSheetShell>
  );
}
