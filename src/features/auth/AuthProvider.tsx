import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { clearAdminCabinetSessionCache } from '../../pages/admin/adminCabinetSessionCache';
import { clearOverviewBundleCache } from '../../pages/admin/overview/adminOverviewSessionCache';
import { syncMasterFlagFromProfile } from '../profile/lib/demoMasterStorage';
import {
  preloadFavoriteMasterIds,
  syncLocalFavoritesToServer,
} from '../profile/lib/favoriteMastersResolve';
import { apiFetch, getApiBaseUrl, getStoredAuthToken, setStoredAuthToken } from '../../shared/api/backendClient';
import { useTelegram } from '../../shared/hooks/useTelegram';
import { readTelegramUserIdFromInitDataRaw } from '../../shared/lib/telegramWebApp';
import type { AuthSessionResponse, BackendProfile } from './types';
import { normalizeBackendProfile, sessionRefreshToken } from './types';

type AuthContextValue = {
  profile: BackendProfile | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  backendConfigured: boolean;
  refreshProfile: () => Promise<void>;
  applySession: (session: AuthSessionResponse) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { isReady, initDataRaw, isTelegramWebApp } = useTelegram();
  const [profile, setProfile] = useState<BackendProfile | null>(null);
  const [token, setToken] = useState<string | null>(() => getStoredAuthToken());
  const [sessionLoading, setSessionLoading] = useState(false);

  const isLoading = !isReady || sessionLoading;
  const backendConfigured = Boolean(getApiBaseUrl());

  const logout = useCallback(() => {
    clearAdminCabinetSessionCache();
    clearOverviewBundleCache();
    setStoredAuthToken(null);
    setToken(null);
    setProfile(null);
  }, []);

  const applySession = useCallback((session: AuthSessionResponse) => {
    clearAdminCabinetSessionCache();
    clearOverviewBundleCache();
    setStoredAuthToken(session.token);
    setToken(session.token);
    setProfile(session.profile);
    void syncLocalFavoritesToServer().then(() => preloadFavoriteMasterIds());
  }, []);

  const applyMePayload = useCallback((payload: BackendProfile) => {
    const refresh = sessionRefreshToken(payload);
    const profile = normalizeBackendProfile(payload);
    if (refresh) {
      clearAdminCabinetSessionCache();
      clearOverviewBundleCache();
      setStoredAuthToken(refresh);
      setToken(refresh);
    }
    setProfile(profile);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!getApiBaseUrl()) return;
    const t = getStoredAuthToken();
    if (!t) {
      setProfile(null);
      setToken(null);
      return;
    }
    try {
      const res = await apiFetch('/api/me');
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          logout();
        }
        return;
      }
      const next = (await res.json()) as BackendProfile;
      applyMePayload(next);
    } catch {
      /* keep previous profile if any */
    }
  }, [logout, applyMePayload]);

  useEffect(() => {
    if (!isReady) {
      return undefined;
    }

    let cancelled = false;

    async function bootstrap() {
      setSessionLoading(true);
      try {
        const base = getApiBaseUrl();
        if (!base) {
          if (!cancelled) {
            setProfile(null);
            setToken(getStoredAuthToken());
          }
          return;
        }

        const existing = getStoredAuthToken();
        const initDataTelegramUserId =
          initDataRaw && isTelegramWebApp ? readTelegramUserIdFromInitDataRaw(initDataRaw) : null;

        if (existing) {
          const res = await apiFetch('/api/me');
          if (res.ok) {
            const me = (await res.json()) as BackendProfile;
            const profileTgId = me.telegram_user_id;
            const jwtMatchesTelegram =
              initDataTelegramUserId == null ||
              (profileTgId != null && profileTgId === initDataTelegramUserId);

            if (jwtMatchesTelegram) {
              if (!cancelled) {
                applyMePayload(me);
              }
              await syncLocalFavoritesToServer();
              preloadFavoriteMasterIds();
              return;
            }
            setStoredAuthToken(null);
          } else {
            setStoredAuthToken(null);
          }
        }

        // Автовход в Telegram Web App: без JWT или JWT от другого аккаунта (например Google в браузере).
        if (initDataRaw && isTelegramWebApp) {
          const res = await apiFetch('/api/auth/telegram', {
            method: 'POST',
            skipAuth: true,
            body: JSON.stringify({ initDataRaw }),
          });
          if (!res.ok) {
            if (!cancelled) {
              setStoredAuthToken(null);
              setToken(null);
              setProfile(null);
            }
            return;
          }
          const data = (await res.json()) as AuthSessionResponse;
          setStoredAuthToken(data.token);
          if (!cancelled) {
            setToken(data.token);
            setProfile(data.profile);
          }
          await syncLocalFavoritesToServer();
          preloadFavoriteMasterIds();
          return;
        }

        if (!cancelled) {
          setProfile(null);
          setToken(getStoredAuthToken());
        }
      } catch {
        if (!cancelled) {
          setProfile(null);
        }
      } finally {
        if (!cancelled) {
          setSessionLoading(false);
        }
      }
    }

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, [isReady, initDataRaw, isTelegramWebApp, applyMePayload]);

  useEffect(() => {
    syncMasterFlagFromProfile(profile ?? undefined);
  }, [profile]);

  const value = useMemo<AuthContextValue>(
    () => ({
      profile,
      token,
      isLoading,
      isAuthenticated: Boolean(profile),
      backendConfigured,
      refreshProfile,
      applySession,
      logout,
    }),
    [profile, token, isLoading, backendConfigured, refreshProfile, applySession, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
