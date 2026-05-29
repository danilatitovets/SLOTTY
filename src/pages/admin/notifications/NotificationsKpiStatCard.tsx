import type { ReactNode } from 'react';
import { overviewDesktopKpiTile } from '../overview/adminOverviewTheme';
import { notifKpiIcon } from './adminNotificationsTheme';

type Props = {
  label: string;
  value: string;
  hint?: string;
  icon: ReactNode;
  accentValue?: boolean;
};

export function NotificationsKpiStatCard({ label, value, hint, icon, accentValue }: Props) {
  return (
    <article className={`${overviewDesktopKpiTile} flex min-h-[6.5rem] flex-col justify-between`}>
      <div className="flex items-start justify-between gap-3">
        <p className="min-w-0 flex-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#9CA3AF]">
          {label}
        </p>
        <span className={`${notifKpiIcon} h-9 w-9 rounded-[12px]`}>{icon}</span>
      </div>
      <div className="min-w-0">
        <p
          className={`truncate text-[1.5rem] font-bold tabular-nums leading-none tracking-[-0.04em] sm:text-[1.65rem] ${
            accentValue ? 'text-[#F47C8C]' : 'text-[#111827]'
          }`}
        >
          {value}
        </p>
        {hint ? (
          <p className="mt-1 line-clamp-2 text-[12px] font-medium text-[#6B7280]">{hint}</p>
        ) : null}
      </div>
    </article>
  );
}
