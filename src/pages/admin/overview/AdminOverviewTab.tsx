import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  HiBanknotes,
  HiBell,
  HiCalendar,
  HiCalendarDays,
  HiChevronDown,
  HiCloud,
  HiSquares2X2,
} from 'react-icons/hi2';
import type { MasterDraft } from '../../../features/profile/lib/demoMasterStorage';
import {
  aggregateOverviewByDay,
  appointmentStatusLabel,
  clampOverviewRangeEnd,
  countActiveVisitsBetween,
  pickNearestUpcomingAppointment,
  sumCompletedRevenueBetween,
  OVERVIEW_MAX_RANGE_DAYS,
  type DemoMasterAppointment,
  type OverviewDayStat,
} from '../../../features/master/model/demoMasterAppointments';
import { AdminCalendarSheet, formatRuDate } from '../shared/AdminCalendarSheet';
import {
  overviewCard,
  overviewCardPad,
  overviewEmptyIllustrationSrc,
  overviewIconCircle,
  overviewMutedSurface,
  overviewPinkBtn,
  overviewPinkOutline,
} from './adminOverviewTheme';
import {
  defaultOverviewLast30Days,
  formatAppointmentWhenRu,
  formatBynRu,
  formatDdMm,
  overviewAppointmentBounds,
  overviewChartWindow,
} from './overviewFormat';

type Props = {
  draft: MasterDraft;
  appointments: DemoMasterAppointment[];
  appointmentsPath: string;
  onOpenAppointment: (a: DemoMasterAppointment) => void;
};

/** Заложено под Supabase: пока false — скелетон не показываем. */
const isLoading = false;

function chartAxisIndices(n: number): number[] {
  if (n <= 0) return [];
  if (n === 1) return [0];
  if (n === 2) return [0, 1];
  return [0, Math.floor((n - 1) / 2), n - 1];
}

function BarBlock({
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

  return (
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
  );
}

function OverviewKpiCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className={`${overviewCard} flex min-w-0 items-center gap-2.5 p-3`}>
      <span className={`${overviewIconCircle} h-9 w-9`}>{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-medium text-[#6B7280]">{label}</p>
        <p className="mt-0.5 truncate text-[15px] font-semibold tabular-nums tracking-tight text-[#111827]">
          {value}
        </p>
        <p className="mt-0.5 text-[10px] font-medium text-[#9CA3AF]">{sub ?? 'за период'}</p>
      </div>
    </div>
  );
}

function OverviewEmptyHero() {
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
        Попробуйте выбрать другой период или дождитесь первых записей.
      </p>
    </div>
  );
}


function OverviewSkeleton() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="h-28 rounded-[30px] bg-neutral-200/70" />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="h-28 rounded-[30px] bg-neutral-200/70" />
        <div className="h-28 rounded-[30px] bg-neutral-200/70" />
        <div className="h-28 rounded-[30px] bg-neutral-200/70" />
      </div>
      <div className="h-56 rounded-[30px] bg-neutral-200/70" />
      <div className="h-56 rounded-[30px] bg-neutral-200/70" />
      <div className="h-40 rounded-[30px] bg-neutral-200/70" />
    </div>
  );
}

type PeriodMode = 'all' | 'custom';

export function AdminOverviewTab({ draft, appointments, appointmentsPath, onOpenAppointment }: Props) {
  const initial = useMemo(() => defaultOverviewLast30Days(), []);
  const [periodMode, setPeriodMode] = useState<PeriodMode>('all');
  const [showPeriodControls, setShowPeriodControls] = useState(false);
  const [from, setFrom] = useState(initial.start);
  const [to, setTo] = useState(initial.end);
  const [datePicker, setDatePicker] = useState<null | 'from' | 'to'>(null);
  const [rangeCapped, setRangeCapped] = useState(false);

  const reportRange = useMemo(() => {
    if (periodMode === 'all') return overviewAppointmentBounds(appointments);
    return { start: from, end: to };
  }, [appointments, from, periodMode, to]);

  const chartRange = useMemo(
    () => overviewChartWindow(reportRange.start, reportRange.end, OVERVIEW_MAX_RANGE_DAYS),
    [reportRange.end, reportRange.start],
  );

  const chartIsTruncated = chartRange.chartStart > reportRange.start;

  const applyRange = useCallback(() => {
    setRangeCapped(false);
    if (!from || !to) return;
    let a = from;
    let b = to;
    if (a > b) [a, b] = [b, a];
    const bClamped = clampOverviewRangeEnd(a, b);
    if (bClamped !== b) setRangeCapped(true);
    setFrom(a);
    setTo(bClamped);
  }, [from, to]);

  const togglePeriodDetails = useCallback(() => {
    if (showPeriodControls) {
      setShowPeriodControls(false);
      return;
    }
    if (periodMode === 'all') {
      const b = overviewAppointmentBounds(appointments);
      setFrom(b.start);
      setTo(b.end);
    }
    setShowPeriodControls(true);
  }, [appointments, periodMode, showPeriodControls]);

  const onShowCustomRange = useCallback(() => {
    applyRange();
    setPeriodMode('custom');
    setShowPeriodControls(false);
  }, [applyRange]);

  const appointmentsInRange = useMemo(
    () => appointments.filter((r) => r.date >= reportRange.start && r.date <= reportRange.end),
    [appointments, reportRange.end, reportRange.start],
  );
  const hasAnyAppointmentInRange = appointmentsInRange.length > 0;

  const dayStats = useMemo(
    () => aggregateOverviewByDay(appointments, chartRange.chartStart, chartRange.chartEnd),
    [appointments, chartRange.chartEnd, chartRange.chartStart],
  );

  const totalRevenue = useMemo(
    () => sumCompletedRevenueBetween(appointments, reportRange.start, reportRange.end),
    [appointments, reportRange.end, reportRange.start],
  );
  const totalVisits = useMemo(
    () => countActiveVisitsBetween(appointments, reportRange.start, reportRange.end),
    [appointments, reportRange.end, reportRange.start],
  );

  const nearest = useMemo(
    () => pickNearestUpcomingAppointment(appointments),
    [appointments],
  );

  const serviceCount = draft.services?.length ?? 0;

  const axisIdx = useMemo(() => chartAxisIndices(dayStats.length), [dayStats.length]);

  const periodLabel =
    periodMode === 'all' ? 'За всё время' : `${formatRuDate(from)} — ${formatRuDate(to)}`;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 pb-1">
        <div className="w-11 shrink-0" aria-hidden />
        <h1 className="flex-1 text-center text-[18px] font-semibold tracking-[-0.03em] text-[#111827]">
          Сводка
        </h1>
        <button
          type="button"
          onClick={togglePeriodDetails}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-[#111827] shadow-[0_4px_16px_rgba(17,24,39,0.06)] transition hover:bg-[#F7F7F8] active:scale-[0.97]"
          aria-label="Выбрать период"
        >
          <HiCalendar className="h-5 w-5" aria-hidden />
        </button>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={togglePeriodDetails}
          className={`${overviewCard} flex min-w-0 flex-1 items-center gap-3 p-4 text-left transition active:scale-[0.99]`}
        >
          <span className={overviewIconCircle}>
            <HiCalendar className="h-5 w-5" aria-hidden />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[12px] font-medium text-[#6B7280]">Период</span>
            <span className="mt-0.5 block truncate text-[15px] font-semibold text-[#111827]">{periodLabel}</span>
          </span>
          <HiChevronDown className="h-4 w-4 shrink-0 text-[#9CA3AF]" aria-hidden />
        </button>
        <button type="button" onClick={togglePeriodDetails} className={overviewPinkOutline}>
          {showPeriodControls ? 'Скрыть' : 'Подробнее'}
        </button>
      </div>

      {showPeriodControls ? (
        <div className={`${overviewCard} ${overviewCardPad} space-y-3`}>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => {
                setPeriodMode('all');
                setRangeCapped(false);
                setShowPeriodControls(false);
              }}
              className="text-[13px] font-semibold text-[#F47C8C] transition hover:text-[#F26D83]"
            >
              За всё время
            </button>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
            <div className="block min-w-[10rem] flex-1">
              <span className="text-[12px] font-medium text-[#6B7280]">С</span>
              <button
                type="button"
                onClick={() => setDatePicker('from')}
                className={`mt-1.5 flex min-h-11 w-full items-center justify-between ${overviewMutedSurface} px-4 py-2.5 text-left text-[15px] font-medium text-[#111827] transition active:scale-[0.99]`}
              >
                {formatRuDate(from)}
                <HiChevronDown className="h-4 w-4 text-[#9CA3AF]" aria-hidden />
              </button>
            </div>
            <div className="block min-w-[10rem] flex-1">
              <span className="text-[12px] font-medium text-[#6B7280]">По</span>
              <button
                type="button"
                onClick={() => setDatePicker('to')}
                className={`mt-1.5 flex min-h-11 w-full items-center justify-between ${overviewMutedSurface} px-4 py-2.5 text-left text-[15px] font-medium text-[#111827] transition active:scale-[0.99]`}
              >
                {formatRuDate(to)}
                <HiChevronDown className="h-4 w-4 text-[#9CA3AF]" aria-hidden />
              </button>
            </div>
            <button
              type="button"
              onClick={onShowCustomRange}
              className={`flex min-h-11 shrink-0 items-center justify-center px-7 text-[14px] font-semibold ${overviewPinkBtn} sm:mb-0.5`}
            >
              Показать
            </button>
          </div>
          {rangeCapped ? (
            <p className={`${overviewMutedSurface} px-3 py-2 text-[12px] font-medium text-[#6B7280]`}>
              Показан максимум за 90 дней
            </p>
          ) : null}
          {chartIsTruncated ? (
            <p className="text-[11px] leading-snug text-[#6B7280]">
              Диаграммы — последние {OVERVIEW_MAX_RANGE_DAYS} дней периода; доход и число записей — за весь выбранный
              интервал.
            </p>
          ) : null}
        </div>
      ) : null}

      {isLoading ? (
        <OverviewSkeleton />
      ) : (
        <>
          {!hasAnyAppointmentInRange ? <OverviewEmptyHero /> : null}

          <div className="grid grid-cols-3 gap-2">
            <OverviewKpiCard
              icon={<HiBanknotes className="h-[18px] w-[18px]" aria-hidden />}
              label="Доход"
              value={formatBynRu(totalRevenue)}
            />
            <OverviewKpiCard
              icon={<HiCalendar className="h-[18px] w-[18px]" aria-hidden />}
              label="Записей"
              value={String(totalVisits)}
            />
            <OverviewKpiCard
              icon={<HiSquares2X2 className="h-[18px] w-[18px]" aria-hidden />}
              label="Услуг"
              value={String(serviceCount)}
              sub={serviceCount === 0 ? 'добавьте в каталоге' : 'за период'}
            />
          </div>

          <section className={`${overviewCard} ${overviewCardPad}`}>
            <h2 className="text-[16px] font-semibold text-[#111827]">Доход по дням</h2>
            <p className="mt-1 text-[12px] text-[#6B7280]">Данные за выбранный период</p>
            <div className="mt-4">
              <BarBlock stats={dayStats} mode="revenue" emptyHint="Дохода за период нет" />
            </div>
            {dayStats.length > 0 ? (
              <div className="mt-3 flex justify-between px-1 text-[11px] font-medium text-[#9CA3AF]">
                {axisIdx.map((i) => (
                  <span key={dayStats[i].date} className="tabular-nums">
                    {formatDdMm(dayStats[i].date)}
                  </span>
                ))}
              </div>
            ) : null}
          </section>

          <section className={`${overviewCard} ${overviewCardPad}`}>
            <h2 className="text-[16px] font-semibold text-[#111827]">Записи по дням</h2>
            <p className="mt-1 text-[12px] text-[#6B7280]">Данные за выбранный период</p>
            <div className="mt-4">
              <BarBlock stats={dayStats} mode="visits" emptyHint="Записей за период нет" />
            </div>
            {dayStats.length > 0 ? (
              <div className="mt-3 flex justify-between px-1 text-[11px] font-medium text-[#9CA3AF]">
                {axisIdx.map((i) => (
                  <span key={`${dayStats[i].date}-v`} className="tabular-nums">
                    {formatDdMm(dayStats[i].date)}
                  </span>
                ))}
              </div>
            ) : null}
          </section>

          <div className={`${overviewCard} ${overviewCardPad}`}>
            {nearest ? (
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <span className={overviewIconCircle}>
                    <HiBell className="h-5 w-5" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-medium text-[#6B7280]">Ближайшая запись</p>
                    <p className="mt-1 text-[17px] font-semibold text-[#111827]">{nearest.clientName}</p>
                    <p className="mt-1 text-[14px] text-[#6B7280]">{nearest.serviceTitle}</p>
                    <p className="mt-1 text-[13px] font-medium text-[#111827]">
                      {formatAppointmentWhenRu(nearest.date, nearest.time)}
                    </p>
                    <p className="mt-1 text-[14px] font-semibold text-[#F47C8C]">{formatBynRu(nearest.priceByn)}</p>
                    {nearest.addressShort ? (
                      <p className="mt-1 line-clamp-2 text-[12px] text-[#6B7280]">{nearest.addressShort}</p>
                    ) : null}
                    <span className="mt-2 inline-flex rounded-full bg-[#F7F7F8] px-3 py-1 text-[11px] font-semibold text-[#6B7280]">
                      {appointmentStatusLabel(nearest.status)}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => onOpenAppointment(nearest)}
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
                <HiCalendarDays className="h-10 w-10 shrink-0 text-[#FDE8ED]" aria-hidden />
              </div>
            )}
          </div>
        </>
      )}


      <AdminCalendarSheet
        open={datePicker !== null}
        onClose={() => setDatePicker(null)}
        valueIso={datePicker === 'from' ? from : datePicker === 'to' ? to : from}
        onSelect={(iso) => {
          if (datePicker === 'from') setFrom(iso);
          else if (datePicker === 'to') setTo(iso);
        }}
      />
    </div>
  );
}
