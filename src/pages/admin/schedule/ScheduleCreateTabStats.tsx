import type { ReactNode } from 'react';
import { HiClock, HiRectangleStack, HiScissors, HiSparkles } from 'react-icons/hi2';
import type { ScheduleTabMetrics } from './scheduleTabMetrics';
import { ScheduleKpiPhotoBackdrop } from './ScheduleKpiPhotoBackdrop';

type Props = {
  metrics: ScheduleTabMetrics['create'];
};

function StatChip({
  label,
  value,
  hint,
  icon,
  accent,
}: {
  label: string;
  value: string;
  hint: string;
  icon: ReactNode;
  accent?: boolean;
}) {
  return (
    <div className="relative flex min-h-[5.25rem] flex-col justify-between overflow-hidden rounded-[16px] p-4 lg:min-h-[5.75rem] lg:rounded-[18px] lg:p-4">
      <ScheduleKpiPhotoBackdrop />
      <div className="relative z-10 flex items-start justify-between gap-2">
        <p className="text-[12px] font-bold leading-tight text-[#374151] lg:text-[13px]">{label}</p>
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] bg-white/85 backdrop-blur-[2px] ${
            accent ? 'text-[#3B4CCA]' : 'text-[#6B7280]'
          }`}
        >
          {icon}
        </span>
      </div>
      <div className="relative z-10">
        <p
          className={`text-[30px] font-black tabular-nums leading-none tracking-[-0.06em] lg:text-[34px] ${
            accent ? 'text-[#3B4CCA]' : 'text-[#111827]'
          }`}
        >
          {value}
        </p>
        <p className="mt-1.5 text-[13px] font-semibold leading-snug text-[#4B5563] lg:text-[14px]">{hint}</p>
      </div>
    </div>
  );
}

export function ScheduleCreateTabStats({ metrics }: Props) {
  const m = metrics;

  return (
    <div className="grid grid-cols-2 gap-2 lg:grid-cols-4 lg:gap-3">
      <StatChip
        label="Шаблоны"
        value={String(m.templates)}
        hint={m.templates === 1 ? 'для быстрого окна' : 'для быстрых окон'}
        icon={<HiSparkles className="h-[18px] w-[18px]" aria-hidden />}
        accent
      />
      <StatChip
        label="Свободно"
        value={String(m.upcomingFree)}
        hint="окон впереди"
        icon={<HiClock className="h-[18px] w-[18px]" aria-hidden />}
      />
      <StatChip
        label="Всего окон"
        value={String(m.windowsTotal)}
        hint="в расписании"
        icon={<HiRectangleStack className="h-[18px] w-[18px]" aria-hidden />}
      />
      <StatChip
        label="Услуги"
        value={String(m.servicesInCatalog)}
        hint="в каталоге"
        icon={<HiScissors className="h-[18px] w-[18px]" aria-hidden />}
      />
    </div>
  );
}
