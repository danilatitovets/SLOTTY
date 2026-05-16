import type { ReactNode } from 'react';
import {
  HiArrowTrendingUp,
  HiCalendarDays,
  HiChartBarSquare,
  HiCloud,
  HiStar,
  HiUsers,
  HiWallet,
} from 'react-icons/hi2';
import type { OverviewDayStat } from '../../../features/master/model/demoMasterAppointments';
import {
  overviewCard,
  overviewCardPad,
  overviewEmptyIllustrationSrc,
  overviewIconCircle,
  overviewMutedSurface,
} from './adminOverviewTheme';
import { formatDdMm } from './overviewFormat';

export const OVERVIEW_ANALYTICS_TAB_BAR_HEIGHT = '5.75rem';

export function chartAxisIndices(n: number): number[] {
  if (n <= 0) return [];
  if (n === 1) return [0];
  if (n === 2) return [0, 1];
  return [0, Math.floor((n - 1) / 2), n - 1];
}

export function OverviewMetricCard({
  icon,
  label,
  value,
  sub,
  valueClassName = 'text-[#111827]',
}: {
  icon: ReactNode;
  label: string;
  value: string;
  sub?: string;
  valueClassName?: string;
}) {
  return (
    <div className={`${overviewCard} flex min-w-0 items-center gap-3 p-4`}>
      <span className={overviewIconCircle}>{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-[12px] font-medium text-[#6B7280]">{label}</p>
        <p className={`mt-0.5 truncate text-[18px] font-semibold tabular-nums tracking-tight ${valueClassName}`}>
          {value}
        </p>
        {sub ? <p className="mt-0.5 text-[11px] font-medium text-[#9CA3AF]">{sub}</p> : null}
      </div>
    </div>
  );
}

export function OverviewStatRow({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5">
      <div className="min-w-0">
        <p className="text-[14px] font-medium text-[#111827]">{label}</p>
        {hint ? <p className="mt-0.5 text-[12px] text-[#6B7280]">{hint}</p> : null}
      </div>
      <p className="shrink-0 text-[15px] font-semibold tabular-nums text-[#111827]">{value}</p>
    </div>
  );
}

export function OverviewEmptyState({
  icon,
  title,
  text,
  action,
}: {
  icon: ReactNode;
  title: string;
  text: string;
  action?: ReactNode;
}) {
  return (
    <div className={`${overviewCard} ${overviewCardPad} text-center`}>
      <span className={`${overviewIconCircle} mx-auto h-14 w-14`}>{icon}</span>
      <h3 className="mt-4 text-[17px] font-semibold tracking-[-0.03em] text-[#111827]">{title}</h3>
      <p className="mx-auto mt-2 max-w-[19rem] text-[13px] leading-relaxed text-[#6B7280]">{text}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function OverviewHeroEmpty() {
  return (
    <div className={`${overviewCard} ${overviewCardPad} text-center`}>
      <img
        src={overviewEmptyIllustrationSrc}
        alt=""
        width={280}
        height={240}
        decoding="async"
        className="mx-auto w-full max-w-[220px] object-contain"
      />
      <h2 className="mt-4 text-[17px] font-semibold tracking-[-0.03em] text-[#111827]">
        За выбранный период данных нет
      </h2>
      <p className="mx-auto mt-2 max-w-[18rem] text-[13px] leading-relaxed text-[#6B7280]">
        Попробуйте другой период или дождитесь первых записей.
      </p>
    </div>
  );
}

export function OverviewBarChart({
  stats,
  mode,
  emptyHint,
}: {
  stats: OverviewDayStat[];
  mode: 'revenue' | 'visits';
  emptyHint: string;
}) {
  const values = stats.map((s) => (mode === 'revenue' ? s.completedRevenue : s.activeVisits));
  const max = Math.max(1, ...values);
  const hasAny = values.some((v) => v > 0);
  const EmptyIcon = mode === 'revenue' ? HiCloud : HiCalendarDays;
  const axisIdx = chartAxisIndices(stats.length);

  return (
    <div>
      <div className={`relative min-h-[11rem] ${overviewMutedSurface} p-3`}>
        <div className="pointer-events-none absolute inset-x-3 top-3 bottom-3 flex flex-col justify-between">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="border-t border-dashed border-[#E5E7EB]" />
          ))}
        </div>
        {!hasAny ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-4 text-center">
            <EmptyIcon className="h-10 w-10 text-[#D1D5DB]" aria-hidden />
            <p className="text-[13px] font-medium text-[#6B7280]">{emptyHint}</p>
          </div>
        ) : (
          <div className="relative flex h-44 items-end gap-0.5 px-1">
            {stats.map((s) => {
              const v = mode === 'revenue' ? s.completedRevenue : s.activeVisits;
              const h = Math.max((v / max) * 100, v > 0 ? 10 : 4);
              return (
                <div
                  key={s.date}
                  className="flex h-full min-w-0 flex-1 flex-col justify-end"
                  title={`${s.date}: ${mode === 'revenue' ? `${v} BYN` : `${v} записей`}`}
                >
                  <div
                    className={`mx-auto w-[min(100%,12px)] rounded-t-lg transition ${
                      v > 0 ? 'bg-gradient-to-t from-[#F47C8C] to-[#F9A8B4]' : 'bg-[#E5E7EB]'
                    }`}
                    style={{ height: `${h}%`, minHeight: v > 0 ? 6 : 3 }}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
      {hasAny && stats.length > 0 ? (
        <div className="mt-3 flex justify-between px-1 text-[11px] font-medium text-[#9CA3AF]">
          {axisIdx.map((i) => (
            <span key={`${stats[i].date}-${mode}`} className="tabular-nums">
              {formatDdMm(stats[i].date)}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export const overviewTabIcons = {
  summary: HiChartBarSquare,
  revenue: HiWallet,
  clients: HiUsers,
  reputation: HiStar,
} as const;

export function OverviewTrendBadge({ trend }: { trend: 'up' | 'down' | 'flat' | null }) {
  if (!trend || trend === 'flat') return null;
  const up = trend === 'up';
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
        up ? 'bg-[#ECFDF3] text-[#22C55E]' : 'bg-[#FEF2F2] text-[#EF4444]'
      }`}
    >
      <HiArrowTrendingUp className={`h-3.5 w-3.5 ${up ? '' : 'rotate-180'}`} aria-hidden />
      {up ? 'рост' : 'снижение'}
    </span>
  );
}

