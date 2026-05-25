import {
  type PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { HiCalendarDays, HiCloud } from 'react-icons/hi2';
import type { OverviewDayStat } from '../../../features/master/model/demoMasterAppointments';
import { formatBynRu, formatDdMm, formatDdMmYyyy, formatReviewDayMonthRu } from './overviewFormat';

function chartAxisIndices(n: number): number[] {
  if (n <= 0) return [];
  if (n === 1) return [0];
  if (n === 2) return [0, 1];
  if (n <= 6) return Array.from({ length: n }, (_, i) => i);
  const mid = Math.floor((n - 1) / 2);
  const set = new Set([0, mid, n - 1]);
  return [...set].sort((a, b) => a - b);
}

function niceAxisMax(max: number, mode: 'revenue' | 'visits'): number {
  if (max <= 0) return mode === 'revenue' ? 100 : 5;
  if (mode === 'visits') return Math.max(1, Math.ceil(max));
  const step = max <= 200 ? 50 : max <= 500 ? 100 : max <= 1000 ? 200 : 400;
  return Math.ceil(max / step) * step;
}

function formatVisits(n: number): string {
  const v = Math.round(n);
  const mod10 = v % 10;
  const mod100 = v % 100;
  if (mod100 >= 11 && mod100 <= 14) return `${v} записей`;
  if (mod10 === 1) return `${v} запись`;
  if (mod10 >= 2 && mod10 <= 4) return `${v} записи`;
  return `${v} записей`;
}

export function OverviewInteractiveBarChart({
  stats,
  mode,
  emptyHint,
  size = 'default',
}: {
  stats: OverviewDayStat[];
  mode: 'revenue' | 'visits';
  emptyHint: string;
  size?: 'default' | 'large';
}) {
  const chartRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const values = stats.map((s) => (mode === 'revenue' ? s.completedRevenue : s.activeVisits));
  const hasStats = stats.length > 0;
  const hasAny = values.some((v) => v > 0);
  const axisMax = niceAxisMax(Math.max(...values, 0), mode);
  const axisIdx = chartAxisIndices(stats.length);
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((t) =>
    mode === 'revenue' ? Math.round(axisMax * t) : Math.round(axisMax * t),
  );

  const chartHeightClass = size === 'large' ? 'min-h-[14.5rem]' : 'min-h-[11rem]';
  const barAreaClass = size === 'large' ? 'h-44' : 'h-40';

  const pickIndex = useCallback(
    (clientX: number) => {
      if (!stats.length || !chartRef.current) return;
      const rect = chartRef.current.getBoundingClientRect();
      const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
      const idx = Math.min(stats.length - 1, Math.max(0, Math.round(ratio * (stats.length - 1))));
      setActiveIndex(idx);
    },
    [stats.length],
  );

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!hasStats) return;
    pickIndex(e.clientX);
  };

  const onPointerLeave = () => setActiveIndex(null);

  const activeStat = activeIndex !== null ? stats[activeIndex] : null;
  const activeValue =
    activeIndex !== null ? (mode === 'revenue' ? values[activeIndex]! : values[activeIndex]!) : 0;

  const tooltipLeft =
    activeIndex !== null && stats.length > 1
      ? `${Math.min(92, Math.max(8, (activeIndex / (stats.length - 1)) * 100))}%`
      : '50%';

  useEffect(() => {
    setActiveIndex(null);
  }, [stats, mode]);

  const EmptyIcon = mode === 'revenue' ? HiCloud : HiCalendarDays;

  return (
    <div className="min-w-0">
      <div className="relative flex gap-2">
        <div className="flex w-10 shrink-0 flex-col justify-between py-1 text-[10px] font-semibold tabular-nums text-[#9CA3AF]">
          {[...yTicks].reverse().map((v) => (
            <span key={v}>{mode === 'revenue' && v > 0 ? `${v}` : v}</span>
          ))}
        </div>

        <div
          ref={chartRef}
          className={`relative min-w-0 flex-1 touch-none select-none overflow-hidden rounded-[20px] border border-[#EEF0F5] bg-[#f6f7fb] p-3 pt-4 lg:border-0 ${
            chartHeightClass
          } ${hasStats ? 'cursor-crosshair' : ''}`}
          onPointerMove={onPointerMove}
          onPointerDown={onPointerMove}
          onPointerLeave={onPointerLeave}
          onPointerCancel={onPointerLeave}
          role={hasStats ? 'img' : undefined}
          aria-label={hasStats ? (mode === 'revenue' ? 'График дохода по дням' : 'График записей по дням') : undefined}
        >
          <div className="pointer-events-none absolute inset-x-3 bottom-3 top-8 flex flex-col justify-between">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="border-t border-dashed border-[#E5E7EB]/90" />
            ))}
          </div>

          {!hasAny ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-4 text-center">
              <EmptyIcon className="h-10 w-10 text-[#D1D5DB]" aria-hidden />
              <p className="text-[13px] font-semibold text-[#6B7280]">{emptyHint}</p>
            </div>
          ) : (
            <>
              <div className={`relative flex ${barAreaClass} items-end gap-[3px] px-0.5 pt-6`}>
                {stats.map((s, i) => {
                  const v = mode === 'revenue' ? s.completedRevenue : s.activeVisits;
                  const h = axisMax > 0 ? Math.max((v / axisMax) * 100, v > 0 ? 8 : 2) : 2;
                  const isActive = activeIndex === i;

                  return (
                    <div
                      key={s.date}
                      className="flex h-full min-w-0 flex-1 flex-col justify-end"
                    >
                      <div
                        className={`mx-auto w-[min(100%,12px)] rounded-t-full transition-all ${
                          v > 0
                            ? isActive
                              ? 'bg-gradient-to-t from-[#E85D72] to-[#F47C8C] shadow-[0_0_0_2px_rgba(244,124,140,0.35)]'
                              : 'bg-gradient-to-t from-[#F47C8C] to-[#F9A8B4]'
                            : 'bg-[#E5E7EB]'
                        }`}
                        style={{ height: `${h}%`, minHeight: v > 0 ? 6 : 3 }}
                      />
                    </div>
                  );
                })}
              </div>

              {activeStat ? (
                <div
                  className="pointer-events-none absolute top-2 z-10 -translate-x-1/2 rounded-[14px] border border-[#FDE8ED] bg-white/95 px-3 py-2 text-center shadow-[0_10px_28px_rgba(244,124,140,0.22)] backdrop-blur-sm"
                  style={{ left: tooltipLeft }}
                >
                  {mode === 'revenue' ? (
                    <p className="text-[13px] font-bold tabular-nums text-[#111827]">
                      <span className="text-[#6B7280]">{formatReviewDayMonthRu(activeStat.date)}</span>{' '}
                      <span className="text-[#F47C8C]">{formatBynRu(activeValue)}</span>
                    </p>
                  ) : (
                    <>
                      <p className="text-[15px] font-bold tabular-nums tracking-[-0.03em] text-[#F47C8C]">
                        {formatVisits(activeValue)}
                      </p>
                      <p className="mt-0.5 text-[11px] font-semibold text-[#6B7280]">
                        {formatDdMmYyyy(activeStat.date)}
                      </p>
                    </>
                  )}
                </div>
              ) : null}
            </>
          )}
        </div>
      </div>

      {stats.length > 0 ? (
        <div className="mt-3 flex justify-between pl-12 pr-0.5 text-[11px] font-semibold text-[#9CA3AF]">
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
