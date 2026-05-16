import { calcBundleDiscount } from './bundleUtils';
import type { ServiceBundle, ServiceBundleStatus } from './servicesTypes';

function legacyStatus(raw: Partial<ServiceBundle>): ServiceBundleStatus {
  if (raw.status === 'visible' || raw.status === 'hidden' || raw.status === 'draft') {
    return raw.status;
  }
  if (raw.isActive === false) return 'hidden';
  return 'visible';
}

export function normalizeBundle(raw: Partial<ServiceBundle> & { id: string }): ServiceBundle {
  const originalPrice = Number(raw.originalPrice ?? raw.oldPriceByn ?? 0);
  const bundlePrice = Number(raw.bundlePrice ?? raw.priceByn ?? 0);
  const { discountAmount, discountPercent } = calcBundleDiscount(originalPrice, bundlePrice);
  const now = new Date().toISOString();

  return {
    id: raw.id,
    title: raw.title?.trim() || 'Набор услуг',
    description: raw.description?.trim() ?? '',
    serviceIds: Array.isArray(raw.serviceIds) ? raw.serviceIds.filter(Boolean) : [],
    originalPrice,
    bundlePrice,
    discountPercent: Number.isFinite(raw.discountPercent) ? Number(raw.discountPercent) : discountPercent,
    discountAmount: Number.isFinite(raw.discountAmount) ? Number(raw.discountAmount) : discountAmount,
    durationMinutes: Number.isFinite(raw.durationMinutes) ? Number(raw.durationMinutes) : 0,
    imageUrl: raw.imageUrl?.trim() || undefined,
    imageSource: raw.imageSource ?? (raw.imageUrl ? 'upload' : 'service'),
    status: legacyStatus(raw),
    createdAt: raw.createdAt ?? now,
    updatedAt: raw.updatedAt ?? now,
  };
}
