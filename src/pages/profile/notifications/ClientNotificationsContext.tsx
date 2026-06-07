import { createContext, useContext, type ReactNode } from 'react';
import { useAuth } from '../../../features/auth/AuthProvider';
import { useMyNotifications } from '../../../features/notifications/useMyNotifications';

type ClientNotificationsState = ReturnType<typeof useMyNotifications>;

const ClientNotificationsContext = createContext<ClientNotificationsState | null>(null);

/** Одна лента клиентских уведомлений на весь кабинет /profile (как AdminNotificationsProvider). */
export function ClientNotificationsProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, backendConfigured } = useAuth();
  const enabled = isAuthenticated && backendConfigured;
  const state = useMyNotifications(enabled, { pollIntervalMs: 60_000, audience: 'client' });

  return (
    <ClientNotificationsContext.Provider value={state}>{children}</ClientNotificationsContext.Provider>
  );
}

export function useClientNotifications(): ClientNotificationsState {
  const ctx = useContext(ClientNotificationsContext);
  if (!ctx) {
    throw new Error('useClientNotifications must be used within ClientNotificationsProvider');
  }
  return ctx;
}
