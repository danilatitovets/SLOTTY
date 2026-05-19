import { getTelegramWebAppInitDataRaw } from './telegramWebApp';

/** Ключ launch params в localStorage (@telegram-apps/sdk). */
const LAUNCH_PARAMS_STORAGE_KEY = 'launchParams';

const DEV_MOCK_HASH_MARKER = '__local_dev__';

/** Подписанная initData от реального клиента Telegram (не dev-mock). */
export function hasRealTelegramInitData(): boolean {
  const raw = getTelegramWebAppInitDataRaw();
  if (!raw) return false;
  return !raw.includes(DEV_MOCK_HASH_MARKER);
}

/**
 * Удаляет launch params от локального mockTelegramEnv.
 * Иначе SDK читает их из localStorage и считает, что приложение внутри TMA.
 */
export function clearStaleTelegramLaunchParams(): void {
  if (typeof window === 'undefined') return;
  try {
    const stored = localStorage.getItem(LAUNCH_PARAMS_STORAGE_KEY);
    if (!stored) return;
    if (stored.includes(DEV_MOCK_HASH_MARKER)) {
      localStorage.removeItem(LAUNCH_PARAMS_STORAGE_KEY);
    }
  } catch {
    /* ignore */
  }
}

/** Можно вызывать mountMiniApp / mountViewport и init() SDK. */
export function shouldUseTelegramSdkShell(): boolean {
  if (hasRealTelegramInitData()) return true;
  if (import.meta.env.PROD) return false;
  if (import.meta.env.VITE_DISABLE_TELEGRAM_MOCK === 'true') return false;
  return import.meta.env.DEV;
}
