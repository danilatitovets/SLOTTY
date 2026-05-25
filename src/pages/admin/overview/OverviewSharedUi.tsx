import { type ReactNode } from 'react';
import {
  HiArrowTrendingUp,
  HiChartBarSquare,
  HiStar,
  HiUsers,
  HiWallet,
} from 'react-icons/hi2';
import {
  OVERVIEW_WELCOME_IMAGE_SRC,
  overviewCard,
  overviewCardPad,
  overviewEmptyIllustrationSrc,
  overviewIconCircle,
} from './adminOverviewTheme';

export { OverviewLineChart } from './OverviewLineChart';
export { OverviewClientsDynamicsChart } from './OverviewClientsDynamicsChart';

export const OVERVIEW_ANALYTICS_TAB_BAR_HEIGHT = '5.75rem';

/** Компактная KPI-карточка для узкой сетки 3×1 (экран «Обзор»). */
export function OverviewWelcomeBanner({ displayName }: { displayName: string }) {
  const first = displayName.trim().split(/\s+/)[0] || 'Мастер';

  return (
    <div
      className={`${overviewCard} relative overflow-hidden p-5 sm:p-6`}
    >
      <div className="relative z-10 max-w-[min(100%,28rem)]">
        <p className="text-[18px] font-bold tracking-[-0.03em] text-[#111827] sm:text-[20px]">
          Привет, {first}! 👋
        </p>
        <p className="mt-2 text-[14px] leading-relaxed text-[#6B7280]">
          У вас всё под контролем. Вот ваша сводка на сегодня.
        </p>
      </div>
      <img
        src={OVERVIEW_WELCOME_IMAGE_SRC}
        alt=""
        width={280}
        height={200}
        decoding="async"
        className="pointer-events-none absolute -bottom-2 right-0 hidden h-[140px] w-auto max-w-[45%] object-contain object-bottom sm:block lg:h-[160px]"
      />
    </div>
  );
}

export function OverviewLatestActivity({
  items,
}: {
  items: Array<{ icon: ReactNode; text: string }>;
}) {
  return (
    <section className={`${overviewCard} ${overviewCardPad}`}>
      <h2 className="text-[17px] font-bold tracking-[-0.03em] text-[#111827]">Последняя активность</h2>
      <ul className="mt-4 space-y-3">
        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-3">
            <span className={overviewIconCircle}>{item.icon}</span>
            <span className="text-[14px] font-medium text-[#6B7280]">{item.text}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function OverviewScheduleFillCard({ percent }: { percent: number }) {
  return (
    <div className={`${overviewCard} ${overviewCardPad} flex h-full flex-col justify-between`}>
      <div>
        <p className="text-[13px] font-semibold text-[#6B7280]">Заполненность расписания</p>
        <p className="mt-1 text-[15px] font-bold text-[#111827]">Сегодня {percent}%</p>
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#f6f7fb]">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#ff6f88] to-[#ff5f7a] transition-[width] duration-500"
          style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
        />
      </div>
    </div>
  );
}

export function OverviewIncomeSummaryCard({
  totalRevenue,
  totalVisits,
  serviceCount,
  avgCheck,
}: {
  totalRevenue: string;
  totalVisits: number;
  serviceCount: number;
  avgCheck: string;
}) {
  return (
    <div className={`${overviewCard} ${overviewCardPad} flex h-full flex-col`}>
      <p className="text-[13px] font-semibold text-[#6B7280]">Доход за период</p>
      <p className="mt-1 text-[26px] font-bold tabular-nums tracking-[-0.04em] text-[#111827] lg:text-[28px]">
        {totalRevenue}
      </p>
      <div className="mt-auto space-y-2 pt-4 text-[13px] text-[#6B7280]">
        <p>
          <span className="font-semibold text-[#111827]">Записей:</span> {totalVisits}
        </p>
        <p>
          <span className="font-semibold text-[#111827]">Услуг:</span> {serviceCount}
        </p>
        <p>
          <span className="font-semibold text-[#111827]">Средний чек:</span> {avgCheck}
        </p>
      </div>
    </div>
  );
}

export function OverviewCompactMetricCard({
  icon,
  label,
  value,
  sub,
  valueClassName = 'text-[#111827]',
}: {
  icon: ReactNode;
  label: string;
  value: string;
  sub?: ReactNode;
  valueClassName?: string;
}) {
  const compactValue = value.length > 5;
  const compactLabel = label.length > 9;

  return (
    <div
      className={`${overviewCard} flex min-h-[7.75rem] min-w-0 flex-1 flex-col items-center justify-center px-2 py-3.5 text-center`}
    >
      <span className={`${overviewIconCircle} h-9 w-9`}>{icon}</span>

      <p
        className={`mt-2 flex min-h-[26px] max-w-full items-center justify-center px-0.5 font-semibold leading-tight text-[#6B7280] ${
          compactLabel ? 'text-[10px]' : 'text-[11px]'
        }`}
      >
        {label}
      </p>

      <p
        className={`flex min-h-[22px] max-w-full items-center justify-center px-0.5 font-bold tabular-nums leading-none tracking-[-0.03em] ${valueClassName} ${
          compactValue ? 'text-[13px]' : 'text-[17px]'
        }`}
      >
        {value}
      </p>

      {sub ? (
        <p className="mt-1 flex min-h-[14px] max-w-full items-center justify-center px-0.5 text-[10px] font-medium leading-tight text-[#9CA3AF]">
          {sub}
        </p>
      ) : (
        <span className="mt-1 block min-h-[14px]" aria-hidden />
      )}
    </div>
  );
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
        <p className="text-[12px] font-semibold text-[#6B7280]">{label}</p>
        <p
          className={`mt-0.5 truncate text-[20px] font-bold tabular-nums tracking-[-0.04em] ${valueClassName}`}
        >
          {value}
        </p>
        {sub ? <p className="mt-0.5 text-[11px] font-medium text-[#9CA3AF]">{sub}</p> : null}
      </div>
    </div>
  );
}

export function OverviewWideMetricCard({
  icon,
  label,
  value,
  sub,
  badge,
  valueClassName = 'text-[#111827]',
}: {
  icon: ReactNode;
  label: string;
  value: string;
  sub?: string;
  badge?: ReactNode;
  valueClassName?: string;
}) {
  return (
    <div className={`${overviewCard} ${overviewCardPad} relative overflow-hidden`}>
      <div
        className="pointer-events-none absolute -right-10 -top-10 hidden h-32 w-32 rounded-full bg-[#FFF1F4] lg:block"
        aria-hidden
      />

      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[13px] font-semibold text-[#6B7280]">{label}</p>
          <p
            className={`mt-1 break-words text-[26px] font-bold tabular-nums tracking-[-0.06em] sm:text-[32px] sm:tracking-[-0.07em] ${valueClassName}`}
          >
            {value}
          </p>
          {sub ? <p className="mt-1 text-[12px] font-medium text-[#6B7280]">{sub}</p> : null}
          {badge ? <div className="mt-3">{badge}</div> : null}
        </div>

        <span className={`${overviewIconCircle} h-14 w-14 rounded-[20px]`}>{icon}</span>
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
    <div className="flex items-center justify-between gap-3 py-3">
      <div className="min-w-0">
        <p className="text-[14px] font-semibold text-[#111827]">{label}</p>
        {hint ? <p className="mt-0.5 text-[12px] leading-snug text-[#6B7280]">{hint}</p> : null}
      </div>

      <p className="shrink-0 text-[15px] font-bold tabular-nums text-[#111827]">{value}</p>
    </div>
  );
}

export function OverviewSectionCard({
  title,
  subtitle,
  icon,
  action,
  children,
}: {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className={`${overviewCard} ${overviewCardPad}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          {icon ? <span className={overviewIconCircle}>{icon}</span> : null}

          <div className="min-w-0">
            <h2 className="text-[17px] font-bold tracking-[-0.04em] text-[#111827]">{title}</h2>
            {subtitle ? (
              <p className="mt-1 text-[12px] leading-relaxed text-[#6B7280]">{subtitle}</p>
            ) : null}
          </div>
        </div>

        {action ? <div className="shrink-0">{action}</div> : null}
      </div>

      <div className="mt-4">{children}</div>
    </section>
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
      <span className={`${overviewIconCircle} mx-auto h-16 w-16 rounded-[22px]`}>{icon}</span>

      <h3 className="mt-4 text-[19px] font-bold tracking-[-0.05em] text-[#111827]">{title}</h3>

      <p className="mx-auto mt-2 max-w-[20rem] text-[13px] leading-relaxed text-[#6B7280]">
        {text}
      </p>

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
        className="mx-auto w-full max-w-[210px] object-contain"
      />

      <h2 className="mt-3 text-[19px] font-bold tracking-[-0.05em] text-[#111827]">
        За выбранный период данных нет
      </h2>

      <p className="mx-auto mt-2 max-w-[19rem] text-[13px] leading-relaxed text-[#6B7280]">
        Попробуйте выбрать другой период или дождитесь первых записей и платежей.
      </p>
    </div>
  );
}

export { OverviewInteractiveBarChart as OverviewBarChart } from './OverviewInteractiveBarChart';


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
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${
        up ? 'bg-[#ECFDF3] text-[#22C55E]' : 'bg-[#FEF2F2] text-[#EF4444]'
      }`}
    >
      <HiArrowTrendingUp className={`h-3.5 w-3.5 ${up ? '' : 'rotate-180'}`} aria-hidden />
      {up ? 'рост' : 'снижение'}
    </span>
  );
}