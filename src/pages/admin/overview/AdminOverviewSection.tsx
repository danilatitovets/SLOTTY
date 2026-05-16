import { useState } from 'react';
import { ADMIN_APPOINTMENTS_PATH } from '../../../app/paths';
import type { DemoMasterAppointment } from '../../../features/master/model/demoMasterAppointments';
import { AdminAppointmentDetailSheet } from '../shared/AdminAppointmentDetailSheet';
import { useAdminAppointments, useAdminMasterDraft } from '../useAdminMasterData';
import { overviewPageBg } from './adminOverviewTheme';
import { AdminOverviewTab } from './AdminOverviewTab';

export function AdminOverviewSection() {
  const { draft } = useAdminMasterDraft();
  const { appointments, persistAppointments } = useAdminAppointments();
  const [detailAppt, setDetailAppt] = useState<DemoMasterAppointment | null>(null);

  return (
    <>
      <div className={`-mx-4 px-4 pb-10 pt-1 ${overviewPageBg}`}>
        <AdminOverviewTab
          draft={draft}
          appointments={appointments}
          appointmentsPath={ADMIN_APPOINTMENTS_PATH}
          onOpenAppointment={(a) => setDetailAppt(a)}
        />
      </div>

      <AdminAppointmentDetailSheet
        appointment={detailAppt}
        onClose={() => setDetailAppt(null)}
        onUpdateAppointment={(next) => {
          persistAppointments(appointments.map((a) => (a.id === next.id ? next : a)));
        }}
      />
    </>
  );
}
