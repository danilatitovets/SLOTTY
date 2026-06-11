import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../../features/auth/AuthProvider';
import {
  catalogItemToListingRecord,
  fetchCatalogListings,
} from '../../../features/services/api/catalogListingsApi';
import type { ServiceListingRecord } from '../../../features/services/model/demoMasters';
import type { MasterDraft } from '../../../features/profile/lib/demoMasterStorage';
import { getApiBaseUrl } from '../../../shared/api/backendClient';
import {
  resolveMasterTopRankStatus,
  type MasterTopRankStatus,
} from '../../client/lib/resolveMasterTopRankStatus';
import { mergeCatalogRecordsWithProfile } from '../../client/masterProfile/masterProfileToListingRecord';
import { useAdminMasterCabinet } from '../AdminMasterCabinetContext';
import type { CabinetProfileMeta } from '../adminCabinetSessionCache';

const EMPTY_STATUS: MasterTopRankStatus = {
  achievements: [],
  labels: [],
  primaryLabel: null,
  ready: false,
};

function cabinetDraftToListingRecord(
  draft: MasterDraft,
  masterId: string,
  meta: CabinetProfileMeta | null,
): ServiceListingRecord {
  const services = draft.services ?? [];
  const prices = services
    .map((s) => s.priceByn)
    .filter((p) => Number.isFinite(p) && p >= 0);
  const minPrice = prices.length ? Math.min(...prices) : 0;
  const primary = services[0];

  return {
    id: `${masterId}-cabinet`,
    masterId,
    masterName: draft.name?.trim() || 'Мастер',
    category: draft.category?.trim() || 'Услуги',
    categoryCode: draft.primaryCategoryCode,
    serviceName: primary?.title ?? 'Услуга',
    rating: meta?.rating ?? 0,
    reviewsCount: meta?.reviewsCount ?? 0,
    isVerified: false,
    location: draft.location ?? { visitType: 'studio', street: '', building: '' },
    priceFrom: minPrice,
    photoUrl: draft.photoUrl?.trim() || '',
    primaryServiceId: primary?.id,
    nextSlotStartsAt: null,
    nextSlotId: null,
    portfolioTotal: draft.portfolio?.length ?? 0,
  };
}

export function useAdminProfileAchievements(): MasterTopRankStatus {
  const { profile } = useAuth();
  const { draft, cabinetProfileMeta, useCabinetApi } = useAdminMasterCabinet();
  const masterId = profile?.id?.trim() ?? null;
  const categoryCode = draft.primaryCategoryCode?.trim() || undefined;

  const [status, setStatus] = useState<MasterTopRankStatus>(EMPTY_STATUS);

  useEffect(() => {
    if (!masterId) {
      setStatus({ ...EMPTY_STATUS, ready: true });
      return;
    }

    const selfRecord = cabinetDraftToListingRecord(draft, masterId, cabinetProfileMeta);

    if (!useCabinetApi || !getApiBaseUrl()) {
      setStatus({
        ...resolveMasterTopRankStatus(masterId, [selfRecord]),
        ready: true,
      });
      return;
    }

    let cancelled = false;
    setStatus((prev) => ({ ...prev, ready: false }));

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
        setStatus({ ...resolveMasterTopRankStatus(masterId, merged), ready: true });
      } catch {
        if (!cancelled) {
          setStatus({
            ...resolveMasterTopRankStatus(masterId, [selfRecord]),
            ready: true,
          });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    masterId,
    draft.name,
    draft.category,
    draft.primaryCategoryCode,
    draft.services,
    draft.portfolio?.length,
    draft.photoUrl,
    draft.location?.city,
    cabinetProfileMeta?.rating,
    cabinetProfileMeta?.reviewsCount,
    categoryCode,
    useCabinetApi,
  ]);

  return useMemo(() => status, [status]);
}
