import type { DemoMasterAppointment } from '../../../features/master/model/demoMasterAppointments';
import { resolveClientDisplayName } from './appointmentDetailHelpers';
import { AppointmentCancelledBadge } from './AppointmentCancelledBadge';
import { AppointmentCompletedBadge } from './AppointmentCompletedBadge';
import {
  apptCardBody,
  apptCardShell,
  apptHistoryAttentionCard,
  apptTimeStrip,
  apptTimeStripCancelled,
  apptTimeStripCompleted,
  apptTimeStripDate,
  apptTimeStripTime,
} from './adminAppointmentsTheme';
import { AppointmentsCardMetricsRow } from './AppointmentsCardMetricsRow';
import { AppointmentsClientAvatar } from './AppointmentsClientAvatar';
import {
  formatAppointmentPrice,
  formatCardDateTime,
  formatDurationMinutes,
  historyStatusLabel,
} from './appointmentsFormat';

type Props = {
  appointment: DemoMasterAppointment;
  onOpen: () => void;
  attention?: boolean;
};

function timeStripClass(status: DemoMasterAppointment['status']): string {
  if (status === 'completed') return apptTimeStripCompleted;
  return apptTimeStripCancelled;
}

export function AppointmentsHistoryRow({ appointment, onOpen, attention }: Props) {
  const displayName = resolveClientDisplayName(appointment);
  const dateLabel = formatCardDateTime(appointment.date, appointment.time);
  const dateShort = dateLabel.split(' · ')[0] ?? dateLabel;
  const shellClass = attention ? apptHistoryAttentionCard : apptCardShell;
  const statusBadgeClassName = 'text-[12px] [&_img]:!h-4 [&_img]:!w-4';
  const statusBadge =
    appointment.status === 'completed' ? (
      <AppointmentCompletedBadge
        label={historyStatusLabel(appointment.status)}
        className={statusBadgeClassName}
      />
    ) : (
      <AppointmentCancelledBadge
        label={historyStatusLabel(appointment.status)}
        className={statusBadgeClassName}
      />
    );

  return (
    <article className={shellClass}>
      <div className={apptCardBody}>
        <div className={`${apptTimeStrip} ${timeStripClass(appointment.status)}`}>
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
            <div className="mt-1">{statusBadge}</div>
            <p className="mt-1.5 line-clamp-2 text-[13px] font-medium leading-snug text-[#6B7280]">
              {appointment.serviceTitle}
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
