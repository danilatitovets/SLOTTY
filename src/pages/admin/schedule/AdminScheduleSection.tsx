import { AdminSectionLayout } from '../shared/AdminSectionLayout';
import { useAdminMasterDraft } from '../useAdminMasterData';
import { AdminScheduleTab } from './AdminScheduleTab';

export function AdminScheduleSection() {
  const { draft, persistDraft } = useAdminMasterDraft();

  return (
    <AdminSectionLayout
      title="Расписание записи"
      subtitle="Настройте время, когда клиенты смогут записаться к вам."
    >
      <AdminScheduleTab draft={draft} onPersist={persistDraft} />
    </AdminSectionLayout>
  );
}
