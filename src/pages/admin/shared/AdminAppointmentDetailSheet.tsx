import {
  appointmentStatusLabel,
  type DemoAppointmentStatus,
  type DemoMasterAppointment,
} from '../../../features/master/model/demoMasterAppointments';
import { formatBynRu, formatDdMmYyyy } from '../overview/overviewFormat';
import { AppointmentsClientAvatar } from '../appointments/AppointmentsClientAvatar';
import { formatVisitPlace, estimateDurationLabel } from '../appointments/appointmentsFormat';
import { AdminBottomSheet } from './AdminBottomSheet';
import {
  catalogSheetPrimaryBtn,
  catalogSheetSecondaryBtn,
  catalogSheetTitle,
} from './adminCatalogSheetTheme';

type Props = {
  appointment: DemoMasterAppointment | null;
  onClose: () => void;
  onUpdateAppointment?: (next: DemoMasterAppointment) => void;
  actionsDisabled?: boolean;
};

function statusBadgeClass(status: DemoAppointmentStatus): string {
  switch (status) {
    case 'pending':
      return 'bg-[#FFF4E8] text-[#B45309]';
    case 'confirmed':
      return 'bg-[#ECFDF5] text-[#16A34A]';
    case 'completed':
      return 'bg-[#ECFDF5] text-[#16A34A]';
    case 'cancelled':
      return 'bg-[#FEF2F2] text-[#EF4444]';
    default:
      return 'bg-[#EBEBEB] text-[#6B7280]';
  }
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 first:pt-0 last:pb-0">
      <span className="shrink-0 text-[13px] font-medium text-[#6B7280]">{label}</span>
      <span className="min-w-0 text-right text-[14px] font-semibold leading-snug text-[#111827]">
        {value}
      </span>
    </div>
  );
}

function AppointmentDetailHero({ appointment }: { appointment: DemoMasterAppointment }) {
  const photoUrl = appointment.clientAvatarUrl?.trim() || null;

  if (photoUrl) {
    return (
      <div className="overflow-hidden rounded-[12px] bg-white ring-1 ring-[#EEEEEE]">
        <img
          src={photoUrl}
          alt=""
          className="h-[7.75rem] w-full object-cover object-center sm:h-[8.5rem] lg:h-[9.5rem]"
        />
        <div className="space-y-1 px-4 py-4 lg:px-5">
          <p className="text-[18px] font-bold leading-tight tracking-[-0.03em] text-[#111827] lg:text-[20px]">
            {appointment.clientName}
          </p>
          <p className="text-[14px] font-medium leading-snug text-[#6B7280]">{appointment.serviceTitle}</p>
          <p className="pt-1 text-[24px] font-black tabular-nums leading-none tracking-[-0.04em] text-[#F47C8C] lg:text-[28px]">
            {formatBynRu(appointment.priceByn)}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-[12px] bg-[#F5F5F5] px-4 py-5 text-center lg:px-5">
      <div className="mx-auto flex w-fit">
        <AppointmentsClientAvatar name={appointment.clientName} size="lg" />
      </div>
      <p className="mt-3 text-[18px] font-bold leading-tight tracking-[-0.03em] text-[#111827] lg:text-[20px]">
        {appointment.clientName}
      </p>
      <p className="mt-1 text-[14px] font-medium leading-snug text-[#6B7280]">{appointment.serviceTitle}</p>
      <p className="mt-3 text-[24px] font-black tabular-nums leading-none tracking-[-0.04em] text-[#F47C8C] lg:text-[28px]">
        {formatBynRu(appointment.priceByn)}
      </p>
    </div>
  );
}

export function AdminAppointmentDetailSheet({
  appointment,
  onClose,
  onUpdateAppointment,
  actionsDisabled,
}: Props) {
  const patch = (next: DemoMasterAppointment) => {
    onUpdateAppointment?.(next);
    onClose();
  };

  const showPendingActions = appointment?.status === 'pending' && onUpdateAppointment;
  const showConfirmedActions = appointment?.status === 'confirmed' && onUpdateAppointment;

  const footer = appointment ? (
    <div className="flex w-full flex-col gap-2">
      {showPendingActions ? (
        <>
          <button
            type="button"
            disabled={actionsDisabled}
            onClick={() => patch({ ...appointment, status: 'confirmed' })}
            className={catalogSheetPrimaryBtn}
          >
            Подтвердить
          </button>
          <button
            type="button"
            disabled={actionsDisabled}
            onClick={() => patch({ ...appointment, status: 'cancelled' })}
            className={`${catalogSheetPrimaryBtn} !bg-[#FEF2F2] !text-[#EF4444] hover:!opacity-95`}
          >
            Отклонить
          </button>
        </>
      ) : null}
      {showConfirmedActions ? (
        <>
          <button
            type="button"
            disabled={actionsDisabled}
            onClick={() => patch({ ...appointment, status: 'completed' })}
            className={catalogSheetPrimaryBtn}
          >
            Завершить визит
          </button>
          <button
            type="button"
            disabled={actionsDisabled}
            onClick={() => patch({ ...appointment, status: 'cancelled' })}
            className={`${catalogSheetPrimaryBtn} !bg-[#FEF2F2] !text-[#EF4444] hover:!opacity-95`}
          >
            Отменить запись
          </button>
        </>
      ) : null}
      <button type="button" onClick={onClose} className={catalogSheetSecondaryBtn}>
        Закрыть
      </button>
    </div>
  ) : undefined;

  return (
    <AdminBottomSheet
      variant="catalog"
      open={Boolean(appointment)}
      onClose={onClose}
      headerContent={
        appointment ? (
          <div className="min-w-0 pr-2">
            <div className="flex flex-wrap items-center gap-2">
              <h2 id="admin-sheet-title" className={`${catalogSheetTitle} min-w-0 break-words`}>
                Запись
              </h2>
              <span
                className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${statusBadgeClass(appointment.status)}`}
              >
                {appointmentStatusLabel(appointment.status)}
              </span>
            </div>
          </div>
        ) : undefined
      }
      footer={footer}
    >
      {appointment ? (
        <div className="space-y-4">
          <AppointmentDetailHero appointment={appointment} />

          <div className="divide-y divide-[#EEEEEE] rounded-[10px] bg-white px-4 py-1 ring-1 ring-[#EEEEEE]">
            <SummaryRow label="Дата" value={formatDdMmYyyy(appointment.date)} />
            <SummaryRow label="Время" value={appointment.timeLabel ?? appointment.time} />
            <SummaryRow label="Длительность" value={estimateDurationLabel(appointment.serviceTitle)} />
            <SummaryRow label="Формат" value={formatVisitPlace(appointment.addressShort)} />
            <SummaryRow label="Адрес" value={appointment.addressShort?.trim() || 'Не указан'} />
            {appointment.contact ? <SummaryRow label="Контакт" value={appointment.contact} /> : null}
            {appointment.clientNote ? (
              <SummaryRow label="Комментарий" value={appointment.clientNote} />
            ) : null}
          </div>

          {appointment.clientReferencePhotoUrl ? (
            <div className="space-y-2">
              <p className="text-[13px] font-semibold text-[#6B7280]">Фото от клиента</p>
              <a
                href={appointment.clientReferencePhotoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block overflow-hidden rounded-[12px] ring-1 ring-[#EEEEEE] transition hover:opacity-95"
              >
                <img
                  src={appointment.clientReferencePhotoUrl}
                  alt="Референс клиента"
                  className="max-h-64 w-full object-cover"
                />
              </a>
            </div>
          ) : null}
        </div>
      ) : null}
    </AdminBottomSheet>
  );
}
