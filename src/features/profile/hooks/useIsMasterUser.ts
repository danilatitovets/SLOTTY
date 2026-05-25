import { useAuth } from '../../auth/AuthProvider';
import { hasMasterCabinetAccess } from '../../auth/lib/hasMasterCabinetAccess';
import { isDemoMaster } from '../lib/demoMasterStorage';

/** Мастер по демо-флагу в localStorage или по доступу к кабинету мастера в API. */
export function useIsMasterUser(): boolean {
  const { profile } = useAuth();
  return isDemoMaster() || hasMasterCabinetAccess(profile);
}
