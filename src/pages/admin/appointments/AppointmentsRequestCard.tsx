import { HiCheck, HiPhoto, HiPhone, HiXMark } from 'react-icons/hi2';
import type { DemoMasterAppointment } from '../../../features/master/model/demoMasterAppointments';
import {
  apptBadgeNew,
  apptCardActionsCompact,
  apptCardShell,
  apptCompactOutlineBtn,
  apptCompactPinkBtn,
  apptTimeStrip,
  apptTimeStripDate,
  apptTimeStripNew,
  apptTimeStripTime,
} from './adminAppointmentsTheme';
import { resolveClientDisplayName } from './appointmentDetailHelpers';
import { AppointmentsCardMetricsRow } from './AppointmentsCardMetricsRow';
import { AppointmentsClientAvatar } from './AppointmentsClientAvatar';
import { formatAppointmentPrice, formatCardDateTime } from './appointmentsFormat';
import { PendingDeadlineHint, isPendingConfirmDisabled } from './PendingDeadlineHint';

type Props = {
  appointment: DemoMasterAppointment;
  onConfirm: () => void;
  onReject: () => void;
  onOpenDetail: () => void;
};

export function AppointmentsRequestCard({
  appointment,
  onConfirm,
  onReject,
  onOpenDetail,
}: Props) {
  const displayName = resolveClientDisplayName(appointment);
  const phone = appointment.contact?.trim() || null;
  const email = appointment.clientEmail?.trim() || null;
  const dateTime = formatCardDateTime(appointment.date, appointment.time);
  const dateShort = dateTime.split(' · ')[0] ?? dateTime;
  const confirmDisabled = isPendingConfirmDisabled(
    appointment.dbStatus ?? appointment.status,
    appointment.pendingExpiresAt,
  );

  return (
    <article className={apptCardShell}>
      <div className="flex min-w-0 flex-1">
        <div className={`${apptTimeStrip} ${apptTimeStripNew}`}>
          <span className="text-[10px] font-semibold leading-none">Новая</span>
          <span className={apptTimeStripTime}>{appointment.time}</span>
          <span className={apptTimeStripDate}>{dateShort}</span>
        </div>

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex min-w-0 flex-1 items-start gap-2.5 p-3 sm:gap-3 sm:p-4">
            <AppointmentsClientAvatar
              name={displayName}
              phone={phone}
              photoUrl={appointment.clientAvatarUrl}
              size="sm"
            />
            <div className="min-w-0 flex-1">
              <p className="line-clamp-2 text-[15px] font-bold leading-snug tracking-[-0.02em] text-[#111827] sm:line-clamp-1">
                {displayName}
              </p>
              <div className="mt-1">
                <span className={apptBadgeNew}>Новая</span>
              </div>

              {phone || email ? (
                <div className="mt-1.5 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5 text-[12px]">
                  {phone ? (
                    <a
                      href={`tel:${phone.replace(/\s/g, '')}`}
                      className="inline-flex min-w-0 items-center gap-1 font-semibold text-[#F47C8C]"
                    >
                      <HiPhone className="h-3 w-3 shrink-0" aria-hidden />
                      <span className="truncate">{phone}</span>
                    </a>
                  ) : null}
                  {email ? (
                    <span className="min-w-0 truncate font-medium text-[#9CA3AF]">{email}</span>
                  ) : null}
                </div>
              ) : null}

              <p className="mt-1.5 line-clamp-2 text-[13px] font-medium leading-snug text-[#6B7280]">
                {appointment.serviceTitle}
              </p>

              {appointment.clientReferencePhotoUrl ? (
                <p className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-[#F47C8C]">
                  <HiPhoto className="h-3 w-3" aria-hidden />
                  Фото-референс
                </p>
              ) : null}

              <AppointmentsCardMetricsRow
                price={formatAppointmentPrice(appointment.priceByn)}
                duration=""
                onOpen={onOpenDetail}
              />

              <PendingDeadlineHint
                pendingExpiresAt={appointment.pendingExpiresAt}
                compact
                className="mt-1.5"
              />
            </div>
          </div>

          <div className={`${apptCardActionsCompact} border-t border-[#F3F4F6]`}>
            <button type="button" onClick={onReject} className={apptCompactOutlineBtn}>
              <HiXMark className="h-3.5 w-3.5" aria-hidden />
              Отклонить
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={confirmDisabled}
              className={`${apptCompactPinkBtn} disabled:opacity-50`}
            >
              <HiCheck className="h-3.5 w-3.5" aria-hidden />
              Подтвердить
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
