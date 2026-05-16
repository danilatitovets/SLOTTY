import { Link } from 'react-router-dom';
import {
  HiBanknotes,
  HiBell,
  HiCalendar,
  HiClock,
  HiStar,
  HiUsers,
  HiWallet,
} from 'react-icons/hi2';
import { appointmentStatusLabel } from '../../../features/master/model/demoMasterAppointments';
import {
  overviewCard,
  overviewCardPad,
  overviewIconCircle,
  overviewPinkBtn,
} from './adminOverviewTheme';
import type { ClientAnalytics, ReputationAnalytics, RevenueAnalytics } from './overviewAnalytics';
import { formatAppointmentWhenRu, formatBynRu } from './overviewFormat';
import {
  OverviewBarChart,
  OverviewEmptyState,
  OverviewHeroEmpty,
  OverviewMetricCard,
  OverviewStatRow,
} from './OverviewSharedUi';

type SummaryProps = {
  metrics: {
    totalRevenue: number;
    totalVisits: number;
    nearest: import('../../../features/master/model/demoMasterAppointments').DemoMasterAppointment | null;
    hasAny: boolean;
  };
  serviceCount: number;
  appointmentsPath: string;
  onOpenNearest: () => void;
};

export function OverviewSummaryPanel({
  metrics,
  serviceCount,
  appointmentsPath,
  onOpenNearest,
}: SummaryProps) {
  if (!metrics.hasAny) {
    return <OverviewHeroEmpty />;
  }

  const { totalRevenue, totalVisits, nearest } = metrics;
  const completedEstimate = totalVisits > 0 ? Math.round(totalRevenue / totalVisits) : 0;

  return (
    <div className="space-y-4 animate-[fadeIn_0.25s_ease-out]">
      <div className="grid grid-cols-2 gap-3">
        <OverviewMetricCard
          icon={<HiWallet className="h-5 w-5" aria-hidden />}
          label="Доход"
          value={formatBynRu(totalRevenue)}
        />
        <OverviewMetricCard
          icon={<HiCalendar className="h-5 w-5" aria-hidden />}
          label="Записей"
          value={String(totalVisits)}
        />
      </div>

      <div className={`${overviewCard} ${overviewCardPad}`}>
        <p className="text-[13px] font-medium text-[#6B7280]">Кратко за период</p>
        <div className="mt-2 divide-y divide-[#EAECEF]">
          <OverviewStatRow label="Услуг в каталоге" value={String(serviceCount)} />
          <OverviewStatRow
            label="Средний чек"
            value={completedEstimate > 0 ? formatBynRu(completedEstimate) : '—'}
            hint="оценка по активным записям"
          />
        </div>
      </div>

      <div className={`${overviewCard} ${overviewCardPad}`}>
        {nearest ? (
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <span className={overviewIconCircle}>
                <HiClock className="h-5 w-5" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-medium text-[#6B7280]">Ближайшая запись</p>
                <p className="mt-1 text-[17px] font-semibold text-[#111827]">{nearest.clientName}</p>
                <p className="mt-1 text-[14px] text-[#6B7280]">{nearest.serviceTitle}</p>
                <p className="mt-1 text-[13px] font-medium text-[#111827]">
                  {formatAppointmentWhenRu(nearest.date, nearest.time)}
                </p>
                <p className="mt-1 text-[15px] font-semibold text-[#F47C8C]">{formatBynRu(nearest.priceByn)}</p>
                <span className="mt-2 inline-flex rounded-full bg-[#F7F7F8] px-3 py-1 text-[11px] font-semibold text-[#6B7280]">
                  {appointmentStatusLabel(nearest.status)}
                </span>
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={onOpenNearest}
                className={`flex min-h-11 flex-1 items-center justify-center text-[14px] font-semibold ${overviewPinkBtn}`}
              >
                Открыть
              </button>
              <Link
                to={appointmentsPath}
                className="flex min-h-11 flex-1 items-center justify-center rounded-full bg-[#F7F7F8] text-[14px] font-semibold text-[#111827] transition hover:bg-[#F3F4F6] active:scale-[0.98]"
              >
                Все записи
              </Link>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <span className={overviewIconCircle}>
              <HiBell className="h-5 w-5" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-semibold text-[#111827]">Ближайшая запись</p>
              <p className="mt-1 text-[13px] text-[#6B7280]">Ближайших записей нет</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function OverviewRevenuePanel({ data }: { data: RevenueAnalytics }) {
  if (!data.hasRevenue && data.unpaidCount === 0) {
    return (
      <OverviewEmptyState
        icon={<HiWallet className="h-6 w-6" aria-hidden />}
        title="Дохода пока нет"
        text="Когда появятся оплаченные записи, здесь будет график дохода."
      />
    );
  }

  return (
    <div className="space-y-4 animate-[fadeIn_0.25s_ease-out]">
      <OverviewMetricCard
        icon={<HiBanknotes className="h-5 w-5" aria-hidden />}
        label="Доход за период"
        value={formatBynRu(data.totalRevenue)}
        valueClassName="text-[#F47C8C]"
      />

      <div className={`${overviewCard} ${overviewCardPad}`}>
        <h2 className="text-[16px] font-semibold text-[#111827]">Доход по дням</h2>
        <p className="mt-1 text-[12px] text-[#6B7280]">Данные за выбранный период</p>
        <div className="mt-4">
          <OverviewBarChart stats={data.dayStats} mode="revenue" emptyHint="Дохода за период нет" />
        </div>
        {data.chartIsTruncated ? (
          <p className="mt-3 text-[11px] leading-snug text-[#9CA3AF]">
            График показывает последние 90 дней; суммы — за весь выбранный период.
          </p>
        ) : null}
      </div>

      <div className={`${overviewCard} ${overviewCardPad}`}>
        <h2 className="text-[16px] font-semibold text-[#111827]">Детализация</h2>
        <div className="mt-2 divide-y divide-[#EAECEF]">
          <OverviewStatRow
            label="Средний чек"
            value={data.completedCount > 0 ? formatBynRu(data.avgCheck) : '—'}
          />
          <OverviewStatRow
            label="Оплачено"
            value={formatBynRu(data.paidAmount)}
            hint={`${data.paidCount} завершённых`}
          />
          <OverviewStatRow
            label="Не оплачено"
            value={formatBynRu(data.unpaidAmount)}
            hint={`${data.unpaidCount} ожидают визита`}
          />
        </div>
      </div>
    </div>
  );
}

export function OverviewClientsPanel({ data }: { data: ClientAnalytics }) {
  if (!data.hasData) {
    return (
      <OverviewEmptyState
        icon={<HiUsers className="h-6 w-6" aria-hidden />}
        title="Клиентов пока нет"
        text="Новые клиенты появятся здесь после первых записей."
      />
    );
  }

  return (
    <div className="space-y-4 animate-[fadeIn_0.25s_ease-out]">
      <div className="grid grid-cols-3 gap-2">
        <OverviewMetricCard
          icon={<HiUsers className="h-5 w-5" aria-hidden />}
          label="Новые"
          value={String(data.newClients)}
          sub="за период"
        />
        <OverviewMetricCard
          icon={<HiUsers className="h-5 w-5" aria-hidden />}
          label="Повторные"
          value={String(data.repeatClients)}
          sub="за период"
        />
        <OverviewMetricCard
          icon={<HiUsers className="h-5 w-5" aria-hidden />}
          label="Всего"
          value={String(data.totalClients)}
          sub="уникальных"
        />
      </div>

      <div className={`${overviewCard} ${overviewCardPad}`}>
        <h2 className="text-[16px] font-semibold text-[#111827]">Динамика клиентов</h2>
        <p className="mt-1 text-[12px] text-[#6B7280]">Активность записей по дням</p>
        <div className="mt-4">
          <OverviewBarChart stats={data.visitsPerDay} mode="visits" emptyHint="Записей за период нет" />
        </div>
      </div>
    </div>
  );
}

export function OverviewReputationPanel({ data }: { data: ReputationAnalytics }) {
  if (!data.hasReviews) {
    return (
      <OverviewEmptyState
        icon={<HiStar className="h-6 w-6" aria-hidden />}
        title="Отзывов пока нет"
        text="После первых отзывов здесь появится рейтинг мастера."
      />
    );
  }

  return (
    <div className="space-y-4">
      <OverviewMetricCard
        icon={<HiStar className="h-5 w-5" aria-hidden />}
        label="Средний рейтинг"
        value={data.averageRating?.toFixed(1) ?? '—'}
      />
    </div>
  );
}

