import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  HiChevronLeft,
  HiChevronRight,
  HiMagnifyingGlassMinus,
  HiMagnifyingGlassPlus,
  HiXMark,
} from 'react-icons/hi2';
import { ImageReveal } from '../../../shared/ui/ImageReveal';
import { useSwipeHorizontal } from '../hooks/useSwipeHorizontal';

type Props = {
  urls: string[];
  index: number;
  onClose: () => void;
  onIndexChange: (index: number) => void;
  /** Подпись в шапке, когда одно изображение (по умолчанию «Фото»). */
  singleLabel?: string;
};

const MIN_SCALE = 1;
const MAX_SCALE = 4;
const SCALE_STEP = 0.35;

export function PortfolioImagePreview({
  urls,
  index,
  onClose,
  onIndexChange,
  singleLabel = 'Фото',
}: Props) {
  const [scale, setScale] = useState(1);
  const viewportRef = useRef<HTMLDivElement>(null);
  const lastTapRef = useRef(0);

  const prev = useCallback(() => {
    onIndexChange(index <= 0 ? urls.length - 1 : index - 1);
  }, [index, onIndexChange, urls.length]);

  const next = useCallback(() => {
    onIndexChange(index >= urls.length - 1 ? 0 : index + 1);
  }, [index, onIndexChange, urls.length]);

  const swipe = useSwipeHorizontal(prev, next);

  const zoomIn = useCallback(() => {
    setScale((value) => Math.min(MAX_SCALE, Number((value + SCALE_STEP).toFixed(2))));
  }, []);

  const zoomOut = useCallback(() => {
    setScale((value) => Math.max(MIN_SCALE, Number((value - SCALE_STEP).toFixed(2))));
  }, []);

  const resetZoom = useCallback(() => setScale(1), []);

  useEffect(() => {
    setScale(1);
  }, [index, urls[index]]);

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (scale <= 1 && e.key === 'ArrowLeft') prev();
      if (scale <= 1 && e.key === 'ArrowRight') next();
      if (e.key === '+' || e.key === '=') zoomIn();
      if (e.key === '-') zoomOut();
      if (e.key === '0') resetZoom();
    };
    window.addEventListener('keydown', onKey);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose, next, prev, resetZoom, scale, zoomIn, zoomOut]);

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      if (e.deltaY < 0) zoomIn();
      else zoomOut();
    },
    [zoomIn, zoomOut],
  );

  const handleDoubleTap = useCallback(() => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      setScale((value) => (value > 1 ? 1 : 2));
    }
    lastTapRef.current = now;
  }, []);

  if (!urls.length || typeof document === 'undefined') return null;

  const url = urls[index] ?? urls[0];
  const multi = urls.length > 1;
  const zoomPercent = Math.round(scale * 100);

  const content = (
    <div
      className="fixed inset-0 z-[300] flex min-h-dvh flex-col bg-black"
      role="dialog"
      aria-modal="true"
      onTouchStart={scale <= 1 ? swipe.onTouchStart : undefined}
      onTouchEnd={scale <= 1 ? swipe.onTouchEnd : undefined}
    >
      <div className="flex shrink-0 items-center justify-between px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top,0px))]">
        <button
          type="button"
          onClick={onClose}
          aria-label="Закрыть"
          className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 active:scale-95"
        >
          <HiXMark className="h-6 w-6" />
        </button>
        {multi ? (
          <span className="text-[14px] font-medium tabular-nums text-white/80">
            {index + 1} / {urls.length}
          </span>
        ) : (
          <span className="text-[14px] font-medium text-white/80">{singleLabel}</span>
        )}
        <span className="w-11" />
      </div>

      <div
        ref={viewportRef}
        className="relative flex min-h-0 flex-1 touch-pan-x touch-pan-y items-center justify-center overflow-auto px-2"
        onWheel={handleWheel}
        onClick={handleDoubleTap}
      >
        {multi && scale <= 1 ? (
          <>
            <button
              type="button"
              onClick={prev}
              aria-label="Предыдущее"
              className="absolute left-2 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-white active:scale-95"
            >
              <HiChevronLeft className="h-6 w-6" />
            </button>
            <button
              type="button"
              onClick={next}
              aria-label="Следующее"
              className="absolute right-2 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-white active:scale-95"
            >
              <HiChevronRight className="h-6 w-6" />
            </button>
          </>
        ) : null}

        <div
          className="relative z-[5] flex max-h-[78dvh] w-full max-w-4xl items-center justify-center px-2 sm:px-8"
          style={{ transform: `scale(${scale})`, transformOrigin: 'center center' }}
        >
          <ImageReveal
            key={url}
            src={url}
            alt=""
            className="mx-auto max-h-[78dvh] w-auto max-w-full object-contain"
            draggable={false}
          />
        </div>
      </div>

      <div className="flex shrink-0 items-center justify-center gap-2 px-4 pb-[max(1rem,env(safe-area-inset-bottom,0px))] pt-2">
        <button
          type="button"
          onClick={zoomOut}
          disabled={scale <= MIN_SCALE}
          aria-label="Уменьшить"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 disabled:opacity-40"
        >
          <HiMagnifyingGlassMinus className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={resetZoom}
          className="min-w-[4.5rem] rounded-full bg-white/10 px-3 py-2 text-[13px] font-semibold tabular-nums text-white/90 transition hover:bg-white/20"
        >
          {zoomPercent}%
        </button>
        <button
          type="button"
          onClick={zoomIn}
          disabled={scale >= MAX_SCALE}
          aria-label="Увеличить"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 disabled:opacity-40"
        >
          <HiMagnifyingGlassPlus className="h-5 w-5" />
        </button>
      </div>

      {multi && scale <= 1 ? (
        <div className="flex justify-center gap-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom,0px))]">
          {urls.map((u, i) => (
            <button
              key={`${u}-${i}`}
              type="button"
              aria-label={`Фото ${i + 1}`}
              onClick={() => onIndexChange(i)}
              className={`h-1.5 rounded-full transition-all ${
                i === index ? 'w-5 bg-[#F47C8C]' : 'w-1.5 bg-white/35'
              }`}
            />
          ))}
        </div>
      ) : null}
    </div>
  );

  return createPortal(content, document.body);
}
