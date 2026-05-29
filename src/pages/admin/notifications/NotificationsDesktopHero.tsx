import { HiBellAlert, HiCheckBadge, HiInbox } from 'react-icons/hi2';
import { notificationsDesktopCard } from './adminNotificationsTheme';
import { NotificationsKpiStatCard } from './NotificationsKpiStatCard';

type Props = {
  unreadCount: number;
  totalCount: number;
};

export function NotificationsDesktopHero({ unreadCount, totalCount }: Props) {
  const readCount = Math.max(0, totalCount - unreadCount);
  const subtitle =
    unreadCount === 0
      ? 'Все прочитаны — новые появятся здесь'
      : unreadCount === 1
        ? '1 непрочитанное уведомление'
        : `${unreadCount} непрочитанных`;

  return (
    <section className={`${notificationsDesktopCard} p-4 sm:p-5 lg:p-6`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-[22px] font-bold tracking-[-0.03em] text-[#111827] sm:text-[24px]">
            Уведомления
          </h1>
          <p className="mt-1.5 text-[14px] font-medium leading-snug text-[#6B7280]">{subtitle}</p>
        </div>
        {unreadCount > 0 ? (
          <span className="shrink-0 rounded-full bg-[#FFF1F4] px-3 py-1.5 text-[13px] font-semibold text-[#F47C8C] ring-1 ring-[#FDE8ED]">
            {unreadCount} новых
          </span>
        ) : null}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-3 sm:gap-3">
        <NotificationsKpiStatCard
          label="Новые"
          value={String(unreadCount)}
          hint="Ждут просмотра"
          accentValue={unreadCount > 0}
          icon={<HiBellAlert className="h-5 w-5" aria-hidden />}
        />
        <NotificationsKpiStatCard
          label="Всего"
          value={String(totalCount)}
          hint="В ленте"
          icon={<HiInbox className="h-5 w-5" aria-hidden />}
        />
        <NotificationsKpiStatCard
          label="Прочитано"
          value={String(readCount)}
          hint="Уже открыты"
          icon={<HiCheckBadge className="h-5 w-5" aria-hidden />}
        />
      </div>
    </section>
  );
}
