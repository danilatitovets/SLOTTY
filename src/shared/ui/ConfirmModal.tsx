import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

const primaryBtn =
  'inline-flex h-11 items-center justify-center rounded-2xl bg-[#ff5f7a] px-5 text-[14px] font-semibold text-white transition hover:bg-[#f04a66] disabled:opacity-50';
const ghostBtn =
  'inline-flex h-11 items-center justify-center rounded-2xl border border-[#e5e7eb] bg-white px-5 text-[14px] font-semibold text-[#374151] transition hover:bg-[#f9fafb] disabled:opacity-50';

export function ConfirmModal({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = 'Отмена',
  danger,
  busy,
  confirmDisabled,
  banner,
  /** Сдвиг оверлея (напр. `lg:left-[260px]` в кабинете мастера). */
  overlayInsetClassName = '',
  onConfirm,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel: string;
  cancelLabel?: string;
  danger?: boolean;
  busy?: boolean;
  confirmDisabled?: boolean;
  /** Полоса вверху карточки (иконка, градиент). */
  banner?: ReactNode;
  overlayInsetClassName?: string;
  onConfirm: () => void;
  onClose: () => void;
  children?: ReactNode;
}) {
  useEffect(() => {
    if (!open) return undefined;
    const prevHtmlOverflow = document.documentElement.style.overflow;
    const prevBodyOverflow = document.body.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    return () => {
      document.documentElement.style.overflow = prevHtmlOverflow;
      document.body.style.overflow = prevBodyOverflow;
    };
  }, [open]);

  if (!open || typeof document === 'undefined') return null;

  const disableConfirm = busy || confirmDisabled;

  return createPortal(
    <div
      className={`fixed inset-0 z-[200] flex items-end justify-center lg:items-center ${overlayInsetClassName}`.trim()}
      role="presentation"
    >
      <button
        type="button"
        className="absolute inset-0 min-h-dvh w-full bg-black/40 backdrop-blur-[2px]"
        aria-label="Закрыть"
        onClick={onClose}
        disabled={busy}
      />
      <div
        className="relative z-10 flex w-full max-h-[min(92dvh,100dvh)] max-w-none flex-col overflow-hidden rounded-t-[20px] bg-white shadow-[0_-12px_40px_rgba(17,24,39,0.12)] pb-[max(1rem,env(safe-area-inset-bottom,0px))] lg:mx-4 lg:mb-4 lg:max-h-none lg:max-w-md lg:rounded-[20px] lg:border lg:border-[#eef0f5] lg:pb-0 lg:shadow-[0_8px_30px_rgba(17,24,39,0.06)]"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-1 mt-3 h-1 w-10 shrink-0 rounded-full bg-[#EAECEF] lg:hidden" aria-hidden />

        {banner ? <div className="shrink-0">{banner}</div> : null}
        <div className="overflow-y-auto overscroll-contain px-5 pb-2 pt-1 sm:px-6 lg:p-6 lg:pt-6">
          <h3 className="text-[18px] font-bold text-[#111827]">{title}</h3>
          {description ? (
            <p className="mt-2 text-[15px] leading-relaxed text-[#6B7280]">{description}</p>
          ) : null}
          {children ? <div className="mt-4">{children}</div> : null}
          <div className="mt-6 flex flex-col gap-2 lg:flex-row-reverse">
            <button
              type="button"
              disabled={disableConfirm}
              className={
                danger
                  ? 'inline-flex h-11 w-full items-center justify-center rounded-2xl bg-[#ef4444] px-5 text-[14px] font-semibold text-white disabled:opacity-50 lg:w-auto'
                  : `${primaryBtn} w-full lg:w-auto`
              }
              onClick={onConfirm}
            >
              {confirmLabel}
            </button>
            <button
              type="button"
              className={`${ghostBtn} w-full lg:w-auto`}
              onClick={onClose}
              disabled={busy}
            >
              {cancelLabel}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
