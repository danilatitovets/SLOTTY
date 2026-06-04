import { useCallback, useState } from 'react';
import type { DemoMasterAppointment } from '../../../features/master/model/demoMasterAppointments';
import { LoadingScreen } from '../../../shared/ui/LoadingVideo';
import { AdminAppointmentDetailSheet } from '../shared/AdminAppointmentDetailSheet';
import { afterBookingMutation } from '../../../features/appointments/bookingDataSync';
import { useAdminAppointments, useAdminMasterCabinet } from '../useAdminMasterData';
import { AdminAppointmentsTab } from './AdminAppointmentsTab';

export function AdminAppointmentsSection() {
  const { appointments, persistAppointments } = useAdminAppointments();
  const { useCabinetApi, cabinetLoading, cabinetError, reloadCabinet } = useAdminMasterCabinet();
  const [detailAppt, setDetailAppt] = useState<DemoMasterAppointment | null>(null);

  const handleAfterBookingAction = useCallback(async () => {
    afterBookingMutation();
    if (useCabinetApi) await reloadCabinet();
  }, [reloadCabinet, useCabinetApi]);

  if (useCabinetApi && cabinetLoading) {
    return <LoadingScreen className="bg-[#F1EFEF]" />;
  }

  return (
    <>
      {cabinetError ? (
        <p className="mx-4 mb-3 rounded-2xl bg-[#FFF0F0] px-4 py-2 text-center text-[13px] font-semibold text-[#9B2C2C]">
          {cabinetError}
        </p>
      ) : null}
      <AdminAppointmentsTab
        appointments={appointments}
        useRemoteList={useCabinetApi}
        onChangeAppointments={persistAppointments}
        onOpenDetail={setDetailAppt}
      />

      <AdminAppointmentDetailSheet
        appointment={detailAppt}
        onClose={() => setDetailAppt(null)}
        useLiveApi={useCabinetApi}
        onAfterAction={handleAfterBookingAction}
        actionsDisabled={useCabinetApi && cabinetLoading}
      />
    </>
  );
}
