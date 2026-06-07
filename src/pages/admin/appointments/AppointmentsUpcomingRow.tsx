import type { DemoMasterAppointment } from '../../../features/master/model/demoMasterAppointments';
import {
  apptBadgeConfirmed,
  apptBadgeHighlight,
  apptCardBody,
  apptCardShell,
  apptHighlightCard,
  apptHistoryAttentionCard,
  apptTimeStrip,
  apptTimeStripDate,
  apptTimeStripDefault,
  apptTimeStripHighlight,
  apptTimeStripTime,
} from './adminAppointmentsTheme';
import { resolveClientDisplayName } from './appointmentDetailHelpers';
import { AppointmentsCardMetricsRow } from './AppointmentsCardMetricsRow';
import { AppointmentsClientAvatar } from './AppointmentsClientAvatar';
import {
  formatAppointmentPrice,
  formatCardDateTime,
  formatDurationMinutes,
  formatVisitPlace,
} from './appointmentsFormat';

type Props = {
  appointment: DemoMasterAppointment;
  onOpen: () => void;
  overdue?: boolean;
  nearest?: boolean;
};

function statusBadgeClass(overdue: boolean, nearest: boolean): string {
  if (overdue) return 'rounded-full bg-[#FEE2E2] px-2.5 py-1 text-[11px] font-bold text-[#B91C1C]';
  if (nearest) return apptBadgeHighlight;
  return apptBadgeConfirmed;
}

function statusBadgeLabel(overdue: boolean, nearest: boolean): string {
  if (overdue) return 'Визит не закрыт';
  if (nearest) return 'Ближайшая';
  return 'Подтверждена';
}

export function AppointmentsUpcomingRow({ appointment, onOpen, overdue = false, nearest = false }: Props) {
  const displayName = resolveClientDisplayName(appointment);
  const dateLabel = formatCardDateTime(appointment.date, appointment.time);
  const dateShort = dateLabel.split(' · ')[0] ?? dateLabel;
  const shellClass = overdue
    ? apptHistoryAttentionCard
    : nearest
      ? apptHighlightCard
      : apptCardShell;
  const stripClass = overdue
    ? 'bg-[#FEE2E2] text-[#B91C1C]'
    : nearest
      ? apptTimeStripHighlight
      : apptTimeStripDefault;

  return (
    <article className={shellClass}>
      <div className={apptCardBody}>
        <div className={`${apptTimeStrip} ${stripClass}`}>
          <span className={apptTimeStripTime}>{appointment.time}</span>
          <span className={apptTimeStripDate}>{dateShort}</span>
        </div>

        <div className="flex min-w-0 flex-1 items-start gap-2.5 p-3 sm:gap-3 sm:p-4">
          <AppointmentsClientAvatar
            name={displayName}
            phone={appointment.contact}
            photoUrl={appointment.clientAvatarUrl}
            size="sm"
          />
          <div className="min-w-0 flex-1">
            <p className="line-clamp-2 text-[15px] font-bold leading-snug tracking-[-0.02em] text-[#111827] sm:line-clamp-1">
              {displayName}
            </p>
            <div className="mt-1">
              <span className={`inline-flex ${statusBadgeClass(overdue, nearest)}`}>
                {statusBadgeLabel(overdue, nearest)}
              </span>
            </div>
            <p className="mt-1.5 line-clamp-2 text-[13px] font-medium leading-snug text-[#6B7280]">
              {appointment.serviceTitle}
            </p>
            <p className="mt-1 text-[12px] font-medium text-[#9CA3AF]">
              {formatVisitPlace(appointment.addressShort)}
            </p>
            <AppointmentsCardMetricsRow
              price={formatAppointmentPrice(appointment.priceByn)}
              duration={formatDurationMinutes(appointment.durationMinutes, appointment.serviceTitle)}
              onOpen={onOpen}
            />
          </div>
        </div>
      </div>
    </article>
  );
}
