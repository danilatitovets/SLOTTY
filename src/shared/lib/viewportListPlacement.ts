/**
 * Размещение fixed-списка под/над полем ввода, чтобы не уезжал за нижний край
 * (Telegram Mini App, safe-area, нижняя панель).
 */
export type ViewportListPlacement =
  | { mode: 'down'; top: number; left: number; width: number; maxHeight: number }
  | { mode: 'up'; bottom: number; left: number; width: number; maxHeight: number };

export function computeViewportListPlacement(input: Element): ViewportListPlacement | null {
  if (!(input instanceof HTMLElement)) return null;
  const r = input.getBoundingClientRect();
  const vv = window.visualViewport;
  const viewH = vv?.height ?? window.innerHeight;
  const gap = 6;
  /** Резерв под нижнюю панель TG / safe area */
  const reserveBottom = 96;
  const minOpen = 88;
  const hardCap = Math.min(280, Math.floor(viewH * 0.5));

  const spaceBelow = viewH - r.bottom - gap - reserveBottom;
  const spaceAbove = r.top - gap - 12;

  if (spaceBelow >= minOpen || spaceBelow >= spaceAbove) {
    const maxHeight = Math.max(72, Math.min(hardCap, spaceBelow));
    return { mode: 'down', top: r.bottom + gap, left: r.left, width: r.width, maxHeight };
  }

  const maxHeight = Math.max(72, Math.min(hardCap, spaceAbove));
  const bottom = viewH - r.top + gap;
  return { mode: 'up', bottom, left: r.left, width: r.width, maxHeight };
}
