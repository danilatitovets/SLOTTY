/**
 * Размещение fixed-списка под/над полем ввода, чтобы не уезжал за нижний край
 * (Telegram Mini App, safe-area, нижняя панель).
 */
export type ViewportListPlacement =
  | { mode: 'down'; top: number; left: number; width: number; maxHeight: number }
  | { mode: 'up'; bottom: number; left: number; width: number; maxHeight: number };

/** Доп. отступ снизу из Telegram WebApp (если доступно). */
function readTelegramBottomInsetPx(): number {
  if (typeof window === 'undefined') return 0;
  const tg = (
    window as unknown as {
      Telegram?: {
        WebApp?: {
          safeAreaInset?: { bottom?: number };
          contentSafeAreaInset?: { bottom?: number };
        };
      };
    }
  ).Telegram?.WebApp;
  if (!tg) return 0;
  const a = tg.safeAreaInset?.bottom;
  const b = tg.contentSafeAreaInset?.bottom;
  const n = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? Math.max(0, v) : 0);
  return Math.max(n(a), n(b));
}

function readTelegramViewportStableHeightPx(): number | null {
  if (typeof window === 'undefined') return null;
  const h = (window as unknown as { Telegram?: { WebApp?: { viewportStableHeight?: number } } }).Telegram?.WebApp
    ?.viewportStableHeight;
  if (typeof h !== 'number' || !Number.isFinite(h) || h < 120) return null;
  return h;
}

/**
 * Нижняя граница видимой области в координатах `getBoundingClientRect` (layout viewport),
 * с учётом `visualViewport` — иначе в TWA список уезжает под нативную панель.
 */
function visibleBottomClientPx(): number {
  const innerH = window.innerHeight;
  const vv = window.visualViewport;
  let bottom = vv ? Math.min(innerH, vv.offsetTop + vv.height) : innerH;
  const tgStable = readTelegramViewportStableHeightPx();
  if (tgStable != null) {
    bottom = Math.min(bottom, tgStable);
  }
  return bottom;
}

function visibleTopClientPx(): number {
  const vv = window.visualViewport;
  if (!vv) return 0;
  return Math.max(0, vv.offsetTop);
}

export function computeViewportListPlacement(input: Element): ViewportListPlacement | null {
  if (!(input instanceof HTMLElement)) return null;
  const r = input.getBoundingClientRect();
  const visibleBottom = visibleBottomClientPx();
  const visibleTop = visibleTopClientPx();
  const visibleH = Math.max(120, visibleBottom - visibleTop);
  const gap = 6;
  /** Резерв: полоска @bot + жесты + safe area из TG + запас */
  const reserveBottom = Math.max(128, 96 + readTelegramBottomInsetPx());
  const minOpen = 88;
  const hardCap = Math.min(280, Math.floor(visibleH * 0.5));

  const spaceBelow = visibleBottom - r.bottom - gap - reserveBottom;
  const spaceAbove = r.top - gap - visibleTop - 12;

  if (spaceBelow >= minOpen || spaceBelow >= spaceAbove) {
    const maxHeight = Math.max(72, Math.min(hardCap, Math.max(0, spaceBelow)));
    return { mode: 'down', top: r.bottom + gap, left: r.left, width: r.width, maxHeight };
  }

  const maxHeight = Math.max(72, Math.min(hardCap, Math.max(0, spaceAbove)));
  const bottom = visibleBottom - r.top + gap;
  return { mode: 'up', bottom, left: r.left, width: r.width, maxHeight };
}
