import { useMemo, useState } from 'react';
import { HiBellAlert } from 'react-icons/hi2';
import type { MeNotificationRow } from '../../../features/profile/api/clientNotifications';
import { LoadingVideo } from '../../../shared/ui/LoadingVideo';
import { useAdminMasterCabinet } from '../AdminMasterCabinetContext';
import { AdminNotificationCard } from './AdminNotificationCard';
import { AdminNotificationDetailSheet } from './AdminNotificationDetailSheet';
import { useAdminNotifications } from './AdminNotificationsContext';
import {
  NOTIFICATIONS_PAGE_BG,
  notifEmptyIcon,
  notifErrorBox,
  notifLoadingCard,
  notifPinkBtn,
  notificationsShellCard,
} from './adminNotificationsTheme';
import { NotificationsEmptyState } from './NotificationsEmptyState';
import { NotificationsFilterBar, type NotificationsFilter } from './NotificationsFilterBar';
import { NotificationsPageHeader } from './NotificationsPageHeader';

export function AdminNotificationsPage() {
  const { useCabinetApi } = useAdminMasterCabinet();
  const { notifications, loading, error, reload, unreadCount, markAsRead, markAllAsRead } =
    useAdminNotifications();
  const [filter, setFilter] = useState<NotificationsFilter>('all');
  const [selected, setSelected] = useState<MeNotificationRow | null>(null);

  const selectedItem = useMemo(() => {
    if (!selected) return null;
    return notifications.find((n) => n.id === selected.id) ?? selected;
  }, [notifications, selected]);

  const filtered = useMemo(() => {
    if (filter === 'unread') return notifications.filter((n) => !n.read_at);
    return notifications;
  }, [filter, notifications]);

  const content = !useCabinetApi ? (
    <NotificationsEmptyState
      title="Нужен аккаунт мастера"
      text="Уведомления приходят с сервера после входа в кабинет с подключённым API."
    />
  ) : error ? (
    <div className="space-y-3">
      <p className={notifErrorBox}>{error}</p>
      <button type="button" onClick={() => void reload()} className={notifPinkBtn}>
        Повторить
      </button>
    </div>
  ) : loading ? (
    <div className={notifLoadingCard}>
      <LoadingVideo size="md" />
    </div>
  ) : notifications.length === 0 ? (
    <NotificationsEmptyState
      title="Пока тихо"
      text="Когда появятся новости о записях и кабинете, они окажутся здесь."
      icon={
        <span className={notifEmptyIcon}>
          <HiBellAlert className="h-8 w-8" aria-hidden />
        </span>
      }
    />
  ) : filtered.length === 0 ? (
    <NotificationsEmptyState
      title="Новых нет"
      text="Все уведомления уже прочитаны — переключитесь на «Все», чтобы увидеть историю."
    />
  ) : (
    <ul className="flex flex-col gap-2.5 lg:gap-3">
      {filtered.map((item, index) => (
        <li key={item.id}>
          <AdminNotificationCard
            item={item}
            index={index}
            onOpen={setSelected}
            onMarkRead={(id) => void markAsRead(id)}
          />
        </li>
      ))}
    </ul>
  );

  const filterBar =
    useCabinetApi && !loading && !error && notifications.length > 0 ? (
      <NotificationsFilterBar
        filter={filter}
        onFilter={setFilter}
        unreadCount={unreadCount}
        totalCount={notifications.length}
        onMarkAllRead={unreadCount > 0 ? () => void markAllAsRead() : undefined}
      />
    ) : null;

  const mobileBody = (
    <section
      className={`-mx-4 min-w-0 space-y-4 px-4 pb-8 lg:hidden ${NOTIFICATIONS_PAGE_BG}`}
    >
      <NotificationsPageHeader unreadCount={unreadCount} totalCount={notifications.length} />
      {filterBar}
      {content}
    </section>
  );

  const desktopBody = (
    <div className={`${notificationsShellCard} space-y-5`}>
      <NotificationsPageHeader unreadCount={unreadCount} totalCount={notifications.length} />
      {filterBar}
      <div className="min-w-0">{content}</div>
    </div>
  );

  return (
    <>
      {mobileBody}
      {desktopBody}
      <AdminNotificationDetailSheet
        item={selectedItem}
        onClose={() => setSelected(null)}
        onMarkRead={(id) => void markAsRead(id)}
      />
    </>
  );
}
