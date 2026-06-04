import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { HiArrowDownTray, HiXMark } from 'react-icons/hi2';
import type { BillingSubscriptionResponse } from '../../../../../features/billing/api/masterBillingApi';
import {
  formatBillingMoney,
  formatRenewalSchedule,
} from '../../../billing/billingFormat';
import { billingOutlineBtn, billingPinkBtn } from '../../../billing/adminBillingTheme';
import {
  SettingsCabinetStatusPill,
  settingsCabinetOutlineBtn,
} from '../settingsCabinetUi';
import {
  buildSubscriptionReceiptRows,
  downloadSubscriptionReceiptPdf,
  SUBSCRIPTION_RECEIPT_BG_SRC,
} from './subscriptionReceiptModel';

type Props = {
  open: boolean;
  onClose: () => void;
  billing: BillingSubscriptionResponse;
  uiState: string;
  isProEntitled: boolean;
  planName: string;
  statusLabel: string;
  statusTone: 'success' | 'warning' | 'pink' | 'neutral';
};

function lockBackgroundScroll() {
  const roots: HTMLElement[] = [
    document.documentElement,
    document.body,
    ...Array.from(document.querySelectorAll<HTMLElement>('main.overflow-y-auto')),
  ];

  const prev = roots.map((el) => ({
    el,
    overflow: el.style.overflow,
    overscrollBehavior: el.style.overscrollBehavior,
  }));

  for (const el of roots) {
    el.style.overflow = 'hidden';
    el.style.overscrollBehavior = 'none';
  }

  return () => {
    for (const { el, overflow, overscrollBehavior } of prev) {
      el.style.overflow = overflow;
      el.style.overscrollBehavior = overscrollBehavior;
    }
  };
}

export function SubscriptionReceiptModal({
  open,
  onClose,
  billing,
  uiState,
  isProEntitled,
  planName,
  statusLabel,
  statusTone,
}: Props) {
  const panelRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const unlockScroll = lockBackgroundScroll();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    const blockBackgroundScroll = (event: WheelEvent | TouchEvent) => {
      const scrollEl = scrollRef.current;
      if (scrollEl && event.target instanceof Node && scrollEl.contains(event.target)) {
        return;
      }
      event.preventDefault();
    };

    document.addEventListener('keydown', onKey);
    document.addEventListener('wheel', blockBackgroundScroll, { passive: false });
    document.addEventListener('touchmove', blockBackgroundScroll, { passive: false });

    return () => {
      unlockScroll();
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('wheel', blockBackgroundScroll);
      document.removeEventListener('touchmove', blockBackgroundScroll);
    };
  }, [open, onClose]);

  if (!open) return null;

  const rows = buildSubscriptionReceiptRows(uiState, billing, isProEntitled);
  const periodUnit = billing.billingPeriod === 'year' ? 'год' : 'месяц';
  const renewalLine = formatRenewalSchedule(billing, uiState);
  const showPrice = isProEntitled && billing.priceAmount > 0;
  const tableRows = rows.filter((r) => r.label !== 'Стоимость' && r.label !== 'Тариф');
  const issuedAt = new Date().toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return createPortal(
    <div
      className="fixed inset-0 z-[220] flex items-center justify-center overflow-hidden p-4 sm:p-6"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="absolute inset-0 overflow-hidden bg-black/65 backdrop-blur-[2px] overscroll-none" aria-hidden />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="subscription-receipt-title"
        className="relative z-10 flex max-h-[min(85vh,36rem)] w-full max-w-[30rem] flex-col overflow-hidden rounded-[20px] bg-white shadow-[0_24px_80px_rgba(0,0,0,0.35)] ring-1 ring-white/10 sm:max-w-[32rem]"
      >
        <header className="shrink-0 border-b border-[#F3F4F6] px-5 py-4 sm:px-6">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#9CA3AF]">
                Подписка Master
              </p>
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <h2
                  id="subscription-receipt-title"
                  className="text-[20px] font-extrabold tracking-[-0.03em] text-[#111827]"
                >
                  Справка о подписке
                </h2>
                <SettingsCabinetStatusPill tone={statusTone}>{statusLabel}</SettingsCabinetStatusPill>
              </div>
              <p className="mt-2 text-[13px] leading-relaxed text-[#6B7280]">
                {renewalLine ? `${renewalLine} · ` : ''}
                {issuedAt}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F5F5F5] text-[#6B7280] transition hover:bg-[#EBEBEB] hover:text-[#111827]"
              aria-label="Закрыть"
            >
              <HiXMark className="h-5 w-5" />
            </button>
          </div>
        </header>

        <div
          ref={scrollRef}
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:px-6"
        >
          <div className="overflow-hidden rounded-[16px] border border-[#F3F4F6]">
            <img
              src={SUBSCRIPTION_RECEIPT_BG_SRC}
              alt=""
              className="block aspect-[2.4/1] w-full object-cover object-center"
            />
            <div className="p-4">
              <p className="text-[18px] font-extrabold tracking-[-0.03em] text-[#111827]">
                {planName}
              </p>
              {showPrice ? (
                <p className="mt-1 text-[26px] font-black tracking-[-0.04em] text-[#111827]">
                  {formatBillingMoney(billing.priceAmount, billing.currency)}
                  <span className="ml-1 text-[15px] font-semibold text-[#6B7280]">/ {periodUnit}</span>
                </p>
              ) : null}
              <p className="mt-2 text-[11px] text-[#9CA3AF]">
                SLOTTY · кабинет мастера и онлайн-запись
              </p>
            </div>
          </div>

          {tableRows.length > 0 ? (
            <div className="mt-4 overflow-hidden rounded-[16px] border border-[#F3F4F6]">
              <p className="border-b border-[#F3F4F6] bg-[#FAFAFA] px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.05em] text-[#6B7280]">
                Детали подписки
              </p>
              <dl>
                {tableRows.map(({ label, value }) => (
                  <div
                    key={label}
                    className="flex items-start justify-between gap-4 border-b border-[#F3F4F6] px-4 py-3 text-[13px] last:border-b-0"
                  >
                    <dt className="shrink-0 text-[#6B7280]">{label}</dt>
                    <dd className="text-right font-semibold text-[#111827]">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ) : null}

          <p className="mt-5 flex items-center justify-between gap-3 text-[11px] text-[#9CA3AF]">
            <span className="font-extrabold tracking-[0.12em] text-[#ff5f7a]">SLOTTY</span>
            <span>slotty.by</span>
          </p>
        </div>

        <div className="flex shrink-0 flex-col gap-2 border-t border-[#F3F4F6] bg-[#FAFAFA] px-5 py-4 sm:flex-row sm:px-6">
          <button
            type="button"
            onClick={() => downloadSubscriptionReceiptPdf(planName, statusLabel, rows)}
            className={`inline-flex flex-1 items-center justify-center gap-2 ${billingOutlineBtn}`}
          >
            <HiArrowDownTray className="h-4 w-4 shrink-0" aria-hidden />
            Скачать PDF
          </button>
          <button type="button" onClick={onClose} className={`flex-1 ${billingPinkBtn}`}>
            Закрыть
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export function SubscriptionDetailsButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={`${settingsCabinetOutlineBtn} w-full`}>
      Подробнее
    </button>
  );
}
