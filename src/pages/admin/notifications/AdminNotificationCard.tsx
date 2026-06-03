import { useMemo, type MouseEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiBellAlert } from 'react-icons/hi2';
import type { MeNotificationRow } from '../../../features/profile/api/clientNotifications';
import { formatNotificationListTime } from '../../../features/notifications/formatNotificationTime';
import {
  notifBadgeNew,
  notifCardBody,
  notifCardContent,
  notifCardShellInteractive,
  notifIconFallback,
  notifIconStrip,
  notifIconStripRead,
  notifIconStripUnread,
  notifMetaAccent,
} from './adminNotificationsTheme';
import { resolveMasterNotificationAction } from './notificationAction';

function notificationIconClass(type: string): string {
  switch (type) {
    case 'appointment_cancelled':
      return 'bg-[#FFF7ED] text-[#EA580C] ring-[#FED7AA]';
    case 'appointment_reminder':
      return 'bg-[#EFF6FF] text-[#2563EB] ring-[#BFDBFE]';
    case 'billing':
      return 'bg-[#F5F3FF] text-[#7C3AED] ring-[#DDD6FE]';
    case 'appointment_new':
    case 'appointment_pending':
      return 'bg-[#FFF1F4] text-[#F47C8C] ring-[#FDE8ED]';
    default:
      return '';
  }
}

type Props = {
  item: MeNotificationRow;
  index?: number;
  onOpen: (item: MeNotificationRow) => void;
  onMarkRead?: (id: string) => void;
};

export function AdminNotificationCard({ item, index = 0, onOpen, onMarkRead }: Props) {
  const navigate = useNavigate();
  const action = useMemo(() => resolveMasterNotificationAction(item), [item]);
  const isNew = !item.read_at;
  const typeIconClass = notificationIconClass(item.type);
  const iconWrap = typeIconClass
    ? `${notifIconFallback} h-10 w-10 ${typeIconClass}`
    : `${notifIconFallback} h-10 w-10`;

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
      onClick={() => onOpen(item)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen(item);
        }
      }}
      className={notifCardShellInteractive}
      style={{ animationDelay: `${index * 40}ms` }}
    >
      <div className={notifCardBody}>
        <div className={`${notifIconStrip} ${isNew ? notifIconStripUnread : notifIconStripRead}`}>
          <span className={iconWrap}>
            <HiBellAlert className="h-5 w-5" aria-hidden />
          </span>
        </div>

        <div className={notifCardContent}>
          <div className="flex items-start justify-between gap-2">
            <p className="min-w-0 flex-1 text-[15px] font-bold leading-snug text-[#111827] lg:text-[16px]">
              {item.title}
            </p>
            <div className="flex shrink-0 flex-col items-end gap-1">
              {isNew ? <span className={notifBadgeNew}>Новое</span> : null}
              <time
                className={`text-[12px] tabular-nums ${isNew ? notifMetaAccent : 'font-medium text-[#9CA3AF]'}`}
              >
                {formatNotificationListTime(item.created_at)}
              </time>
            </div>
          </div>
          <p className="mt-1.5 line-clamp-2 text-[14px] leading-snug text-[#6B7280]">{item.body}</p>
          {action ? (
            <button
              type="button"
              onClick={openAction}
              className="mt-2.5 inline-flex text-[13px] font-bold text-[#F47C8C] transition hover:text-[#e86b7c]"
            >
              {action.label} →
            </button>
          ) : (
            <p className="mt-2 text-[12px] font-semibold text-[#9CA3AF]">Подробнее</p>
          )}
        </div>
      </div>
    </article>
  );
}
