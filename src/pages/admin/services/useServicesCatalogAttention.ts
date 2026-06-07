import { useCallback, useEffect, useMemo, useState } from 'react';
import { getMySlots, type MySlotDto } from '../../../features/admin/api/adminSlotsApi';
import { useAdminMasterCabinet } from '../AdminMasterCabinetContext';
import { subscribeMasterSlotsChanged } from '../shared/masterSlotsInvalidation';
import { hasVisibleServicesWithoutSlots } from './servicesCatalogAttention';
import { useServiceBookingStats } from './useServiceBookingStats';

export function useServicesCatalogAttention(): boolean {
  const { draft, appointments, useCabinetApi } = useAdminMasterCabinet();
  const [slots, setSlots] = useState<MySlotDto[] | null>(null);
  const [slotsResolved, setSlotsResolved] = useState(!useCabinetApi);

  const reloadSlots = useCallback(() => {
    if (!useCabinetApi) {
      setSlots(null);
      setSlotsResolved(true);
      return;
    }

    void getMySlots()
      .then((rows) => {
        setSlots(rows);
        setSlotsResolved(true);
      })
      .catch(() => {
        setSlots(null);
        setSlotsResolved(true);
      });
  }, [useCabinetApi]);

  useEffect(() => {
    reloadSlots();
  }, [reloadSlots, draft.services.length]);

  useEffect(() => subscribeMasterSlotsChanged(reloadSlots), [reloadSlots]);

  const services = useMemo(
    () => draft.services.map((service) => ({ id: service.id, isActive: service.isActive })),
    [draft.services],
  );

  const stats = useServiceBookingStats(services, slots, appointments);

  return useMemo(() => {
    if (!services.length || !slotsResolved) return false;
    return hasVisibleServicesWithoutSlots(services, stats);
  }, [services, slotsResolved, stats]);
}
