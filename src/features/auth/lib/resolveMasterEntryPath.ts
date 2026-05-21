import { ADMIN_PATH, BECOME_MASTER_PATH, MASTER_LOGIN_PATH } from '../../../app/paths';

type Args = {
  isAuthenticated: boolean;
  isMasterUser: boolean;
};

/** CTA «Стать мастером» / кабинет по роли и авторизации. */
export function resolveMasterEntryPath({ isAuthenticated, isMasterUser }: Args): string {
  if (!isAuthenticated) return MASTER_LOGIN_PATH;
  if (isMasterUser) return ADMIN_PATH;
  return BECOME_MASTER_PATH;
}
