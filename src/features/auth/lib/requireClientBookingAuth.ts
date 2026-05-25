import type { NavigateFunction } from 'react-router-dom';
import { getLoginPath } from '../../../app/paths';

export const TELEGRAM_BOOKING_LOGIN_MESSAGE =
  'Откройте приложение через Telegram, чтобы записаться.';

export type BookingAuthGateResult =
  | { ok: true }
  | { ok: false; message?: string; redirected: boolean };

/**
 * Запись через API: в браузере без входа → /login?from=…
 * В Telegram Mini App без сессии → подсказка про Telegram.
 */
export function ensureClientBookingAuth(opts: {
  isAuthenticated: boolean;
  isTelegramWebApp: boolean;
  navigate: NavigateFunction;
  returnPath: string;
}): BookingAuthGateResult {
  if (opts.isAuthenticated) return { ok: true };

  if (opts.isTelegramWebApp) {
    return {
      ok: false,
      redirected: false,
      message: TELEGRAM_BOOKING_LOGIN_MESSAGE,
    };
  }

  opts.navigate(getLoginPath(opts.returnPath));
  return { ok: false, redirected: true };
}
