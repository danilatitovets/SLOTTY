import { HiClock, HiUser } from 'react-icons/hi2';
import {
  scheduleWindowCardShell,
  scheduleWindowStatusPill,
  scheduleWindowTimeStrip,
} from './adminScheduleTheme';
import type { ScheduleWindowView } from './scheduleTypes';

type Props = {
  window: ScheduleWindowView;
  onClick: () => void;
};

const STATUS_LABEL: Record<ScheduleWindowView['status'], string> = {
  free: 'Свободно',
  booked: 'Запись',
  blocked: 'Закрыто',
};

export function ScheduleWindowCard({ window: w, onClick }: Props) {
  const stripClass = scheduleWindowTimeStrip(w.status);

  return (
    <button type="button" onClick={onClick} className={`text-left ${scheduleWindowCardShell}`}>
      <div
        className={`flex w-[4.75rem] shrink-0 flex-col items-center justify-center gap-0.5 self-stretch py-3 sm:w-20 ${stripClass}`}
      >
        {w.status === 'booked' ? (
          <HiUser className="mb-0.5 h-4 w-4 shrink-0 opacity-80" aria-hidden />
        ) : (
          <HiClock className="mb-0.5 h-4 w-4 shrink-0 opacity-60" aria-hidden />
        )}
        <span className="text-[15px] font-bold tabular-nums leading-none">{w.startTime}</span>
        <span className="text-[11px] font-medium tabular-nums opacity-80">{w.endTime}</span>
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-center gap-2 p-3.5 sm:p-4">
        <p className="line-clamp-2 text-[15px] font-bold leading-snug tracking-[-0.02em] text-[#111827]">
          {w.serviceName}
        </p>

        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex max-w-full items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${scheduleWindowStatusPill(w.status)}`}
          >
            {STATUS_LABEL[w.status]}
          </span>
          {w.clientName ? (
            <span className="min-w-0 truncate text-[12px] font-medium text-[#6B7280]">{w.clientName}</span>
          ) : null}
          {w.clientPhone ? (
            <span className="text-[12px] font-medium tabular-nums text-[#9CA3AF]">{w.clientPhone}</span>
          ) : null}
        </div>
      </div>
    </button>
  );
}
