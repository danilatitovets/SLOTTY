import { hasRealTelegramInitData } from './telegramEnv';

const STORAGE_KEY = 'slotty:build-id';
const BUILD_META_RE = /name="slotty-build"\s+content="([^"]+)"/;

function applyTelegramBuildId(buildId: string): boolean {
  try {
    const prev = sessionStorage.getItem(STORAGE_KEY);
    if (prev && prev !== buildId) {
      sessionStorage.setItem(STORAGE_KEY, buildId);
      window.location.reload();
      return true;
    }
    sessionStorage.setItem(STORAGE_KEY, buildId);
  } catch {
    /* ignore */
  }
  return false;
}

/**
 * Telegram WebView агрессивно кэширует index.html.
 * После деплоя перезагружаем Mini App, если build id сменился.
 * Дублирует inline-скрипт из index.html на случай устаревшего HTML-кэша.
 */
export function ensureFreshTelegramWebAppBuild(buildId: string): void {
  if (typeof window === 'undefined' || !buildId.trim()) return;
  if (!hasRealTelegramInitData()) return;

  if (applyTelegramBuildId(buildId)) return;

  void fetch(`/?slotty-build-check=${Date.now()}`, { cache: 'no-store', credentials: 'same-origin' })
    .then((r) => r.text())
    .then((html) => {
      const remote = html.match(BUILD_META_RE)?.[1]?.trim();
      if (remote) applyTelegramBuildId(remote);
    })
    .catch(() => {
      /* ignore */
    });
}
