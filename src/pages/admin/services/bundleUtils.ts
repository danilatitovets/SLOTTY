import type { MasterDraft } from '../../../features/profile/lib/demoMasterStorage';
import type { ManagedService } from './servicesFormat';
import { serviceImageUrl } from './servicesFormat';
import type { ServiceBundle, ServiceBundleImageSource, ServiceBundleStatus } from './servicesTypes';

export function calcBundleDiscount(originalPrice: number, bundlePrice: number) {
  const discountAmount = Math.max(0, Math.round((originalPrice - bundlePrice) * 100) / 100);
  const discountPercent =
    originalPrice > 0 && bundlePrice < originalPrice
      ? Math.round((discountAmount / originalPrice) * 100)
      : 0;
  return { discountAmount, discountPercent };
}

export function sumServicesPrice(services: ManagedService[], ids: string[]): number {
  return ids.reduce((sum, id) => {
    const s = services.find((r) => r.id === id);
    return sum + (s?.priceByn ?? 0);
  }, 0);
}

export function sumServicesDuration(services: ManagedService[], ids: string[]): number {
  return ids.reduce((sum, id) => {
    const s = services.find((r) => r.id === id);
    return sum + (s?.durationMin ?? 0);
  }, 0);
}

export function generateBundleTitle(services: ManagedService[], ids: string[]): string {
  const titles = ids
    .map((id) => services.find((s) => s.id === id)?.title)
    .filter(Boolean) as string[];
  if (titles.length === 0) return 'Набор услуг';
  if (titles.length <= 2) return titles.join(' + ');
  return `${titles[0]} + ${titles[1]} + ещё ${titles.length - 2}`;
}

export function resolveBundleImageFromServices(
  services: ManagedService[],
  ids: string[],
  draft: MasterDraft,
): { url: string | null; source: ServiceBundleImageSource } {
  for (const id of ids) {
    const svc = services.find((s) => s.id === id);
    if (!svc) continue;
    const url = serviceImageUrl(svc, draft);
    if (url) return { url, source: 'service' };
  }
  return { url: null, source: 'placeholder' };
}

export function resolveBundleDisplayImage(
  bundle: Pick<ServiceBundle, 'imageUrl' | 'imageSource' | 'serviceIds'>,
  services: ManagedService[],
  draft: MasterDraft,
): string | null {
  if (bundle.imageUrl?.trim()) return bundle.imageUrl.trim();
  if (bundle.imageSource === 'placeholder') return null;
  if (bundle.imageSource === 'portfolio') {
    return draft.portfolio?.[0]?.imageUrl ?? draft.photoUrl ?? null;
  }
  return resolveBundleImageFromServices(services, bundle.serviceIds, draft).url;
}

export function bundleStatusLabel(status: ServiceBundleStatus): string {
  switch (status) {
    case 'visible':
      return 'Виден';
    case 'hidden':
      return 'Скрыт';
    default:
      return 'Черновик';
  }
}

export function bundleHasDiscount(originalPrice: number, bundlePrice: number): boolean {
  return bundlePrice > 0 && bundlePrice < originalPrice;
}
