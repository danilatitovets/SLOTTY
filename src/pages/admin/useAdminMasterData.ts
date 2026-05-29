export {
  AdminMasterCabinetProvider,
  useAdminMasterCabinet,
} from './AdminMasterCabinetContext';

import { useAdminMasterCabinet } from './AdminMasterCabinetContext';

export function useAdminMasterDraft() {
  const {
    draft,
    persistDraft,
    commitDraftBaseline,
    flushDraftToBackend,
    flushScheduleToBackend,
    flushLocationToBackend,
    patchProfileToBackend,
    refreshDraft,
  } = useAdminMasterCabinet();
  return {
    draft,
    persistDraft,
    commitDraftBaseline,
    flushDraftToBackend,
    flushScheduleToBackend,
    flushLocationToBackend,
    patchProfileToBackend,
    refreshDraft,
  };
}

export function useAdminAppointments() {
  const { appointments, persistAppointments } = useAdminMasterCabinet();
  return { appointments, persistAppointments };
}
