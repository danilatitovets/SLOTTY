import type { ReactNode } from 'react';
import { useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { HiXMark } from 'react-icons/hi2';
import {
  catalogFilterSheetCanvas,
  catalogFilterSheetPrimaryBtn,
  catalogFilterSheetSecondaryBtn,
} from './catalogFilterSheetTheme';

type Props = {
  open: boolean;
  title?: string;
  resultCount: number;
  resultNoun?: string;
  onClose: () => void;
  onReset: () => void;
  onApply: () => void;
  children: ReactNode;
};

const BACKDROP_CLOSE_DELAY_MS = 320;

function formatResultCount(n: number): string {
  return new Intl.NumberFormat('ru-RU').format(n);
}

export function CatalogFilterSheet({
  open,
  title = 'Фильтры',
  resultCount,
  resultNoun = 'вариантов',
  onClose,
  onReset,
  onApply,
  children,
}: Props) {
  const suppressBackdropCloseRef = useRef(false);
  const [entered, setEntered] = useState(false);

  useLayoutEffect(() => {
    if (!open) {
      setEntered(false);
      return undefined;
    }

    suppressBackdropCloseRef.current = true;
    const suppressId = window.setTimeout(() => {
      suppressBackdropCloseRef.current = false;
    }, BACKDROP_CLOSE_DELAY_MS);

    const enterId = window.requestAnimationFrame(() => setEntered(true));

    const prevOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';

    return () => {
      window.clearTimeout(suppressId);
      window.cancelAnimationFrame(enterId);
      document.documentElement.style.overflow = prevOverflow;
    };
  }, [open]);

  const handleBackdropClose = () => {
    if (suppressBackdropCloseRef.current) return;
    onClose();
  };

  if (!open || typeof document === 'undefined') return null;

  const applyLabel = `Показать ${formatResultCount(resultCount)} ${resultNoun}`;

  return createPortal(
    <div className="fixed inset-0 z-[200] lg:hidden">
      <button
        type="button"
        className={`absolute inset-0 min-h-dvh w-full bg-black/35 backdrop-blur-[2px] transition-opacity duration-300 ${
          entered ? 'opacity-100' : 'opacity-0'
        }`}
        aria-label="Закрыть"
        onClick={handleBackdropClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="catalog-filter-sheet-title"
        className={`fixed inset-x-0 bottom-0 z-10 flex max-h-[min(92dvh,100dvh)] w-full min-h-0 flex-col overflow-hidden rounded-t-[20px] bg-white shadow-[0_-12px_40px_rgba(17,24,39,0.12)] transition-transform duration-300 ease-out ${
          entered ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="mx-auto mb-2 mt-2.5 h-1 w-10 shrink-0 rounded-full bg-[#D1D5DB]" aria-hidden />

        <header className="relative shrink-0 px-5 pb-3 pt-1">
          <h2
            id="catalog-filter-sheet-title"
            className="text-center text-[18px] font-bold tracking-[-0.02em] text-[#111827]"
          >
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Закрыть"
            className="absolute right-4 top-0 flex h-10 w-10 items-center justify-center rounded-full text-[#9CA3AF] transition hover:bg-[#F5F5F5] hover:text-[#111827] active:scale-95"
          >
            <HiXMark className="h-6 w-6" aria-hidden />
          </button>
        </header>

        <div
          className={`min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-5 py-2 ${catalogFilterSheetCanvas}`}
        >
          {children}
        </div>

        <div className="shrink-0 border-t border-[#F3F4F6] bg-white px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <div className="flex flex-col gap-2">
            <button type="button" className={catalogFilterSheetPrimaryBtn} onClick={onApply}>
              {applyLabel}
            </button>
            <button type="button" className={catalogFilterSheetSecondaryBtn} onClick={onReset}>
              Сбросить
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
