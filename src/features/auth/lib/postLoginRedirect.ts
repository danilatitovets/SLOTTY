import { ADMIN_PATH, BECOME_MASTER_PATH, getProfilePath } from '../../../app/paths';

/** Куда отправить клиента после входа на /login. */
export function getPostClientLoginPath(search: string): string {
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  const from = params.get('from') ?? params.get('redirect');
  if (from && from.startsWith('/') && !from.startsWith('//')) {
    return from;
  }
  return getProfilePath('appointments');
}

/** Куда отправить мастера после входа на /master/login. */
export function getPostMasterLoginPath(role: string | undefined): string {
  if (role === 'master') return ADMIN_PATH;
  return BECOME_MASTER_PATH;
}
