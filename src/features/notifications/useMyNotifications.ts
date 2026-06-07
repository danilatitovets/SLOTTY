import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {

  fetchMyNotifications,

  markNotificationReadApi,

  type MeNotificationRow,

  type NotificationAudience,

} from '../profile/api/clientNotifications';

import { subscribeBookingDataRefresh } from '../appointments/bookingDataSync';



type Options = {

  /** Периодическое обновление списка (бейдж в шапке кабинета). */

  pollIntervalMs?: number;

  /** Лента мастера или клиента (один аккаунт может быть и тем и другим). */

  audience?: NotificationAudience;

};



function formatNotificationsLoadError(error: unknown): string {

  if (error instanceof TypeError) {

    return 'Сервер недоступен. Запустите API (npm run dev) и обновите страницу.';

  }

  if (error instanceof Error) {

    if (error.message === 'NO_API_URL') {

      return 'Не задан VITE_API_URL в .env — уведомления с сервера недоступны.';

    }

    return error.message;

  }

  return 'Не удалось загрузить уведомления.';

}



export function useMyNotifications(enabled = true, options?: Options) {

  const pollIntervalMs = options?.pollIntervalMs ?? 0;

  const audience = options?.audience;

  const [notifications, setNotifications] = useState<MeNotificationRow[]>([]);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const loadGenerationRef = useRef(0);

  const abortRef = useRef<AbortController | null>(null);



  const reload = useCallback(async (opts?: { quiet?: boolean }) => {

    const generation = ++loadGenerationRef.current;

    abortRef.current?.abort();

    const controller = new AbortController();

    abortRef.current = controller;



    if (!opts?.quiet) setLoading(true);

    setError(null);

    try {

      const rows = await fetchMyNotifications(audience, { signal: controller.signal });

      if (generation !== loadGenerationRef.current) return;

      setNotifications(rows);

    } catch (e) {

      if (generation !== loadGenerationRef.current) return;

      if (e instanceof DOMException && e.name === 'AbortError') return;

      if (!opts?.quiet) {

        setNotifications([]);

        setError(formatNotificationsLoadError(e));

      }

    } finally {

      if (generation === loadGenerationRef.current && !opts?.quiet) {

        setLoading(false);

      }

    }

  }, [audience]);



  useEffect(() => {

    if (!enabled) {

      abortRef.current?.abort();

      setLoading(false);

      return;

    }

    void reload();

    return () => {

      abortRef.current?.abort();

    };

  }, [enabled, reload]);



  useEffect(() => {

    if (!enabled || pollIntervalMs < 5_000) return;

    const id = window.setInterval(() => void reload({ quiet: true }), pollIntervalMs);

    return () => window.clearInterval(id);

  }, [enabled, pollIntervalMs, reload]);



  useEffect(() => {

    if (!enabled) return;

    const onFocus = () => void reload({ quiet: true });

    window.addEventListener('focus', onFocus);

    return () => window.removeEventListener('focus', onFocus);

  }, [enabled, reload]);



  useEffect(() => {

    if (!enabled) return;

    return subscribeBookingDataRefresh(() => {

      void reload({ quiet: true });

    });

  }, [enabled, reload]);



  const markAsRead = useCallback(

    async (notificationId: string) => {

      setNotifications((prev) => {

        const target = prev.find((n) => n.id === notificationId);

        if (!target || target.read_at) return prev;

        return prev.map((n) =>

          n.id === notificationId ? { ...n, read_at: new Date().toISOString() } : n,

        );

      });

      try {

        await markNotificationReadApi(notificationId);

      } catch {

        void reload({ quiet: true });

      }

    },

    [reload],

  );



  const markAllAsRead = useCallback(async () => {

    const unreadIds = notifications.filter((n) => !n.read_at).map((n) => n.id);

    if (!unreadIds.length) return;

    const readAt = new Date().toISOString();

    setNotifications((prev) =>

      prev.map((n) => (n.read_at ? n : { ...n, read_at: readAt })),

    );

    try {

      await Promise.all(unreadIds.map((id) => markNotificationReadApi(id)));

    } catch {

      void reload({ quiet: true });

    }

  }, [notifications, reload]);



  const unreadCount = useMemo(

    () => notifications.filter((n) => !n.read_at).length,

    [notifications],

  );



  const initialLoading = loading && notifications.length === 0 && !error;



  return {

    notifications,

    loading,

    initialLoading,

    error,

    reload,

    markAsRead,

    markAllAsRead,

    unreadCount,

    hasUnread: unreadCount > 0,

  };

}


