import { Link } from 'react-router-dom';
import { HiBellAlert } from 'react-icons/hi2';
import { ADMIN_NOTIFICATIONS_PATH } from '../../../app/paths';
import { useAdminNotifications } from './AdminNotificationsContext';
import { notifIconFallback, notifProfileBanner } from './adminNotificationsTheme';

export function AdminNotificationsBanner() {
  const { hasUnread, unreadCount, notifications } = useAdminNotifications();
  if (!hasUnread) return null;

  const latest = notifications.find((n) => !n.read_at) ?? notifications[0];
  if (!latest) return null;

  return (
    <Link to={ADMIN_NOTIFICATIONS_PATH} className={notifProfileBanner}>
      <span className={`mt-0.5 ${notifIconFallback} h-10 w-10`}>
        <HiBellAlert className="h-5 w-5" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center justify-between gap-2">
          <span className="text-[15px] font-bold text-[#111827]">
            {unreadCount === 1 ? 'Новое уведомление' : `${unreadCount} новых уведомления`}
          </span>
          <span className="shrink-0 text-[13px] font-semibold text-[#F47C8C]">Открыть</span>
        </span>
        <span className="mt-1 block truncate text-[14px] text-[#6B7280]">{latest.title}</span>
      </span>
    </Link>
  );
}
