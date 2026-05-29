import type { BackendProfile } from '../types';

/** Профиль с доступом к API-кабинету мастера (/admin, GET /api/masters/me). */
export function hasMasterCabinetAccess(
  profile: Pick<BackendProfile, 'role' | 'hasMasterProfile'> | null | undefined,
): boolean {
  return Boolean(
    profile &&
      (profile.role === 'master' ||
        profile.role === 'platform_admin' ||
        profile.hasMasterProfile === true),
  );
}
