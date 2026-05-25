import { sheetSegmentClass } from '../profile/adminProfileCabinetTheme';
import { notifListToolbar, notifTrayLabel } from './adminNotificationsTheme';

export type NotificationsFilter = 'all' | 'unread';

type Props = {
  filter: NotificationsFilter;
  onFilter: (filter: NotificationsFilter) => void;
  unreadCount: number;
  totalCount: number;
  onMarkAllRead?: () => void;
};

export function NotificationsFilterBar({
  filter,
  onFilter,
  unreadCount,
  totalCount,
  onMarkAllRead,
}: Props) {
  const chips: Array<{ id: NotificationsFilter; label: string; count?: number }> = [
    { id: 'all', label: 'Все', count: totalCount },
    { id: 'unread', label: 'Новые', count: unreadCount },
  ];

  return (
    <div className={notifListToolbar}>
      <div className="flex items-center justify-between gap-3">
        <p className={notifTrayLabel}>Лента</p>
        {onMarkAllRead ? (
          <button
            type="button"
            onClick={onMarkAllRead}
            className="shrink-0 text-[13px] font-semibold text-[#F47C8C] transition hover:opacity-80 active:scale-[0.98]"
          >
            Прочитать все
          </button>
        ) : null}
      </div>

      <div
        className="mt-3 grid grid-cols-2 gap-1.5 rounded-[10px] bg-[#F5F5F5] p-1.5"
        role="tablist"
        aria-label="Фильтр уведомлений"
      >
        {chips.map((chip) => {
          const active = filter === chip.id;
          return (
            <button
              key={chip.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onFilter(chip.id)}
              className={`flex min-h-11 items-center justify-center gap-2 ${sheetSegmentClass(active)}`}
            >
              <span>{chip.label}</span>
              {chip.count != null && chip.count > 0 ? (
                <span
                  className={`min-w-[1.25rem] rounded-full px-1.5 py-0.5 text-[11px] font-bold tabular-nums ${
                    active ? 'bg-white/25 text-white' : 'bg-[#EBEBEB] text-[#6B7280]'
                  }`}
                >
                  {chip.count > 99 ? '99+' : chip.count}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
