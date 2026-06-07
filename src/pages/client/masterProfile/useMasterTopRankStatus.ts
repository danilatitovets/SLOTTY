import { useEffect, useMemo, useState } from 'react';
import { getApiBaseUrl } from '../../../shared/api/backendClient';
import {
  catalogItemToListingRecord,
  fetchCatalogListings,
} from '../../../features/services/api/catalogListingsApi';
import {
  resolveMasterTopRankStatus,
  type MasterTopRankStatus,
} from '../lib/resolveMasterTopRankStatus';
import {
  masterProfileToListingRecord,
  mergeCatalogRecordsWithProfile,
} from './masterProfileToListingRecord';
import type { ExtendedMasterProfile, NearestSlotInfo } from './types';

const EMPTY_STATUS: MasterTopRankStatus = {
  achievements: [],
  labels: [],
  primaryLabel: null,
  ready: false,
};

export function useMasterTopRankStatus(
  master: ExtendedMasterProfile | undefined,
  nearest?: NearestSlotInfo | null,
): MasterTopRankStatus {
  const [status, setStatus] = useState<MasterTopRankStatus>(EMPTY_STATUS);

  const categoryCode = master?.categoryCode?.trim() || undefined;

  useEffect(() => {
    if (!master || !getApiBaseUrl()) {
      setStatus({ ...EMPTY_STATUS, ready: Boolean(master) });
      return;
    }

    let cancelled = false;
    setStatus((prev) => ({ ...prev, ready: false }));

    const selfRecord = masterProfileToListingRecord(master, nearest);

    void (async () => {
      try {
        const response = await fetchCatalogListings({
          category: categoryCode,
          sortBy: 'rating',
          limit: 80,
          page: 1,
        });
        if (cancelled) return;

        const records = response.items.map(catalogItemToListingRecord);
        const merged = mergeCatalogRecordsWithProfile(records, selfRecord);

        setStatus({ ...resolveMasterTopRankStatus(master.masterId, merged), ready: true });
      } catch {
        if (!cancelled) {
          setStatus({
            ...resolveMasterTopRankStatus(master.masterId, [selfRecord]),
            ready: true,
          });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [master?.masterId, master?.rating, master?.reviewsCount, categoryCode, nearest?.startsAt]);

  return useMemo(() => status, [status]);
}
