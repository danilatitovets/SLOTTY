import type { ReactNode } from 'react';
import { useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { HiXMark } from 'react-icons/hi2';
import {
  catalogFilterSheetCardClass,
  catalogFilterSheetCloseBtnClass,
  catalogFilterSheetHeaderBarClass,
  catalogFilterSheetHeaderRowClass,
  catalogFilterSheetPrimaryBtn,
  catalogFilterSheetSecondaryBtn,
  catalogFilterSheetTitleClass,
} from './catalogFilterSheetTheme';
import { catalogDesktopPanel, catalogMobilePadX } from './servicesCatalogTheme';

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
  useLayoutEffect(() => {
    if (!open) return undefined;

    const prevHtmlOverflow = document.documentElement.style.overflow;
    const prevBodyOverflow = document.body.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    document.documentElement.style.overflowX = 'hidden';
    document.body.style.overflow = 'hidden';
    document.body.style.overflowX = 'hidden';

    return () => {
      document.documentElement.style.overflow = prevHtmlOverflow;
      document.documentElement.style.overflowX = '';
      document.body.style.overflow = prevBodyOverflow;
      document.body.style.overflowX = '';
    };
  }, [open]);

  if (!open || typeof document === 'undefined') return null;

  const applyLabel = `Показать ${formatResultCount(resultCount)} ${resultNoun}`;

  return createPortal(
    <div className="fixed inset-0 z-[200] overflow-hidden overscroll-none">
      <button
        type="button"
        className="absolute inset-0 bg-black/35 backdrop-blur-[2px]"
        aria-label="Закрыть"
        onClick={onClose}
      />

      {/* Мобилка — полноэкранный sheet */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="catalog-filter-sheet-title-mobile"
        className="fixed inset-0 flex w-full min-w-0 max-w-full flex-col overflow-x-hidden bg-[#F5F5F5] lg:hidden"
        style={{ height: '100dvh', maxHeight: '100dvh' }}
      >
        <header className={catalogFilterSheetHeaderBarClass}>
          <div className={`${catalogFilterSheetHeaderRowClass} ${catalogMobilePadX}`}>
            <h2 id="catalog-filter-sheet-title-mobile" className={catalogFilterSheetTitleClass}>
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Закрыть"
              className={catalogFilterSheetCloseBtnClass}
            >
              <HiXMark className="h-6 w-6" aria-hidden />
            </button>
          </div>
        </header>

        <div
          className={`min-h-0 flex-1 overflow-y-auto overscroll-y-contain py-3 scrollbar-hidden ${catalogMobilePadX}`}
        >
          <div className={catalogFilterSheetCardClass}>{children}</div>
        </div>

        <FilterSheetFooter
          applyLabel={applyLabel}
          onApply={onApply}
          onReset={onReset}
          className={catalogMobilePadX}
        />
      </div>

      {/* Десктоп — drawer справа (как WB) */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="catalog-filter-sheet-title-desktop"
        className={`${catalogDesktopPanel} fixed inset-y-0 right-0 z-10 hidden w-full max-w-[400px] flex-col overflow-hidden shadow-[-16px_0_48px_rgba(17,24,39,0.14)] lg:flex`}
      >
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-[#EEEEEE] px-5 py-4">
          <h2
            id="catalog-filter-sheet-title-desktop"
            className="text-[18px] font-bold tracking-[-0.03em] text-[#111827]"
          >
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Закрыть"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F0F0F0] text-[#6B7280] transition hover:bg-[#EBEBEB] hover:text-[#111827]"
          >
            <HiXMark className="h-5 w-5" aria-hidden />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-5 py-4 scrollbar-hidden">
          {children}
        </div>

        <FilterSheetFooter
          applyLabel={applyLabel}
          onApply={onApply}
          onReset={onReset}
          className="border-t border-[#EEEEEE] bg-white px-5 py-4"
          compact
        />
      </aside>
    </div>,
    document.body,
  );
}

function FilterSheetFooter({
  applyLabel,
  onApply,
  onReset,
  className,
  compact = false,
}: {
  applyLabel: string;
  onApply: () => void;
  onReset: () => void;
  className: string;
  compact?: boolean;
}) {
  return (
    <div
      className={className}
      style={compact ? undefined : { paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
    >
      <button type="button" className={catalogFilterSheetPrimaryBtn} onClick={onApply}>
        {applyLabel}
      </button>
      <button
        type="button"
        className={`${catalogFilterSheetSecondaryBtn} ${compact ? 'mt-2' : 'mt-2'}`}
        onClick={onReset}
      >
        Сбросить
      </button>
    </div>
  );
}
