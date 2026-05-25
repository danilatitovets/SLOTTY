import { HiChevronRight } from 'react-icons/hi2';
import type { DemoMasterAppointment } from '../../../features/master/model/demoMasterAppointments';
import {
  apptBadgeHighlight,
  apptCardBody,
  apptCardShellInteractive,
  apptChevron,
  apptMetaMuted,
  apptPriceText,
  apptTimeStrip,
  apptTimeStripHighlight,
} from './adminAppointmentsTheme';
import { AppointmentsClientAvatar } from './AppointmentsClientAvatar';
import {
  estimateDurationLabel,
  formatAppointmentPrice,
  formatCardDateTime,
  formatVisitPlace,
} from './appointmentsFormat';

type Props = {
  appointment: DemoMasterAppointment;
  onOpen: () => void;
};

export function AppointmentsNearestCard({ appointment, onOpen }: Props) {
  const dateTime = formatCardDateTime(appointment.date, appointment.time);

  return (
    <button type="button" onClick={onOpen} className={`group w-full text-left ${apptCardShellInteractive}`}>
      <div className="border-b border-[#EEEEEE] px-3.5 py-2 sm:px-4">
        <span className={apptBadgeHighlight}>Ближайшая запись</span>
      </div>
      <div className={apptCardBody}>
        <div className={`${apptTimeStrip} ${apptTimeStripHighlight}`}>
          <span className="text-[15px] font-bold tabular-nums leading-none">{appointment.time}</span>
          <span className="max-w-full px-1 text-[10px] font-medium leading-tight opacity-90">
            {dateTime.split(' · ')[0] ?? dateTime}
          </span>
        </div>

        <div className="flex min-w-0 flex-1 items-start gap-3 p-3.5 sm:p-4">
          <AppointmentsClientAvatar name={appointment.clientName} size="lg" />
          <div className="min-w-0 flex-1">
            <p className="text-[17px] font-bold tracking-[-0.02em] text-[#111827]">
              {appointment.clientName}
            </p>
            <p className="mt-1 line-clamp-2 text-[14px] font-medium leading-snug text-[#6B7280]">
              {appointment.serviceTitle}
            </p>
            <p className={`mt-2 text-[13px] ${apptMetaMuted}`}>{dateTime}</p>
            <p className="mt-1 text-[13px] text-[#6B7280]">
              {estimateDurationLabel(appointment.serviceTitle)} ·{' '}
              {formatVisitPlace(appointment.addressShort)}
            </p>
            <p className={`mt-2 text-[17px] ${apptPriceText}`}>
              {formatAppointmentPrice(appointment.priceByn)}
            </p>
          </div>
          <HiChevronRight className={`mt-1 ${apptChevron}`} aria-hidden />
        </div>
      </div>
    </button>
  );
}
