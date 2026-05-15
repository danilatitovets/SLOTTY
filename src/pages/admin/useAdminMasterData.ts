export {
  AdminMasterCabinetProvider,
  useAdminMasterCabinet,
} from './AdminMasterCabinetContext';

import { useAdminMasterCabinet } from './AdminMasterCabinetContext';

export function useAdminMasterDraft() {
  const { draft, persistDraft, flushDraftToBackend, patchProfileToBackend, refreshDraft } =
    useAdminMasterCabinet();
  return { draft, persistDraft, flushDraftToBackend, patchProfileToBackend, refreshDraft };
}

export function useAdminAppointments() {
  const { appointments, persistAppointments } = useAdminMasterCabinet();
  return { appointments, persistAppointments };
}
