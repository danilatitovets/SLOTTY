import { apiFetch } from '../../../shared/api/backendClient';
import { readSlottyApiErrorMessage } from '../../../shared/api/slottyApiErrorMessage';

export type MeNotificationRow = {
  id: string;
  type: string;
  title: string;
  body: string;
  related_entity_type: string | null;
  related_entity_id: string | null;
  booking_code?: string | null;
  metadata?: Record<string, unknown> | null;
  read_at: string | null;
  created_at: string;
};

export type NotificationAudience = 'master' | 'client';

const NOTIFICATIONS_FETCH_TIMEOUT_MS = 20_000;

export async function fetchMyNotifications(
  audience?: NotificationAudience,
  init?: { signal?: AbortSignal },
): Promise<MeNotificationRow[]> {
  const qs = audience ? `?audience=${encodeURIComponent(audience)}` : '';
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), NOTIFICATIONS_FETCH_TIMEOUT_MS);

  const onExternalAbort = () => controller.abort();
  init?.signal?.addEventListener('abort', onExternalAbort);

  try {
    const res = await apiFetch(`/api/me/notifications${qs}`, { signal: controller.signal });
    if (!res.ok) {
      throw new Error(await readSlottyApiErrorMessage(res));
    }
    const data = (await res.json()) as { notifications?: MeNotificationRow[] };
    return data.notifications ?? [];
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      if (init?.signal?.aborted) throw error;
      throw new Error('Сервер не ответил вовремя. Проверьте API и попробуйте снова.');
    }
    throw error;
  } finally {
    window.clearTimeout(timeoutId);
    init?.signal?.removeEventListener('abort', onExternalAbort);
  }
}

export async function markNotificationReadApi(notificationId: string): Promise<void> {
  const res = await apiFetch(`/api/me/notifications/${encodeURIComponent(notificationId)}/read`, {
    method: 'PATCH',
  });
  if (!res.ok) {
    throw new Error(await readSlottyApiErrorMessage(res));
  }
}
