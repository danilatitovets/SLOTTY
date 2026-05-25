import { HiChevronRight } from 'react-icons/hi2';
import type { DemoMasterAppointment } from '../../../features/master/model/demoMasterAppointments';
import {
  apptBadgeCancelled,
  apptBadgeCompleted,
  apptCardBody,
  apptCardShellInteractive,
  apptChevron,
  apptHistoryCellDate,
  apptHistoryCellMuted,
  apptHistoryCellPrice,
  apptHistoryClientName,
  apptHistoryRow,
  apptPriceText,
  apptTimeStrip,
  apptTimeStripCancelled,
  apptTimeStripCompleted,
} from './adminAppointmentsTheme';
import { AppointmentsClientAvatar } from './AppointmentsClientAvatar';
import { formatAppointmentPrice, formatCardDateTime, historyStatusLabel } from './appointmentsFormat';

type Props = {
  appointment: DemoMasterAppointment;
  onOpen: () => void;
};

function statusBadgeClass(status: DemoMasterAppointment['status']): string {
  if (status === 'completed') return apptBadgeCompleted;
  return apptBadgeCancelled;
}

function timeStripClass(status: DemoMasterAppointment['status']): string {
  if (status === 'completed') return apptTimeStripCompleted;
  return apptTimeStripCancelled;
}

export function AppointmentsHistoryRow({ appointment, onOpen }: Props) {
  const dateLabel = formatCardDateTime(appointment.date, appointment.time);
  const dateShort = dateLabel.split(' · ')[0] ?? dateLabel;

  return (
    <>
      <button
        type="button"
        onClick={onOpen}
        className={`group w-full text-left lg:hidden ${apptCardShellInteractive}`}
      >
        <div className={apptCardBody}>
          <div className={`${apptTimeStrip} ${timeStripClass(appointment.status)}`}>
            <span className="text-[15px] font-bold tabular-nums leading-none">{appointment.time}</span>
            <span className="max-w-full px-1 text-[10px] font-medium leading-tight opacity-90">
              {dateShort}
            </span>
          </div>

          <div className="flex min-w-0 flex-1 items-center gap-3 p-3.5 sm:p-4">
            <AppointmentsClientAvatar
              name={appointment.clientName}
              photoUrl={appointment.clientAvatarUrl}
            />
            <div className="min-w-0 flex-1">
              <p className="text-[16px] font-bold leading-snug tracking-[-0.02em] text-[#111827]">
                {appointment.clientName}
              </p>
              <p className="mt-1 line-clamp-2 text-[14px] font-medium leading-snug text-[#6B7280]">
                {appointment.serviceTitle}
              </p>
              <div className="mt-2.5 flex flex-wrap items-center gap-2">
                <span className={`text-[15px] ${apptPriceText}`}>
                  {formatAppointmentPrice(appointment.priceByn)}
                </span>
                <span className={statusBadgeClass(appointment.status)}>
                  {historyStatusLabel(appointment.status)}
                </span>
              </div>
            </div>
            <HiChevronRight className={apptChevron} aria-hidden />
          </div>
        </div>
      </button>

      <button type="button" onClick={onOpen} className={apptHistoryRow}>
        <div className="flex min-w-0 items-center gap-3.5">
          <AppointmentsClientAvatar
            name={appointment.clientName}
            photoUrl={appointment.clientAvatarUrl}
            size="md"
          />
          <p className={apptHistoryClientName}>{appointment.clientName}</p>
        </div>

        <p className={apptHistoryCellMuted}>{appointment.serviceTitle}</p>

        <p className={apptHistoryCellDate}>{dateLabel}</p>

        <p className={apptHistoryCellPrice}>{formatAppointmentPrice(appointment.priceByn)}</p>

        <div className="flex min-w-0 justify-end">
          <span className={statusBadgeClass(appointment.status)}>
            {historyStatusLabel(appointment.status)}
          </span>
        </div>
      </button>
    </>
  );
}
