import { HiCheck, HiPhoto, HiXMark } from 'react-icons/hi2';
import type { DemoMasterAppointment } from '../../../features/master/model/demoMasterAppointments';
import {
  apptBadgeNew,
  apptCardActions,
  apptCardBody,
  apptCardShell,
  apptMetaMuted,
  apptOutlineBtn,
  apptPinkBtn,
  apptPriceText,
  apptTimeStrip,
  apptTimeStripNew,
} from './adminAppointmentsTheme';
import { AppointmentsClientAvatar } from './AppointmentsClientAvatar';
import { formatAppointmentPrice, formatCardDateTime } from './appointmentsFormat';

type Props = {
  appointment: DemoMasterAppointment;
  onConfirm: () => void;
  onReject: () => void;
};

export function AppointmentsRequestCard({ appointment, onConfirm, onReject }: Props) {
  const dateTime = formatCardDateTime(appointment.date, appointment.time);

  return (
    <article className={apptCardShell}>
      <div className={apptCardBody}>
        <div className={`${apptTimeStrip} ${apptTimeStripNew}`}>
          <span className="text-[11px] font-semibold uppercase tracking-wide opacity-90">Новая</span>
          <span className="text-[15px] font-bold tabular-nums leading-none">{appointment.time}</span>
          <span className="max-w-full px-1 text-[10px] font-medium leading-tight opacity-80">
            {dateTime.split(' · ')[0] ?? dateTime}
          </span>
        </div>

        <div className="min-w-0 flex-1 p-3.5 sm:p-4">
          <div className="flex items-start gap-3">
            <AppointmentsClientAvatar name={appointment.clientName} />
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <p className="truncate text-[16px] font-bold tracking-[-0.02em] text-[#111827]">
                  {appointment.clientName}
                </p>
                <span className={`shrink-0 lg:hidden ${apptBadgeNew}`}>Новая</span>
              </div>
              <p className="mt-1 line-clamp-2 text-[14px] font-medium leading-snug text-[#6B7280]">
                {appointment.serviceTitle}
              </p>
              {appointment.clientReferencePhotoUrl ? (
                <p className="mt-1.5 inline-flex items-center gap-1 text-[12px] font-semibold text-[#F47C8C]">
                  <HiPhoto className="h-3.5 w-3.5" aria-hidden />
                  Есть фото-референс
                </p>
              ) : null}
              <p className={`mt-2 hidden text-[13px] lg:block ${apptMetaMuted}`}>{dateTime}</p>
              <p className={`mt-2 text-[16px] ${apptPriceText}`}>
                {formatAppointmentPrice(appointment.priceByn)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className={apptCardActions}>
        <button type="button" onClick={onReject} className={apptOutlineBtn}>
          <HiXMark className="h-4 w-4" aria-hidden />
          Отклонить
        </button>
        <button type="button" onClick={onConfirm} className={apptPinkBtn}>
          <HiCheck className="h-4 w-4" aria-hidden />
          Подтвердить
        </button>
      </div>
    </article>
  );
}
