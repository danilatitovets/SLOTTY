import { HiClock } from 'react-icons/hi2';
import type { ScheduleWindowView } from './scheduleTypes';

const STATUS_SHORT: Record<ScheduleWindowView['status'], string> = {
  free: 'Свободно',
  booked: 'Запись',
  blocked: 'Закрыто',
};

function statusTailClass(status: ScheduleWindowView['status']): string {
  if (status === 'booked') return 'text-[#3B4CCA]';
  if (status === 'free') return 'text-[#16A34A]';
  return 'text-[#6B7280]';
}

type Props = {
  window: ScheduleWindowView;
  onClick: () => void;
};

export function ScheduleCalendarWindowRow({ window: w, onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-[12px] bg-[#EEF0FC] px-3 py-2.5 text-left transition active:scale-[0.99]"
    >
      <div className="flex w-[4rem] shrink-0 flex-col items-center justify-center gap-0.5 rounded-[10px] bg-white/90 py-2.5 text-[#111827]">
        <HiClock className="h-4 w-4 shrink-0 text-[#3B4CCA] opacity-80" aria-hidden />
        <span className="text-[15px] font-bold tabular-nums leading-none">{w.startTime}</span>
        <span className="text-[11px] font-medium tabular-nums text-[#6B7280]">{w.endTime}</span>
      </div>
      <p className="min-w-0 flex-1 line-clamp-2 text-[13px] font-semibold leading-snug text-[#374151]">
        {w.serviceName}
      </p>
      <p className={`shrink-0 text-[13px] font-bold ${statusTailClass(w.status)}`}>
        {STATUS_SHORT[w.status]}
      </p>
    </button>
  );
}
