import { addDays } from '../../../features/booking/lib/calendar';
import {
  aggregateOverviewByDay,
  countActiveVisitsBetween,
  isoDateLocal,
  listIsoDatesInclusive,
  OVERVIEW_MAX_RANGE_DAYS,
  pickNearestUpcomingAppointment,
  sumCompletedRevenueBetween,
  type DemoMasterAppointment,
  type OverviewDayStat,
} from '../../../features/master/model/demoMasterAppointments';

function overviewAppointmentBounds(appointments: DemoMasterAppointment[]): { start: string; end: string } {
  const end = isoDateLocal(new Date());
  const active = appointments.filter((r) => r.status !== 'cancelled');
  if (!active.length) {
    return { start: isoDateLocal(addDays(new Date(), -(OVERVIEW_MAX_RANGE_DAYS - 1))), end };
  }
  const dates = active.map((r) => r.date).sort();
  return { start: dates[0]!, end: dates[dates.length - 1]! > end ? end : dates[dates.length - 1]! };
}

function overviewChartWindow(
  start: string,
  end: string,
  maxDays: number,
): { chartStart: string; chartEnd: string } {
  const days = listIsoDatesInclusive(start, end);
  if (days.length <= maxDays) return { chartStart: start, chartEnd: end };
  return { chartStart: days[days.length - maxDays]!, chartEnd: end };
}

export type OverviewPeriodPreset = 'today' | 'week' | 'month' | 'all';
export type OverviewAnalyticsTab = 'summary' | 'revenue' | 'clients' | 'reputation';

export function overviewPeriodRange(
  preset: OverviewPeriodPreset,
  appointments: DemoMasterAppointment[],
): { start: string; end: string } {
  const end = isoDateLocal(new Date());
  if (preset === 'today') return { start: end, end };
  if (preset === 'week') return { start: isoDateLocal(addDays(new Date(), -6)), end };
  if (preset === 'month') return { start: isoDateLocal(addDays(new Date(), -29)), end };
  return overviewAppointmentBounds(appointments);
}

function normalizeClient(name: string): string {
  return name.trim().toLowerCase();
}

export type RevenueAnalytics = {
  totalRevenue: number;
  completedCount: number;
  avgCheck: number;
  paidAmount: number;
  paidCount: number;
  unpaidAmount: number;
  unpaidCount: number;
  dayStats: OverviewDayStat[];
  chartIsTruncated: boolean;
  hasRevenue: boolean;
};

export function computeRevenueAnalytics(
  appointments: DemoMasterAppointment[],
  start: string,
  end: string,
): RevenueAnalytics {
  const inRange = appointments.filter((r) => r.date >= start && r.date <= end);
  const completed = inRange.filter((r) => r.status === 'completed');
  const unpaidRows = inRange.filter((r) => r.status === 'pending' || r.status === 'confirmed');

  const totalRevenue = sumCompletedRevenueBetween(appointments, start, end);
  const completedCount = completed.length;
  const avgCheck = completedCount > 0 ? totalRevenue / completedCount : 0;
  const unpaidAmount = unpaidRows.reduce((s, r) => s + (Number.isFinite(r.priceByn) ? r.priceByn : 0), 0);

  const chartRange = overviewChartWindow(start, end, OVERVIEW_MAX_RANGE_DAYS);
  const dayStats = aggregateOverviewByDay(appointments, chartRange.chartStart, chartRange.chartEnd);

  return {
    totalRevenue,
    completedCount,
    avgCheck,
    paidAmount: totalRevenue,
    paidCount: completedCount,
    unpaidAmount,
    unpaidCount: unpaidRows.length,
    dayStats,
    chartIsTruncated: chartRange.chartStart > start,
    hasRevenue: totalRevenue > 0,
  };
}

export type ClientAnalytics = {
  newClients: number;
  repeatClients: number;
  totalClients: number;
  visitsPerDay: OverviewDayStat[];
  chartIsTruncated: boolean;
  hasData: boolean;
};

export function computeClientAnalytics(
  appointments: DemoMasterAppointment[],
  start: string,
  end: string,
): ClientAnalytics {
  const completedInRange = appointments.filter(
    (r) => r.status === 'completed' && r.date >= start && r.date <= end,
  );
  const hadBefore = new Set(
    appointments
      .filter((r) => r.status === 'completed' && r.date < start)
      .map((r) => normalizeClient(r.clientName)),
  );

  const byClient = new Map<string, boolean>();
  for (const row of completedInRange) {
    const key = normalizeClient(row.clientName);
    if (!byClient.has(key)) byClient.set(key, hadBefore.has(key));
  }

  let repeatClients = 0;
  let newClients = 0;
  for (const isRepeat of byClient.values()) {
    if (isRepeat) repeatClients += 1;
    else newClients += 1;
  }

  const chartRange = overviewChartWindow(start, end, OVERVIEW_MAX_RANGE_DAYS);
  const visitsPerDay = aggregateOverviewByDay(appointments, chartRange.chartStart, chartRange.chartEnd);

  return {
    newClients,
    repeatClients,
    totalClients: byClient.size,
    visitsPerDay,
    chartIsTruncated: chartRange.chartStart > start,
    hasData: byClient.size > 0,
  };
}

/** Пока нет сущности отзывов в демо — только UI-заглушка для экрана репутации. */
export type ReputationAnalytics = {
  hasReviews: boolean;
  averageRating: number | null;
  reviewsCount: number;
  newReviewsInPeriod: number;
  unansweredReviews: number;
  ratingTrend: 'up' | 'down' | 'flat' | null;
};

export function computeReputationAnalytics(): ReputationAnalytics {
  return {
    hasReviews: false,
    averageRating: null,
    reviewsCount: 0,
    newReviewsInPeriod: 0,
    unansweredReviews: 0,
    ratingTrend: null,
  };
}

export function overviewSummaryMetrics(
  appointments: DemoMasterAppointment[],
  start: string,
  end: string,
) {
  return {
    totalRevenue: sumCompletedRevenueBetween(appointments, start, end),
    totalVisits: countActiveVisitsBetween(appointments, start, end),
    nearest: pickNearestUpcomingAppointment(appointments),
    hasAny: appointments.some((r) => r.date >= start && r.date <= end),
  };
}
