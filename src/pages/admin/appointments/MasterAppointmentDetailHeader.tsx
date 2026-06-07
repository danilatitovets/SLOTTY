import type { DemoMasterAppointment } from '../../../features/master/model/demoMasterAppointments';
import type { MasterAppointmentLifecycleResult } from '../../../features/appointments/masterAppointmentLifecycle';
import {
  appointmentDetailHeaderSubtitle,
  appointmentDetailHeaderTitle,
} from './appointmentDetailPresentation';

type Props = {
  appointment: DemoMasterAppointment;
  lifecycle: MasterAppointmentLifecycleResult;
  warning?: string | null;
};

export function MasterAppointmentDetailHeader({ appointment, lifecycle, warning }: Props) {
  const title = appointmentDetailHeaderTitle(lifecycle.phase, appointment);
  const subtitle = appointmentDetailHeaderSubtitle(appointment);

  return (
    <div className="min-w-0 pr-1">
      <h2
        id="admin-sheet-title"
        className="text-[18px] font-black tracking-[-0.04em] text-[#111827] sm:text-[20px] lg:text-[22px]"
      >
        {title}
      </h2>
      <p className="mt-1 line-clamp-2 text-[12px] font-medium leading-snug text-[#6B7280] sm:mt-1.5 sm:text-[13px] lg:text-[14px]">
        {subtitle}
      </p>
      {warning ? (
        <p className="mt-2.5 rounded-[12px] bg-[#FEF2F2] px-3 py-2 text-[12px] font-semibold leading-snug text-[#B91C1C]">
          {warning}
        </p>
      ) : null}
    </div>
  );
}
