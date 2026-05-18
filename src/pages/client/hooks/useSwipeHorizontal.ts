import { useCallback, useRef } from 'react';

const SWIPE_THRESHOLD_PX = 48;

/** Свайп влево → next, вправо → prev. */
export function useSwipeHorizontal(onPrev: () => void, onNext: () => void) {
  const startX = useRef<number | null>(null);
  const startY = useRef<number | null>(null);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const t = e.touches[0];
    if (!t) return;
    startX.current = t.clientX;
    startY.current = t.clientY;
  }, []);

  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      const sx = startX.current;
      const sy = startY.current;
      startX.current = null;
      startY.current = null;
      if (sx == null || sy == null) return;

      const t = e.changedTouches[0];
      if (!t) return;

      const dx = t.clientX - sx;
      const dy = t.clientY - sy;
      if (Math.abs(dx) < SWIPE_THRESHOLD_PX) return;
      if (Math.abs(dy) > Math.abs(dx)) return;

      if (dx < 0) onNext();
      else onPrev();
    },
    [onNext, onPrev],
  );

  return { onTouchStart, onTouchEnd };
}
