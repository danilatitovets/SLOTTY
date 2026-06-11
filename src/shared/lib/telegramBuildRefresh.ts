import { hasRealTelegramInitData } from './telegramEnv';

const STORAGE_KEY = 'slotty:build-id';

/**
 * Telegram WebView агрессивно кэширует index.html.
 * После деплоя один раз перезагружаем Mini App, если build id сменился.
 */
export function ensureFreshTelegramWebAppBuild(buildId: string): void {
  if (typeof window === 'undefined' || !buildId.trim()) return;
  if (!hasRealTelegramInitData()) return;

  let prev: string | null = null;
  try {
    prev = sessionStorage.getItem(STORAGE_KEY);
  } catch {
    return;
  }

  if (prev && prev !== buildId) {
    try {
      sessionStorage.setItem(STORAGE_KEY, buildId);
    } catch {
      /* ignore */
    }
    window.location.reload();
    return;
  }

  try {
    sessionStorage.setItem(STORAGE_KEY, buildId);
  } catch {
    /* ignore */
  }
}
