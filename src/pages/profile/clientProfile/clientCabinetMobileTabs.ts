import { useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getProfilePath, PROFILE_NOTIFICATIONS_PATH, PROFILE_PATH } from '../../../app/paths';

export type ClientProfileMainTab = 'appointments' | 'favorites' | 'notifications' | 'profile';

export function resolveClientCabinetMobileTab(pathname: string, search: string): ClientProfileMainTab {
  if (pathname === PROFILE_NOTIFICATIONS_PATH) return 'notifications';
  if (pathname !== PROFILE_PATH) return 'appointments';
  const tab = new URLSearchParams(search).get('tab');
  if (tab === 'favorites') return 'favorites';
  if (tab === 'profile') return 'profile';
  if (tab === 'notifications') return 'notifications';
  return 'appointments';
}

export function getClientCabinetMobileTabPath(tab: ClientProfileMainTab): string {
  if (tab === 'notifications') return PROFILE_NOTIFICATIONS_PATH;
  return getProfilePath(tab);
}

export function isClientCabinetMobileTabRoute(pathname: string): boolean {
  return pathname === PROFILE_PATH || pathname === PROFILE_NOTIFICATIONS_PATH;
}

export function useClientCabinetMobileTabNav() {
  const navigate = useNavigate();
  const { pathname, search } = useLocation();
  const activeTab = resolveClientCabinetMobileTab(pathname, search);

  const selectTab = useCallback(
    (tab: ClientProfileMainTab) => {
      const next = getClientCabinetMobileTabPath(tab);
      if (pathname === PROFILE_PATH && tab !== 'notifications') {
        navigate(next, { replace: true });
        return;
      }
      navigate(next);
    },
    [navigate, pathname],
  );

  return { activeTab, selectTab };
}
