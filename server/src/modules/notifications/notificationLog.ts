/** Структурированные логи цепочки уведомлений (без секретов). */

export type NotificationLogPayload = Record<string, string | number | boolean | null | undefined>;

function safe(payload: NotificationLogPayload): NotificationLogPayload {
  const out: NotificationLogPayload = {};
  for (const [k, v] of Object.entries(payload)) {
    if (v === undefined) continue;
    out[k] = v;
  }
  return out;
}

export function logNotification(event: string, payload: NotificationLogPayload): void {
  console.info(`[${event}]`, JSON.stringify(safe(payload)));
}

export function logNotificationWarn(event: string, payload: NotificationLogPayload): void {
  console.warn(`[${event}]`, JSON.stringify(safe(payload)));
}

export function logNotificationError(event: string, payload: NotificationLogPayload): void {
  console.error(`[${event}]`, JSON.stringify(safe(payload)));
}
