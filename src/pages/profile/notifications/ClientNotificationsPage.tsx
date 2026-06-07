import { useMemo, useState } from 'react';
import { useAuth } from '../../../features/auth/AuthProvider';
import { useClientCabinetMobileTabNav } from '../clientProfile/clientCabinetMobileTabs';
import { ClientCabinetMobileShell } from '../clientProfile/ClientCabinetMobileShell';
import { useClientNotifications } from './ClientNotificationsContext';
import { useIsMasterUser } from '../../../features/profile/hooks/useIsMasterUser';
import { LoadingVideo } from '../../../shared/ui/LoadingVideo';
import { ClientCabinetDesktopShell } from '../clientProfile/ClientCabinetDesktopShell';
import { ClientNotificationCard } from './ClientNotificationCard';
import { ClientNotificationDetailSheet } from './ClientNotificationDetailSheet';
import { ClientNotificationsEmptyState } from './ClientNotificationsEmptyState';
import {
  ClientNotificationsFilterBar,
  type ClientNotificationsFilter,
} from './ClientNotificationsFilterBar';
import { ClientNotificationsHero } from './ClientNotificationsHero';
import {
  clientNotificationsErrorBox,
  clientNotificationsLoadingPanel,
  clientNotificationsPrimaryBtn,
} from './clientNotificationsTheme';

export function ClientNotificationsPage() {
  const { isAuthenticated, backendConfigured } = useAuth();
  const isMasterCabinet = useIsMasterUser();
  const enabled = isAuthenticated && backendConfigured;
  const { activeTab, selectTab } = useClientCabinetMobileTabNav();
  const { notifications, initialLoading, error, reload, markAsRead, markAllAsRead, unreadCount } =
    useClientNotifications();
  const [filter, setFilter] = useState<ClientNotificationsFilter>('all');
  const [selected, setSelected] = useState<(typeof notifications)[number] | null>(null);

  const selectedItem = useMemo(() => {
    if (!selected) return null;
    return notifications.find((n) => n.id === selected.id) ?? selected;
  }, [notifications, selected]);

  const filtered = useMemo(() => {
    if (filter === 'unread') return notifications.filter((n) => !n.read_at);
    return notifications;
  }, [filter, notifications]);

  const filterBar =
    !initialLoading && !error && notifications.length > 0 ? (
      <ClientNotificationsFilterBar
        filter={filter}
        onFilter={setFilter}
        unreadCount={unreadCount}
        totalCount={notifications.length}
        onMarkAllRead={unreadCount > 0 ? () => void markAllAsRead() : undefined}
      />
    ) : null;

  const listBody = !enabled ? (
    <ClientNotificationsEmptyState
      title="Войдите в аккаунт"
      text="Уведомления о записях появятся после входа в SLOTTY."
    />
  ) : error ? (
    <div className="space-y-3">
      <p className={clientNotificationsErrorBox}>{error}</p>
      <button type="button" onClick={() => void reload()} className={clientNotificationsPrimaryBtn}>
        Повторить
      </button>
    </div>
  ) : initialLoading ? (
    <div className={clientNotificationsLoadingPanel}>
      <LoadingVideo size="md" />
    </div>
  ) : notifications.length === 0 ? (
    <ClientNotificationsEmptyState
      title="Пока тихо"
      text={
        isMasterCabinet
          ? 'Здесь только уведомления клиента. Уведомления о заявках и записях мастера — во вкладке «Мастер» вверху.'
          : 'Когда появятся новости о записях, они окажутся здесь.'
      }
    />
  ) : filtered.length === 0 ? (
    <ClientNotificationsEmptyState
      title="Новых нет"
      text="Все уведомления уже прочитаны — переключитесь на «Все», чтобы увидеть историю."
    />
  ) : (
    <ul className="flex flex-col gap-2.5 lg:gap-3">
      {filtered.map((item, index) => (
        <li key={item.id}>
          <ClientNotificationCard
            item={item}
            index={index}
            onOpen={setSelected}
            onMarkRead={(id) => void markAsRead(id)}
          />
        </li>
      ))}
    </ul>
  );

  const content = (
    <div className="space-y-4 pb-4 lg:space-y-5">
      <ClientNotificationsHero unreadCount={unreadCount} totalCount={notifications.length} />
      {filterBar}
      {listBody}
    </div>
  );

  return (
    <>
      <ClientCabinetMobileShell
        grayCanvas
        showMainTabs
        mainTab={activeTab}
        onSelectTab={selectTab}
      >
        {content}
      </ClientCabinetMobileShell>

      <ClientCabinetDesktopShell title="Уведомления">{content}</ClientCabinetDesktopShell>

      <ClientNotificationDetailSheet
        item={selectedItem}
        onClose={() => setSelected(null)}
        onMarkRead={(id) => void markAsRead(id)}
      />
    </>
  );
}
