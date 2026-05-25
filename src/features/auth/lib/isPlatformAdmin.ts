import type { BackendProfile } from '../types';

export function isPlatformAdmin(profile: BackendProfile | null | undefined): boolean {
  return profile?.role === 'platform_admin';
}
