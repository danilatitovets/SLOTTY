import { HEADER_LOGO_SRC } from '../../../app/headerLogo';
import type { DemoMasterAppointment } from '../../../features/master/model/demoMasterAppointments';
import { formatBynRu } from '../overview/overviewFormat';
import { AppointmentCancelledBadge } from './AppointmentCancelledBadge';
import { AppointmentCompletedBadge } from './AppointmentCompletedBadge';
import { apptDetailHeroCard } from './adminAppointmentsTheme';
import {
  appointmentDetailHeroBackground,
  appointmentDetailHeroOverlayClass,
  appointmentDetailHeroStatusBadgeClass,
  type StatusBadgeTone,
} from './appointmentDetailPresentation';
import { formatDurationMinutes, formatVisitPlace } from './appointmentsFormat';

type Props = {
  appointment: DemoMasterAppointment;
  statusLabel: string;
  statusTone: StatusBadgeTone;
};

function formatWeekdayLong(iso: string): string | null {
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' });
}

function formatTimeRange(
  date: string,
  time: string,
  durationMinutes: number | undefined,
): string {
  const normalized = time.length === 5 ? time : time.slice(0, 5);
  const start = new Date(`${date}T${normalized}:00`);
  if (Number.isNaN(start.getTime()) || !durationMinutes || durationMinutes <= 0) {
    return normalized;
  }
  const end = new Date(start.getTime() + durationMinutes * 60_000);
  const endLabel = end.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  return `${normalized} — ${endLabel}`;
}

function HeroStatusBadge({
  statusLabel,
  statusTone,
}: {
  statusLabel: string;
  statusTone: StatusBadgeTone;
}) {
  if (statusTone === 'completed') {
    return <AppointmentCompletedBadge label={statusLabel} variant="hero" />;
  }
  if (statusTone === 'cancelled') {
    return <AppointmentCancelledBadge label={statusLabel} variant="hero" />;
  }
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.04em] ${appointmentDetailHeroStatusBadgeClass(statusTone)}`}
    >
      {statusLabel}
    </span>
  );
}

export function MasterAppointmentWhenCard({ appointment, statusLabel, statusTone }: Props) {
  const time = appointment.timeLabel ?? appointment.time;
  const weekday = formatWeekdayLong(appointment.date);
  const timeRange = formatTimeRange(appointment.date, time, appointment.durationMinutes);
  const duration = formatDurationMinutes(appointment.durationMinutes, appointment.serviceTitle);
  const visit = formatVisitPlace(appointment.addressShort);
  const addressDetail =
    visit === 'На дому' && appointment.addressShort?.trim()
      ? appointment.addressShort.trim()
      : null;
  const heroBackground = appointmentDetailHeroBackground(statusTone);
  const heroOverlay = appointmentDetailHeroOverlayClass(statusTone);

  return (
    <section className={apptDetailHeroCard} aria-label="Дата и время визита">
      <div
        className="pointer-events-none absolute inset-0 scale-105 bg-cover bg-center"
        style={{ backgroundImage: `url(${heroBackground})` }}
        aria-hidden
      />
      <div className={`pointer-events-none absolute inset-0 ${heroOverlay}`} aria-hidden />

      <div className="relative px-4 py-4 sm:px-5 sm:py-6">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-[12px] bg-white/80 backdrop-blur-[2px] sm:h-11 sm:w-11 sm:rounded-[14px]">
              <img
                src={HEADER_LOGO_SRC}
                alt=""
                className="h-8 w-auto max-w-none object-contain object-center scale-[1.35] sm:h-10"
              />
            </span>
            {weekday ? (
              <p className="min-w-0 text-[12px] font-semibold capitalize leading-snug text-[#6B7280] sm:text-[13px]">
                {weekday}
              </p>
            ) : null}
          </div>
          <span className="shrink-0 rounded-full bg-white/85 px-2.5 py-0.5 text-[11px] font-semibold text-[#6B7280] backdrop-blur-[2px] sm:px-3 sm:py-1 sm:text-[12px]">
            {visit}
          </span>
        </div>

        <div className="mt-2 sm:mt-3">
          <HeroStatusBadge statusLabel={statusLabel} statusTone={statusTone} />
          <p className="mt-1 whitespace-nowrap text-[2rem] font-black leading-none tracking-[-0.05em] tabular-nums text-[#111827] sm:text-[2.375rem]">
            {timeRange}
          </p>
        </div>

        <div className="mt-4 border-t border-white/50 pt-3.5 sm:mt-5 sm:pt-4">
          <p className="text-[15px] font-bold leading-snug tracking-[-0.02em] text-[#111827] sm:text-[17px]">
            {appointment.serviceTitle}
          </p>
          <div className="mt-2.5 flex flex-wrap items-center gap-2 sm:mt-3">
            <span className="rounded-full bg-white/85 px-2.5 py-0.5 text-[14px] font-black tabular-nums text-[#F47C8C] backdrop-blur-[2px] sm:px-3 sm:py-1 sm:text-[15px]">
              {formatBynRu(appointment.priceByn)}
            </span>
            <span className="rounded-full bg-white/75 px-2.5 py-0.5 text-[12px] font-bold tabular-nums text-[#374151] backdrop-blur-[2px] sm:px-3 sm:py-1 sm:text-[13px]">
              {duration}
            </span>
          </div>
          {addressDetail ? (
            <p className="mt-2 text-[12px] font-medium leading-snug text-[#6B7280] sm:mt-2.5 sm:text-[13px]">
              {addressDetail}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
