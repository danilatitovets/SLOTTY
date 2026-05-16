import {
  addDays,
  isoDateLocal,
  listIsoDatesInclusive,
  OVERVIEW_MAX_RANGE_DAYS,
  overviewChartWindow,
  previousOverviewReportPeriod,
} from './masterOverview.dateUtils.js';

export type OverviewPeriodPreset = 'today' | 'week' | 'month' | 'all';

export type OverviewAppointmentRow = {
  id: string;
  clientName: string;
  serviceTitle: string;
  date: string;
  time: string;
  priceByn: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
};

export type OverviewDayStat = {
  date: string;
  completedRevenue: number;
  activeVisits: number;
};

export type MasterOverviewReviewRow = {
  id: string;
  author: string;
  authorInitial: string;
  dateIso: string;
  rating: number;
  text: string;
  masterReply: string | null;
  replyAtIso: string | null;
};

export type RatingDayStat = { date: string; averageRating: number };

function normalizeClient(name: string): string {
  return name.trim().toLowerCase();
}

function percentDelta(current: number, previous: number): number | null {
  if (previous <= 0) return current > 0 ? 100 : null;
  return Math.round(((current - previous) / previous) * 100);
}

function overviewAppointmentBounds(appointments: OverviewAppointmentRow[]): { start: string; end: string } {
  const end = isoDateLocal(new Date());
  const active = appointments.filter((r) => r.status !== 'cancelled');
  if (!active.length) {
    return { start: isoDateLocal(addDays(new Date(), -(OVERVIEW_MAX_RANGE_DAYS - 1))), end };
  }
  const dates = active.map((r) => r.date).sort();
  const last = dates[dates.length - 1]!;
  return { start: dates[0]!, end: last > end ? end : last };
}

export function resolveOverviewPeriodRange(
  preset: OverviewPeriodPreset,
  appointments: OverviewAppointmentRow[],
): { start: string; end: string } {
  const end = isoDateLocal(new Date());
  if (preset === 'today') return { start: end, end };
  if (preset === 'week') return { start: isoDateLocal(addDays(new Date(), -6)), end };
  if (preset === 'month') return { start: isoDateLocal(addDays(new Date(), -29)), end };
  return overviewAppointmentBounds(appointments);
}

function isClientVisitRow(r: OverviewAppointmentRow): boolean {
  return r.status === 'completed' || r.status === 'confirmed';
}

function sumCompletedRevenueBetween(rows: OverviewAppointmentRow[], startIso: string, endIso: string): number {
  return rows
    .filter((r) => r.status === 'completed' && r.date >= startIso && r.date <= endIso)
    .reduce((s, r) => s + (Number.isFinite(r.priceByn) ? r.priceByn : 0), 0);
}

function aggregateOverviewByDay(
  rows: OverviewAppointmentRow[],
  startIso: string,
  endIso: string,
): OverviewDayStat[] {
  return listIsoDatesInclusive(startIso, endIso).map((date) => {
    const day = rows.filter((r) => r.date === date);
    const completedRevenue = day
      .filter((r) => r.status === 'completed')
      .reduce((s, r) => s + (Number.isFinite(r.priceByn) ? r.priceByn : 0), 0);
    const activeVisits = day.filter((r) => r.status !== 'cancelled').length;
    return { date, completedRevenue, activeVisits };
  });
}

function timeToSortKey(time: string): string {
  const s = (time || '09:00').trim();
  const m = /^(\d{1,2}):(\d{2})$/.exec(s);
  const n = m ? `${String(Number(m[1])).padStart(2, '0')}:${m[2]}` : s;
  return n.length === 5 ? `${n}:00` : n;
}

function pickNearestUpcomingAppointment(
  rows: OverviewAppointmentRow[],
  todayIso: string = isoDateLocal(new Date()),
): OverviewAppointmentRow | null {
  const candidates = rows.filter(
    (r) => (r.status === 'pending' || r.status === 'confirmed') && r.date >= todayIso,
  );
  if (!candidates.length) return null;
  const sorted = [...candidates].sort((a, b) => {
    const da = `${a.date}T${timeToSortKey(a.time)}`;
    const db = `${b.date}T${timeToSortKey(b.time)}`;
    return da.localeCompare(db);
  });
  return sorted[0] ?? null;
}

export type OverviewSummaryDto = {
  totalRevenue: number;
  totalVisits: number;
  nearest: OverviewAppointmentRow | null;
  hasAny: boolean;
  dayStats: OverviewDayStat[];
  periodStart: string;
  periodEnd: string;
};

export function computeOverviewSummary(
  appointments: OverviewAppointmentRow[],
  start: string,
  end: string,
): OverviewSummaryDto {
  const dayStatsRange = overviewChartWindow(start, end, OVERVIEW_MAX_RANGE_DAYS);
  return {
    totalRevenue: sumCompletedRevenueBetween(appointments, start, end),
    totalVisits: appointments.filter((r) => r.status !== 'cancelled' && r.date >= start && r.date <= end)
      .length,
    nearest: pickNearestUpcomingAppointment(appointments),
    hasAny: appointments.some((r) => r.date >= start && r.date <= end),
    dayStats: aggregateOverviewByDay(appointments, dayStatsRange.chartStart, dayStatsRange.chartEnd),
    periodStart: start,
    periodEnd: end,
  };
}

export type OverviewRevenueDto = {
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
  revenueTrendPercent: number | null;
  avgCheckTrendPercent: number | null;
  paidSharePercent: number;
  unpaidSharePercent: number;
  periodStart: string;
  periodEnd: string;
};

export function computeOverviewRevenue(
  appointments: OverviewAppointmentRow[],
  start: string,
  end: string,
): OverviewRevenueDto {
  const inRange = appointments.filter((r) => r.date >= start && r.date <= end);
  const completed = inRange.filter((r) => r.status === 'completed');
  const unpaidRows = inRange.filter((r) => r.status === 'pending' || r.status === 'confirmed');

  const totalRevenue = sumCompletedRevenueBetween(appointments, start, end);
  const completedCount = completed.length;
  const avgCheck = completedCount > 0 ? Math.round(totalRevenue / completedCount) : 0;
  const unpaidAmount = unpaidRows.reduce((s, r) => s + (Number.isFinite(r.priceByn) ? r.priceByn : 0), 0);
  const paidAmount = totalRevenue;

  const prev = previousOverviewReportPeriod(start, end);
  const prevRevenue = prev ? sumCompletedRevenueBetween(appointments, prev.start, prev.end) : 0;
  const revenueTrendPercent = percentDelta(totalRevenue, prevRevenue);

  let avgCheckTrendPercent: number | null = null;
  if (prev) {
    const prevCompleted = appointments.filter(
      (r) => r.status === 'completed' && r.date >= prev.start && r.date <= prev.end,
    );
    const prevAvg =
      prevCompleted.length > 0 ? Math.round(prevRevenue / prevCompleted.length) : 0;
    avgCheckTrendPercent = percentDelta(avgCheck, prevAvg);
  }

  const moneyTotal = paidAmount + unpaidAmount;
  const paidSharePercent =
    moneyTotal > 0 ? Math.round((paidAmount / moneyTotal) * 100) : paidAmount > 0 ? 100 : 0;
  const unpaidSharePercent = moneyTotal > 0 ? 100 - paidSharePercent : 0;

  const chartRange = overviewChartWindow(start, end, OVERVIEW_MAX_RANGE_DAYS);
  const dayStats = aggregateOverviewByDay(appointments, chartRange.chartStart, chartRange.chartEnd);

  return {
    totalRevenue,
    completedCount,
    avgCheck,
    paidAmount,
    paidCount: completedCount,
    unpaidAmount,
    unpaidCount: unpaidRows.length,
    dayStats,
    chartIsTruncated: chartRange.chartStart > start,
    hasRevenue: totalRevenue > 0 || unpaidAmount > 0,
    revenueTrendPercent,
    avgCheckTrendPercent,
    paidSharePercent,
    unpaidSharePercent,
    periodStart: start,
    periodEnd: end,
  };
}

export type ClientDayStat = {
  date: string;
  newClients: number;
  repeatClients: number;
};

function aggregateClientsPerDay(
  appointments: OverviewAppointmentRow[],
  chartStart: string,
  chartEnd: string,
): ClientDayStat[] {
  const visits = appointments.filter(isClientVisitRow);
  const firstCompletedByClient = new Map<string, string>();

  for (const row of visits) {
    const key = normalizeClient(row.clientName);
    const cur = firstCompletedByClient.get(key);
    if (!cur || row.date < cur) firstCompletedByClient.set(key, row.date);
  }

  return listIsoDatesInclusive(chartStart, chartEnd).map((date) => {
    const dayRows = visits.filter((r) => r.date === date);
    const seen = new Set<string>();
    let newClients = 0;
    let repeatClients = 0;

    for (const row of dayRows) {
      const key = normalizeClient(row.clientName);
      if (seen.has(key)) continue;
      seen.add(key);
      if (firstCompletedByClient.get(key) === date) newClients += 1;
      else repeatClients += 1;
    }

    return { date, newClients, repeatClients };
  });
}

export type OverviewClientsDto = {
  newClients: number;
  repeatClients: number;
  totalClients: number;
  visitsPerDay: OverviewDayStat[];
  clientsPerDay: ClientDayStat[];
  chartIsTruncated: boolean;
  hasData: boolean;
  periodStart: string;
  periodEnd: string;
};

export function computeOverviewClients(
  appointments: OverviewAppointmentRow[],
  start: string,
  end: string,
): OverviewClientsDto {
  const completedInRange = appointments.filter(
    (r) => isClientVisitRow(r) && r.date >= start && r.date <= end,
  );
  const hadBefore = new Set(
    appointments
      .filter((r) => isClientVisitRow(r) && r.date < start)
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
  const clientsPerDay = aggregateClientsPerDay(
    appointments,
    chartRange.chartStart,
    chartRange.chartEnd,
  );

  return {
    newClients,
    repeatClients,
    totalClients: byClient.size,
    visitsPerDay,
    clientsPerDay,
    chartIsTruncated: chartRange.chartStart > start,
    hasData:
      byClient.size > 0 || clientsPerDay.some((d) => d.newClients > 0 || d.repeatClients > 0),
    periodStart: start,
    periodEnd: end,
  };
}

function reviewsInRange(reviews: MasterOverviewReviewRow[], start: string, end: string) {
  return reviews.filter((r) => r.dateIso >= start && r.dateIso <= end);
}

function averageRating(reviews: MasterOverviewReviewRow[]): number | null {
  if (!reviews.length) return null;
  const sum = reviews.reduce((s, r) => s + r.rating, 0);
  return Math.round((sum / reviews.length) * 10) / 10;
}

function ratingSeriesByDay(
  reviews: MasterOverviewReviewRow[],
  chartStart: string,
  chartEnd: string,
): RatingDayStat[] {
  const dates = listIsoDatesInclusive(chartStart, chartEnd);
  const sorted = [...reviews].sort((a, b) => a.dateIso.localeCompare(b.dateIso));
  const ratingsByDate = new Map<string, number[]>();
  sorted.forEach((r) => {
    const list = ratingsByDate.get(r.dateIso) ?? [];
    list.push(r.rating);
    ratingsByDate.set(r.dateIso, list);
  });

  let runningSum = 0;
  let runningCount = 0;
  const series: RatingDayStat[] = [];

  dates.forEach((date) => {
    const dayRatings = ratingsByDate.get(date) ?? [];
    dayRatings.forEach((rating) => {
      runningSum += rating;
      runningCount += 1;
    });
    if (runningCount > 0) {
      series.push({
        date,
        averageRating: Math.round((runningSum / runningCount) * 10) / 10,
      });
    }
  });

  return series;
}

export type OverviewReputationDto = {
  hasReviews: boolean;
  averageRating: number | null;
  reviewsCount: number;
  newReviewsInPeriod: number;
  unansweredReviews: number;
  ratingTrend: 'up' | 'down' | 'flat' | null;
  ratingDelta: number | null;
  ratingTrendPercent: number | null;
  totalReviewsDelta: number;
  newReviewsDelta: number;
  ratingByDay: RatingDayStat[];
  chartIsTruncated: boolean;
  reviews: MasterOverviewReviewRow[];
  latestReview: MasterOverviewReviewRow | null;
  unansweredList: MasterOverviewReviewRow[];
  periodStart: string;
  periodEnd: string;
};

export function computeOverviewReputation(
  reviews: MasterOverviewReviewRow[],
  start: string,
  end: string,
): OverviewReputationDto {
  const all = reviews;
  const hasReviews = all.length > 0;
  const inPeriod = reviewsInRange(all, start, end);
  const averageAll = averageRating(all);
  const unansweredList = all.filter((r) => !r.masterReply);
  const latestReview = all[0] ?? null;

  const prev = previousOverviewReportPeriod(start, end);
  const prevPeriod = prev ? reviewsInRange(all, prev.start, prev.end) : [];
  const totalReviewsDelta = inPeriod.length - prevPeriod.length;
  const newReviewsDelta = totalReviewsDelta;

  const avgNow = averageRating(inPeriod.length ? inPeriod : all);
  const avgPrev = prev ? averageRating(prevPeriod) : null;
  let ratingDelta: number | null = null;
  let ratingTrendPercent: number | null = null;
  let ratingTrend: 'up' | 'down' | 'flat' | null = null;

  if (avgNow !== null && avgPrev !== null) {
    ratingDelta = Math.round((avgNow - avgPrev) * 10) / 10;
    if (ratingDelta > 0.05) ratingTrend = 'up';
    else if (ratingDelta < -0.05) ratingTrend = 'down';
    else ratingTrend = 'flat';
    if (avgPrev > 0) {
      ratingTrendPercent = Math.round(((avgNow - avgPrev) / avgPrev) * 100);
    }
  }

  const chartRange = overviewChartWindow(start, end, OVERVIEW_MAX_RANGE_DAYS);
  const ratingByDay = ratingSeriesByDay(all, chartRange.chartStart, chartRange.chartEnd);

  return {
    hasReviews,
    averageRating: averageAll,
    reviewsCount: all.length,
    newReviewsInPeriod: inPeriod.length,
    unansweredReviews: unansweredList.length,
    ratingTrend,
    ratingDelta,
    ratingTrendPercent,
    totalReviewsDelta,
    newReviewsDelta,
    ratingByDay,
    chartIsTruncated: chartRange.chartStart > start,
    reviews: all,
    latestReview,
    unansweredList,
    periodStart: start,
    periodEnd: end,
  };
}
