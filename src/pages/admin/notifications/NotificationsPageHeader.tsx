import { Link } from 'react-router-dom';
import { ADMIN_PATH } from '../../../app/paths';
import { NotificationsDesktopHero } from './NotificationsDesktopHero';

type Props = {
  unreadCount: number;
  totalCount: number;
};

export function NotificationsPageHeader({ unreadCount, totalCount }: Props) {
  return (
    <div className="space-y-3">
      <Link
        to={ADMIN_PATH}
        className="inline-flex min-h-10 items-center text-[14px] font-semibold text-[#6B7280] transition hover:text-[#111827] lg:hidden"
      >
        ← Профиль мастера
      </Link>
      <div className="pb-4 lg:pb-0">
        <NotificationsDesktopHero unreadCount={unreadCount} totalCount={totalCount} />
      </div>
    </div>
  );
}
