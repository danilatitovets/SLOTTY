import { useCallback, useEffect } from 'react';
import { HiChevronLeft, HiChevronRight, HiXMark } from 'react-icons/hi2';
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

export function PortfolioImagePreview({
  urls,
  index,
  onClose,
  onIndexChange,
  singleLabel = 'Фото',
}: Props) {
  const prev = useCallback(() => {
    onIndexChange(index <= 0 ? urls.length - 1 : index - 1);
  }, [index, onIndexChange, urls.length]);

  const next = useCallback(() => {
    onIndexChange(index >= urls.length - 1 ? 0 : index + 1);
  }, [index, onIndexChange, urls.length]);

  const swipe = useSwipeHorizontal(prev, next);

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', onKey);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose, next, prev]);

  if (!urls.length) return null;
  const url = urls[index] ?? urls[0];
  const multi = urls.length > 1;

  return (
    <div
      className="fixed inset-0 z-[70] flex flex-col bg-black/95"
      role="dialog"
      aria-modal="true"
      onTouchStart={swipe.onTouchStart}
      onTouchEnd={swipe.onTouchEnd}
    >
      <div className="flex items-center justify-between px-4 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <button
          type="button"
          onClick={onClose}
          aria-label="Закрыть"
          className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white active:scale-95"
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

      <div className="relative flex min-h-0 flex-1 items-center justify-center px-2">
        {multi ? (
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
              onClick={prev}
              aria-hidden
              tabIndex={-1}
              className="absolute inset-y-0 left-0 z-10 w-[28%] max-w-[120px]"
            />
            <button
              type="button"
              onClick={next}
              aria-hidden
              tabIndex={-1}
              className="absolute inset-y-0 right-0 z-10 w-[28%] max-w-[120px]"
            />
          </>
        ) : null}

        <div className="relative z-[5] max-h-[72dvh] w-full max-w-lg px-12">
          <ImageReveal
            key={url}
            src={url}
            alt=""
            className="mx-auto max-h-[72dvh] w-full rounded-xl object-contain"
          />
        </div>

        {multi ? (
          <button
            type="button"
            onClick={next}
            aria-label="Следующее"
            className="absolute right-2 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-white active:scale-95"
          >
            <HiChevronRight className="h-6 w-6" />
          </button>
        ) : null}
      </div>

      {multi ? (
        <div className="flex justify-center gap-1.5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-2">
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
}
