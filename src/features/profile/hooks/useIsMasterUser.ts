import { useAuth } from '../../auth/AuthProvider';
import { isDemoMaster } from '../lib/demoMasterStorage';

/** Мастер по демо-флагу в localStorage или по роли в профиле API. */
export function useIsMasterUser(): boolean {
  const { profile } = useAuth();
  return isDemoMaster() || profile?.role === 'master';
}
