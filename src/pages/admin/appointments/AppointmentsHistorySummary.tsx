import { apptHistoryKpiTile, apptHistorySummaryTray } from './adminAppointmentsTheme';

type Props = {
  completedCount: number;
  earnedTotal: number;
  cancelledCount: number;
};

function StatBlock({
  label,
  value,
  accent,
  compact,
}: {
  label: string;
  value: string;
  accent?: boolean;
  compact?: boolean;
}) {
  if (compact) {
    return (
      <div className="min-w-0 flex-1">
        <p
          className={`text-[22px] font-black tabular-nums leading-none tracking-[-0.04em] ${
            accent ? 'text-[#F47C8C]' : 'text-[#111827]'
          }`}
        >
          {value}
        </p>
        <p className="mt-1.5 text-[12px] font-medium text-[#9CA3AF]">{label}</p>
      </div>
    );
  }

  return (
    <article className={`${apptHistoryKpiTile} flex min-h-[7.5rem] flex-col justify-between`}>
      <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#9CA3AF]">{label}</p>
      <p
        className={`text-[clamp(1.35rem,2vw,1.75rem)] font-black tabular-nums leading-none tracking-[-0.05em] ${
          accent ? 'text-[#F47C8C]' : 'text-[#111827]'
        }`}
      >
        {value}
      </p>
    </article>
  );
}

export function AppointmentsHistorySummary({ completedCount, earnedTotal, cancelledCount }: Props) {
  return (
    <>
      <section className={`${apptHistorySummaryTray} pr-14 lg:hidden`}>
        <p className="text-[14px] font-bold text-[#111827]">Итоги за всё время</p>
        <div className="mt-3 flex gap-6 sm:gap-8">
          <StatBlock label="Завершено" value={String(completedCount)} compact />
          <StatBlock label="Заработано" value={`${earnedTotal} BYN`} accent compact />
          <StatBlock label="Отменено" value={String(cancelledCount)} compact />
        </div>
      </section>

      <div className="hidden min-w-0 flex-1 lg:grid lg:grid-cols-3 lg:gap-4">
        <StatBlock label="Завершено" value={String(completedCount)} />
        <StatBlock label="Заработано" value={`${earnedTotal} BYN`} accent />
        <StatBlock label="Отменено" value={String(cancelledCount)} />
      </div>
    </>
  );
}
