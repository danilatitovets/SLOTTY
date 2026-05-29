import { type ReactNode } from 'react';
import {
  HiArrowTrendingUp,
  HiCalendar,
  HiCheckCircle,
  HiUserGroup,
  HiUserPlus,
} from 'react-icons/hi2';
import type {
  ClientAnalytics,
  OverviewClientRosterItem,
  OverviewPeriodPreset,
} from './overviewAnalytics';
import { overviewPeriodLabel } from './overviewAnalytics';
import { formatDdMm } from './overviewFormat';
import {
  MINI_PICTURE,
  overviewDesktopCard,
  overviewDesktopCardPad,
  overviewIconCircle,
} from './adminOverviewTheme';
import { OverviewKpiCarousel, OverviewKpiStatCard } from './OverviewKpiBlocks';
import {
  OverviewClientsDynamicsChart,
  OverviewDividedMetricsRow,
  OverviewEmptyMetricCell,
  OverviewEmptyTabHero,
  OverviewMetricHeroPlaque,
  overviewHairline,
} from './OverviewSharedUi';

function clampPercent(value: number) {
  return Math.min(100, Math.max(0, value));
}

function getClientPercents(newClients: number, repeatClients: number) {
  const total = Math.max(newClients + repeatClients, 1);
  const newPercent = Math.round((newClients / total) * 100);
  const repeatPercent = 100 - newPercent;

  return {
    newPercent,
    repeatPercent,
  };
}

function SoftIcon({
  children,
  tone = 'pink',
}: {
  children: ReactNode;
  tone?: 'pink' | 'violet' | 'green';
}) {
  const toneClass =
    tone === 'violet'
      ? 'bg-[#F5F3FF] text-[#A78BFA]'
      : tone === 'green'
        ? 'bg-[#ECFDF3] text-[#22C55E]'
        : 'bg-[#FFF1F4] text-[#ff5f7a]';

  return (
    <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] ${toneClass}`}>
      {children}
    </span>
  );
}

function visitCountLabel(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return 'визит';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return 'визита';
  return 'визитов';
}

function ClientsDividedMetricsStrip({
  newClients,
  repeatClients,
  totalClients,
}: {
  newClients: number;
  repeatClients: number;
  totalClients: number;
}) {
  return (
    <OverviewDividedMetricsRow>
      <OverviewEmptyMetricCell
        label="Новые"
        value={String(newClients)}
        hint="Первый визит"
      />
      <OverviewEmptyMetricCell
        label="Повторные"
        value={String(repeatClients)}
        hint="Возвращаются"
      />
      <OverviewEmptyMetricCell label="Всего" value={String(totalClients)} hint="Уникальных" />
    </OverviewDividedMetricsRow>
  );
}

function ClientsRosterList({ roster }: { roster: OverviewClientRosterItem[] }) {
  if (!roster.length) return null;

  return (
    <ul className="m-0 list-none p-0">
      {roster.map((client) => (
        <li key={client.key} className={`border-b ${overviewHairline} last:border-b-0`}>
          <div className="flex items-center gap-3 px-5 py-3.5 sm:px-6 sm:py-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F6F7FB] text-[14px] font-bold text-[#6B7280]">
              {client.name.charAt(0).toUpperCase()}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] font-bold text-[#111827]">{client.name}</p>
              <p className="mt-0.5 text-[12px] font-medium text-[#9CA3AF]">
                {client.isRepeat ? 'Повторный' : 'Новый'} · {client.visits}{' '}
                {visitCountLabel(client.visits)}
              </p>
            </div>
            <p className="shrink-0 text-[12px] font-semibold tabular-nums text-[#6B7280]">
              {formatDdMm(client.lastVisitDate)}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}

function ClientsMetricsAndRosterCard({ data }: { data: ClientAnalytics }) {
  return (
    <section className={`overflow-hidden ${overviewDesktopCard}`}>
      <ClientsDividedMetricsStrip
        newClients={data.newClients}
        repeatClients={data.repeatClients}
        totalClients={data.totalClients}
      />
      <div className={`border-t ${overviewHairline}`}>
        <ClientsRosterList roster={data.roster} />
      </div>
    </section>
  );
}

function ClientsMetricsCarousel({
  newClients,
  repeatClients,
  totalClients,
}: {
  newClients: number;
  repeatClients: number;
  totalClients: number;
}) {
  return (
    <OverviewKpiCarousel>
      <OverviewKpiStatCard
        surface="carousel"
        label="Новые"
        value={String(newClients)}
        hint="Клиенты с первым визитом"
        icon={<HiUserPlus className="h-5 w-5" aria-hidden />}
      />
      <OverviewKpiStatCard
        surface="carousel"
        label="Повторные"
        value={String(repeatClients)}
        hint="Клиенты, которые возвращаются"
        icon={<HiArrowTrendingUp className="h-5 w-5" aria-hidden />}
      />
      <OverviewKpiStatCard
        surface="carousel"
        label="Всего"
        value={String(totalClients)}
        hint="Уникальных клиентов"
        icon={<HiCheckCircle className="h-5 w-5" aria-hidden />}
      />
    </OverviewKpiCarousel>
  );
}

function PercentLine({
  label,
  value,
  percent,
  tone,
}: {
  label: string;
  value: number;
  percent: number;
  tone: 'pink' | 'violet';
}) {
  const barClass = tone === 'pink' ? 'bg-[#ff5f7a]' : 'bg-[#A78BFA]';
  const bgClass = tone === 'pink' ? 'bg-[#FFE8EE]' : 'bg-[#F5F3FF]';
  const textClass = tone === 'pink' ? 'text-[#ff5f7a]' : 'text-[#A78BFA]';

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <div>
          <p className="text-[14px] font-black text-[#111827]">{label}</p>
          <p className="mt-0.5 text-[12px] font-semibold text-[#9CA3AF]">
            {value} клиентов
          </p>
        </div>

        <span className={`text-[18px] font-black tracking-[-0.04em] ${textClass}`}>
          {percent}%
        </span>
      </div>

      <div className={`h-3 overflow-hidden rounded-full ${bgClass}`}>
        <div
          className={`h-full rounded-full ${barClass} transition-all duration-500`}
          style={{ width: `${clampPercent(percent)}%` }}
        />
      </div>
    </div>
  );
}

function ClientsHeroPlaque({
  data,
  periodPreset,
}: {
  data: ClientAnalytics;
  periodPreset: OverviewPeriodPreset;
}) {
  const period = overviewPeriodLabel(periodPreset);

  return (
    <OverviewMetricHeroPlaque
      value={
        <p className="text-[48px] font-black leading-none tabular-nums tracking-[-0.08em] text-[#111827] lg:text-[64px]">
          {data.totalClients}
        </p>
      }
      caption={
        <p className="max-w-[660px] text-[15px] font-semibold leading-relaxed text-[#6B7280] lg:text-[16px]">
          Уникальные клиенты за {period.toLowerCase()}. Видно, кто пришёл впервые, а кто уже
          возвращается.
        </p>
      }
    />
  );
}

function ClientsHeroShell({
  data,
  periodPreset,
  children,
}: {
  data: ClientAnalytics;
  periodPreset: OverviewPeriodPreset;
  children?: ReactNode;
}) {
  return (
    <div className={`overflow-hidden ${overviewDesktopCard}`}>
      <ClientsHeroPlaque data={data} periodPreset={periodPreset} />
      <div className="overflow-hidden bg-white px-3 pb-4 pt-1 sm:px-4">{children}</div>
    </div>
  );
}

function ClientsBalanceCard({
  newClients,
  repeatClients,
}: {
  newClients: number;
  repeatClients: number;
}) {
  const { newPercent, repeatPercent } = getClientPercents(newClients, repeatClients);

  return (
    <section className={`${overviewDesktopCard} ${overviewDesktopCardPad} h-full`}>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-[22px] font-black tracking-[-0.05em] text-[#111827]">
            Тип клиентов
          </h2>
          <p className="mt-1 text-[13px] font-semibold text-[#6B7280]">
            Помогает понять, насколько клиенты возвращаются.
          </p>
        </div>

        <SoftIcon>
          <HiUserGroup className="h-6 w-6" aria-hidden />
        </SoftIcon>
      </div>

      <div className="space-y-6">
        <PercentLine
          label="Новые клиенты"
          value={newClients}
          percent={newPercent}
          tone="pink"
        />

        <PercentLine
          label="Повторные клиенты"
          value={repeatClients}
          percent={repeatPercent}
          tone="violet"
        />
      </div>

      <div className="mt-6 rounded-[12px] bg-[#F6F7FB] p-5 ring-1 ring-[#EEEEEE]/80 lg:rounded-[16px] lg:ring-0">
        <p className="text-[14px] font-black text-[#111827]">Что важно смотреть?</p>
        <p className="mt-2 text-[13px] leading-6 text-[#6B7280]">
          Если повторных клиентов становится больше — значит, профиль, качество услуг
          и запись работают хорошо.
        </p>
      </div>
    </section>
  );
}

function ClientsDynamicsSection({
  clientsPerDay,
  chartIsTruncated,
}: {
  clientsPerDay: ClientAnalytics['clientsPerDay'];
  chartIsTruncated: boolean;
}) {
  return (
    <section className={`${overviewDesktopCard} ${overviewDesktopCardPad}`}>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-[22px] font-black tracking-[-0.05em] text-[#111827]">
            Динамика клиентов
          </h2>
          <p className="mt-1 text-[13px] font-semibold text-[#6B7280]">
            Новые и повторные клиенты по дням.
          </p>
        </div>

        <span className={`${overviewIconCircle} h-11 w-11 shrink-0 rounded-[18px]`}>
          <HiCalendar className="h-5 w-5" aria-hidden />
        </span>
      </div>

      <OverviewClientsDynamicsChart stats={clientsPerDay} />

      {chartIsTruncated ? (
        <p className="mt-4 text-[12px] leading-snug text-[#9CA3AF]">
          График показывает последние 90 дней, итоги — за весь выбранный период.
        </p>
      ) : null}
    </section>
  );
}

function ClientsTrustCard() {
  return (
    <section className={`${overviewDesktopCard} ${overviewDesktopCardPad}`}>
      <div className="flex items-start justify-between gap-4 lg:gap-6">
        <div className="flex min-w-0 flex-1 items-start gap-3 sm:gap-4">
          <SoftIcon tone="green">
            <HiCheckCircle className="h-6 w-6" aria-hidden />
          </SoftIcon>

          <div className="min-w-0">
            <h2 className="text-[20px] font-black tracking-[-0.05em] text-[#111827] sm:text-[22px]">
              Клиенты возвращаются
            </h2>
            <p className="mt-3 max-w-[42rem] text-[14px] leading-7 text-[#6B7280]">
              Повторные записи — главный показатель доверия к мастеру.
            </p>
          </div>
        </div>

        <img
          src={MINI_PICTURE.clientsEmpty}
          alt=""
          decoding="async"
          className="h-[72px] w-auto max-w-[38%] shrink-0 object-contain object-top sm:h-[100px] sm:max-w-none lg:h-[112px]"
        />
      </div>
    </section>
  );
}

function EmptyClientsPanel({
  data,
  periodPreset,
}: {
  data: ClientAnalytics;
  periodPreset: OverviewPeriodPreset;
}) {
  const period = overviewPeriodLabel(periodPreset);

  return (
    <div className="min-w-0 space-y-6 overflow-x-hidden lg:space-y-8">
      <OverviewEmptyTabHero
        metrics={
          <ClientsDividedMetricsStrip newClients={0} repeatClients={0} totalClients={0} />
        }
        list={
          data.roster.length > 0 ? <ClientsRosterList roster={data.roster} /> : undefined
        }
        title="Клиентов пока нет"
        caption={`Когда появятся первые записи, здесь будет аналитика по новым и повторным клиентам за ${period.toLowerCase()}.`}
      />

      <ClientsDynamicsSection
        clientsPerDay={data.clientsPerDay}
        chartIsTruncated={data.chartIsTruncated}
      />
    </div>
  );
}

export function OverviewClientsPanel({
  data,
  periodPreset,
}: {
  data: ClientAnalytics;
  periodPreset: OverviewPeriodPreset;
}) {
  if (!data.hasData) {
    return <EmptyClientsPanel data={data} periodPreset={periodPreset} />;
  }

  return (
    <div className="min-w-0 space-y-6 overflow-x-hidden lg:space-y-8">
      <ClientsHeroShell data={data} periodPreset={periodPreset}>
        <ClientsMetricsCarousel
          newClients={data.newClients}
          repeatClients={data.repeatClients}
          totalClients={data.totalClients}
        />
      </ClientsHeroShell>

      <ClientsMetricsAndRosterCard data={data} />

      <ClientsDynamicsSection
        clientsPerDay={data.clientsPerDay}
        chartIsTruncated={data.chartIsTruncated}
      />

      <section className="grid gap-5 lg:grid-cols-2 lg:items-stretch">
        <ClientsBalanceCard
          newClients={data.newClients}
          repeatClients={data.repeatClients}
        />

        <ClientsTrustCard />
      </section>
    </div>
  );
}
