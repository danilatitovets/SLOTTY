import { useMemo, type MouseEvent } from 'react';
import { HiBell, HiChevronRight } from 'react-icons/hi2';
import { useNavigate } from 'react-router-dom';
import { formatNotificationListTime } from '../../../features/notifications/formatNotificationTime';
import { resolveClientNotificationAction } from '../../../features/notifications/clientNotificationAction';
import type { MeNotificationRow } from '../../../features/profile/api/clientNotifications';
import { notificationsRowClass, notificationsRowIconClass } from './clientNotificationsTheme';

type Props = {
  item: MeNotificationRow;
  onOpen: (item: MeNotificationRow) => void;
  onMarkRead?: (id: string) => void;
};

export function ClientNotificationCard({ item, onOpen, onMarkRead }: Props) {
  const navigate = useNavigate();
  const action = useMemo(() => resolveClientNotificationAction(item), [item]);
  const isNew = !item.read_at;

  const openDetail = () => {
    if (!item.read_at) onMarkRead?.(item.id);
    onOpen(item);
  };

  const openAction = (e: MouseEvent) => {
    e.stopPropagation();
    if (!action) return;
    if (!item.read_at) onMarkRead?.(item.id);
    navigate(action.to);
  };

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={openDetail}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openDetail();
        }
      }}
      className={`${notificationsRowClass} cursor-pointer ${isNew ? 'bg-[#FAFAFA]' : ''}`}
    >
      <span className={notificationsRowIconClass} aria-hidden>
        <HiBell className="h-[18px] w-[18px] shrink-0" />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <p className="min-w-0 flex-1 text-[15px] font-bold leading-snug text-[#111827]">{item.title}</p>
          <time className="shrink-0 pt-0.5 text-[12px] font-medium tabular-nums text-[#9CA3AF]">
            {formatNotificationListTime(item.created_at)}
          </time>
        </div>
        <p className="mt-0.5 line-clamp-2 text-[13px] leading-snug text-[#6B7280]">{item.body}</p>
        {action ? (
          <button
            type="button"
            onClick={openAction}
            className="mt-2 inline-flex text-[13px] font-bold text-[#F47C8C] transition hover:text-[#e86b7c]"
          >
            {action.label} →
          </button>
        ) : (
          <p className="mt-2 text-[12px] font-semibold text-[#9CA3AF]">Подробнее</p>
        )}
      </div>

      {isNew ? (
        <span className="h-2 w-2 shrink-0 rounded-full bg-[#F47C8C]" aria-label="Непрочитано" />
      ) : null}

      <HiChevronRight className="h-5 w-5 shrink-0 text-[#D1D5DB]" aria-hidden />
    </article>
  );
}
