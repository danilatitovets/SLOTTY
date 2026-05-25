import { HiChevronRight } from 'react-icons/hi2';
import type { DemoMasterAppointment } from '../../../features/master/model/demoMasterAppointments';
import {
  apptBadgeConfirmed,
  apptCardBody,
  apptCardShellInteractive,
  apptChevron,
  apptMetaMuted,
  apptPriceText,
  apptTimeStrip,
  apptTimeStripDefault,
} from './adminAppointmentsTheme';
import { AppointmentsClientAvatar } from './AppointmentsClientAvatar';
import { estimateDurationLabel, formatAppointmentPrice, formatVisitPlace } from './appointmentsFormat';

type Props = {
  appointment: DemoMasterAppointment;
  onOpen: () => void;
};

export function AppointmentsUpcomingRow({ appointment, onOpen }: Props) {
  return (
    <button type="button" onClick={onOpen} className={`group w-full text-left ${apptCardShellInteractive}`}>
      <div className={apptCardBody}>
        <div className={`${apptTimeStrip} ${apptTimeStripDefault}`}>
          <span className="text-[15px] font-bold tabular-nums leading-none">{appointment.time}</span>
          <span className="text-[11px] font-medium opacity-80">запись</span>
        </div>

        <div className="flex min-w-0 flex-1 items-center gap-3 p-3.5 sm:p-4">
          <AppointmentsClientAvatar name={appointment.clientName} />
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <p className="truncate text-[16px] font-bold text-[#111827]">{appointment.clientName}</p>
              <span className={`shrink-0 ${apptBadgeConfirmed}`}>Подтверждена</span>
            </div>
            <p className="mt-0.5 line-clamp-2 text-[14px] font-medium leading-snug text-[#6B7280]">
              {appointment.serviceTitle}
            </p>
            <p className={`mt-1.5 text-[13px] ${apptMetaMuted}`}>
              {estimateDurationLabel(appointment.serviceTitle)} ·{' '}
              {formatVisitPlace(appointment.addressShort)}
            </p>
            <p className={`mt-1 text-[15px] ${apptPriceText}`}>
              {formatAppointmentPrice(appointment.priceByn)}
            </p>
          </div>
          <HiChevronRight className={apptChevron} aria-hidden />
        </div>
      </div>
    </button>
  );
}
