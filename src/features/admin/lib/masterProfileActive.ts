import type { MasterPublicationStatus } from './profileCompletion';

/** Профиль виден в каталоге и доступен для новых записей. */
export function isMasterProfileActive(status: MasterPublicationStatus | null): boolean {
  return status === 'published';
}

export function masterProfileActiveLabel(status: MasterPublicationStatus | null): string {
  if (status === 'blocked') return 'Заблокирован администратором';
  if (status === 'paused') return 'На паузе';
  if (status === 'hidden') return 'Профиль отключён';
  if (status === 'published') return 'Профиль активен';
  return 'Черновик — не показывается клиентам';
}
