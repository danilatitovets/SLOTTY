import { LOCATION_EMPTY_SENTINEL } from '../../../shared/lib/emptyDisplayText';
import { apiFetch } from '../../../shared/api/backendClient';
import { fetchPublicGetCached } from '../../../shared/api/publicGetCache';
import { resolveServiceListingCoverUrl } from '../../catalog/catalogServicePhotos';
import { masterListingPortraitUrl } from '../../masters/lib/masterListingPortrait';
import type { MasterLocation } from '../../profile/model/masterLocation';
import type { ServiceListingRecord } from '../../services/model/demoMasters';

async function readApiError(res: Response): Promise<string> {
  const j = (await res.json().catch(() => null)) as { error?: { message?: string } } | null;
  return j?.error?.message ?? `Ошибка ${res.status}`;
}

export type PublishedMasterDto = {
  masterId: string;
  displayName: string;
  bio: string;
  photoUrl: string | null;
  slug: string | null;
  rating: number;
  reviewsCount: number;
  category: { code: string; name: string } | null;
  location: { publicAddress: string; city: string | null; lat: number | null; lng: number | null } | null;
  minServicePrice: number | null;
  primaryServiceId: string | null;
  primaryServiceName: string | null;
  nextSlotStartsAt: string | null;
  completedBookingsCount?: number;
};

export async function fetchPublishedMasters(params: {
  category?: string;
  search?: string;
  limit?: number;
}): Promise<PublishedMasterDto[]> {
  const q = new URLSearchParams();
  if (params.category) q.set('category', params.category);
  if (params.search?.trim()) q.set('search', params.search.trim());
  if (params.limit != null) q.set('limit', String(params.limit));
  const qs = q.toString();
  const url = `/api/masters${qs ? `?${qs}` : ''}`;
  return fetchPublicGetCached(url, async () => {
    const res = await apiFetch(url, { skipAuth: true });
    if (!res.ok) throw new Error(await readApiError(res));
    const j = (await res.json()) as { masters?: PublishedMasterDto[] };
    return j.masters ?? [];
  });
}

export function publishedMasterToListingRecord(m: PublishedMasterDto): ServiceListingRecord {
  const categoryLabel = m.category?.name?.trim() || m.category?.code || 'Мастер';
  const loc: MasterLocation = m.location
    ? {
        visitType: 'studio',
        city: m.location.city?.trim() || undefined,
        street: (m.location.publicAddress || '').trim() || LOCATION_EMPTY_SENTINEL,
        building: '',
        ...(m.location.lat != null &&
        m.location.lng != null &&
        Number.isFinite(m.location.lat) &&
        Number.isFinite(m.location.lng)
          ? { lat: m.location.lat, lng: m.location.lng }
          : {}),
      }
    : { visitType: 'studio', street: LOCATION_EMPTY_SENTINEL, building: '' };

  const price = m.minServicePrice != null && Number.isFinite(m.minServicePrice) ? m.minServicePrice : 0;
  const serviceName = (m.primaryServiceName && m.primaryServiceName.trim()) || 'Услуга';
  const categoryCode = m.category?.code?.trim() || undefined;

  return {
    id: `${m.masterId}-${m.primaryServiceId ?? 'svc'}`,
    masterId: m.masterId,
    masterName: m.displayName.trim() || 'Мастер',
    category: categoryLabel,
    categoryCode,
    serviceName,
    rating: m.rating,
    reviewsCount: m.reviewsCount,
    location: loc,
    priceFrom: price,
    photoUrl: masterListingPortraitUrl(m.photoUrl),
    serviceCoverUrl: resolveServiceListingCoverUrl({
      category: categoryLabel,
      categoryCode,
      serviceName,
    }),
    primaryServiceId: m.primaryServiceId ?? undefined,
    nextSlotStartsAt: m.nextSlotStartsAt,
    completedBookingsCount:
      m.completedBookingsCount != null && Number.isFinite(m.completedBookingsCount)
        ? Math.max(0, Math.round(m.completedBookingsCount))
        : undefined,
  };
}
