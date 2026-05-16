export const OVERVIEW_MAX_RANGE_DAYS = 90;

export function addDays(d: Date, days: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}

export function isoDateLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function listIsoDatesInclusive(startIso: string, endIso: string): string[] {
  if (!startIso || !endIso || startIso > endIso) return [];
  const out: string[] = [];
  let d = new Date(`${startIso}T12:00:00`);
  const end = new Date(`${endIso}T12:00:00`);
  let n = 0;
  while (d <= end && n < OVERVIEW_MAX_RANGE_DAYS) {
    out.push(isoDateLocal(d));
    d = addDays(d, 1);
    n += 1;
  }
  return out;
}

export function countOverviewDaysInclusive(startIso: string, endIso: string): number {
  return listIsoDatesInclusive(startIso, endIso).length;
}

export function overviewChartWindow(
  reportStart: string,
  reportEnd: string,
  maxDays: number,
): { chartStart: string; chartEnd: string } {
  const n = countOverviewDaysInclusive(reportStart, reportEnd);
  if (n <= maxDays) return { chartStart: reportStart, chartEnd: reportEnd };
  return {
    chartStart: isoDateLocal(addDays(new Date(`${reportEnd}T12:00:00`), -(maxDays - 1))),
    chartEnd: reportEnd,
  };
}

export function previousOverviewReportPeriod(
  startIso: string,
  endIso: string,
): { start: string; end: string } | null {
  const days = countOverviewDaysInclusive(startIso, endIso);
  if (!days) return null;
  const start = new Date(`${startIso}T12:00:00`);
  const prevEnd = addDays(start, -1);
  const prevStart = addDays(prevEnd, -(days - 1));
  return { start: isoDateLocal(prevStart), end: isoDateLocal(prevEnd) };
}
