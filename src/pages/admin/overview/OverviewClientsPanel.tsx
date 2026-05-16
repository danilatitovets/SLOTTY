import { HiCalendar, HiUsers } from 'react-icons/hi2';
import type { ClientAnalytics } from './overviewAnalytics';
import {
  OverviewClientsDynamicsChart,
  OverviewCompactMetricCard,
  OverviewEmptyState,
  OverviewSectionCard,
  OverviewWideMetricCard,
} from './OverviewSharedUi';

function ClientsDynamicsSection({
  clientsPerDay,
  chartIsTruncated,
}: {
  clientsPerDay: ClientAnalytics['clientsPerDay'];
  chartIsTruncated: boolean;
}) {
  return (
    <OverviewSectionCard
      title="Динамика клиентов"
      subtitle="Новые и повторные по дням"
      icon={<HiCalendar className="h-5 w-5" aria-hidden />}
    >
      <OverviewClientsDynamicsChart stats={clientsPerDay} />

      {chartIsTruncated ? (
        <p className="mt-3 text-[11px] leading-snug text-[#9CA3AF]">
          График показывает последние 90 дней, итоги — за весь выбранный период.
        </p>
      ) : null}
    </OverviewSectionCard>
  );
}

function ClientsTypeBreakdown({
  newClients,
  repeatClients,
}: {
  newClients: number;
  repeatClients: number;
}) {
  const totalShown = Math.max(newClients + repeatClients, 1);
  const newPercent = Math.round((newClients / totalShown) * 100);
  const repeatPercent = 100 - newPercent;

  return (
    <div className="space-y-4">
      <div>
        <div className="mb-2 flex items-center justify-between text-[13px] font-bold text-[#111827]">
          <span>Новые</span>
          <span className="text-[#F47C8C]">{newPercent}%</span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-[#F3F4F6]">
          <div className="h-full rounded-full bg-[#F47C8C]" style={{ width: `${newPercent}%` }} />
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between text-[13px] font-bold text-[#111827]">
          <span>Повторные</span>
          <span className="text-[#A78BFA]">{repeatPercent}%</span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-[#F3F4F6]">
          <div className="h-full rounded-full bg-[#A78BFA]" style={{ width: `${repeatPercent}%` }} />
        </div>
      </div>

    </div>
  );
}

export function OverviewClientsPanel({ data }: { data: ClientAnalytics }) {
  if (!data.hasData) {
    return (
      <div className="min-w-0 space-y-4 overflow-x-hidden">
        <OverviewEmptyState
          icon={<HiUsers className="h-7 w-7" aria-hidden />}
          title="Клиентов пока нет"
          text="Новые клиенты появятся здесь после первых записей."
        />

        <OverviewSectionCard
          title="Клиентская аналитика"
          subtitle="Новые и повторные клиенты за период"
          icon={<HiUsers className="h-5 w-5" aria-hidden />}
        >
          <div className="grid min-w-0 grid-cols-3 gap-2">
            <OverviewCompactMetricCard
              icon={<HiUsers className="h-[18px] w-[18px]" aria-hidden />}
              label="Новые"
              value="0"
              sub="за период"
            />
            <OverviewCompactMetricCard
              icon={<HiUsers className="h-[18px] w-[18px]" aria-hidden />}
              label="Повторные"
              value="0"
              sub="за период"
            />
            <OverviewCompactMetricCard
              icon={<HiUsers className="h-[18px] w-[18px]" aria-hidden />}
              label="Всего"
              value="0"
              sub="уникальных"
            />
          </div>
        </OverviewSectionCard>

        <ClientsDynamicsSection
          clientsPerDay={data.clientsPerDay}
          chartIsTruncated={data.chartIsTruncated}
        />

      </div>
    );
  }

  const totalShown = Math.max(data.newClients + data.repeatClients, 1);
  const newPercent = Math.round((data.newClients / totalShown) * 100);
  const repeatPercent = 100 - newPercent;

  return (
    <div className="min-w-0 space-y-4 overflow-x-hidden">
      <OverviewWideMetricCard
        icon={<HiUsers className="h-7 w-7" aria-hidden />}
        label="Всего клиентов"
        value={String(data.totalClients)}
        sub="Уникальные клиенты за выбранный период"
        badge={
          data.repeatClients > 0 ? (
            <span className="inline-flex rounded-full bg-[#F5F3FF] px-3 py-1 text-[12px] font-bold text-[#A78BFA]">
              {repeatPercent}% повторных
            </span>
          ) : data.newClients > 0 ? (
            <span className="inline-flex rounded-full bg-[#FFF1F4] px-3 py-1 text-[12px] font-bold text-[#F47C8C]">
              {newPercent}% новых
            </span>
          ) : null
        }
      />

      <div className="grid min-w-0 grid-cols-3 gap-2">
        <OverviewCompactMetricCard
          icon={<HiUsers className="h-[18px] w-[18px]" aria-hidden />}
          label="Новые"
          value={String(data.newClients)}
          sub="первый визит"
          valueClassName="text-[#F47C8C]"
        />
        <OverviewCompactMetricCard
          icon={<HiUsers className="h-[18px] w-[18px]" aria-hidden />}
          label="Повторные"
          value={String(data.repeatClients)}
          sub="возвращаются"
          valueClassName="text-[#A78BFA]"
        />
        <OverviewCompactMetricCard
          icon={<HiUsers className="h-[18px] w-[18px]" aria-hidden />}
          label="Всего"
          value={String(data.totalClients)}
          sub="уникальных"
        />
      </div>

      <ClientsDynamicsSection
        clientsPerDay={data.clientsPerDay}
        chartIsTruncated={data.chartIsTruncated}
      />

      <OverviewSectionCard
        title="Тип клиентов"
        subtitle="Доля новых и повторных за период"
        icon={<HiUsers className="h-5 w-5" aria-hidden />}
      >
        <ClientsTypeBreakdown newClients={data.newClients} repeatClients={data.repeatClients} />
      </OverviewSectionCard>
    </div>
  );
}
