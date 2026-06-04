import { HiArrowDownTray, HiCheckCircle } from 'react-icons/hi2';
import type { BillingPaymentDto } from '../../../features/billing/api/masterBillingApi';
import { PaymentLogoImage } from '../../../shared/ui/PaymentLogos/PaymentLogoImage';
import { PAYMENT_METHODS, paymentLogoCompactHeightClass } from '../../../shared/ui/PaymentLogos/paymentLogosConfig';
import { AdminBottomSheet } from '../shared/AdminBottomSheet';
import { billingOutlineBtn, billingPinkBtn } from './adminBillingTheme';
import {
  billingPaymentKindLabel,
  billingPaymentStatusLabel,
  formatBillingDate,
  formatBillingMoney,
  formatMaskedCard,
} from './billingFormat';

type Props = {
  open: boolean;
  payment: BillingPaymentDto | null;
  onClose: () => void;
};

const BEPAID = PAYMENT_METHODS.find((m) => m.id === 'bepaid')!;

function isLikelyPdfUrl(url: string): boolean {
  return /\.pdf(\?|$)/i.test(url);
}

function isLikelyImageUrl(url: string): boolean {
  return /\.(png|jpe?g|webp|gif|svg)(\?|$)/i.test(url);
}

function receiptDownloadName(invoice: string): string {
  const safe = invoice.replace(/[^\w.-]+/g, '_');
  return `${safe}.pdf`;
}

export function BillingPaymentDetailSheet({ open, payment, onClose }: Props) {
  if (!payment) return null;

  const paid = payment.status === 'paid';
  const date = formatBillingDate(payment.paidAt ?? payment.createdAt);
  const card = formatMaskedCard(payment.cardBrand, payment.cardLast4);
  const invoice = payment.invoiceNumber ?? `INV-${payment.id.slice(0, 8).toUpperCase()}`;
  const receiptUrl = payment.receiptUrl?.trim() || null;
  const showPdfPreview = receiptUrl && isLikelyPdfUrl(receiptUrl);
  const showImagePreview = receiptUrl && isLikelyImageUrl(receiptUrl);

  return (
    <AdminBottomSheet
      open={open}
      onClose={onClose}
      title={paid ? 'Чек об оплате' : 'Платёж'}
      variant="catalog"
    >
      <div className="mx-auto max-w-md space-y-5">
        <div className="overflow-hidden rounded-[20px] bg-white p-6 shadow-[0_12px_40px_rgba(17,24,39,0.08)] ring-1 ring-[#F3F4F6]">
          <div className="flex flex-col items-center text-center">
            {paid ? (
              <HiCheckCircle className="h-12 w-12 text-[#22C55E]" aria-hidden />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#F3F4F6] text-[#9CA3AF]">
                !
              </div>
            )}
            <p className="mt-3 text-[13px] font-medium text-[#6B7280]">
              {paid ? 'Оплата прошла успешно' : billingPaymentStatusLabel(payment.status)}
            </p>
            <p className="mt-1 text-[32px] font-black tracking-[-0.04em] text-[#111827]">
              {formatBillingMoney(payment.amount, payment.currency)}
            </p>
            <p className="mt-1 text-[13px] text-[#9CA3AF]">{billingPaymentKindLabel(payment.paymentKind)}</p>
          </div>

          <dl className="mt-6 space-y-3 border-t border-[#F3F4F6] pt-5 text-[14px]">
            <div className="flex justify-between gap-4">
              <dt className="text-[#6B7280]">Номер счёта</dt>
              <dd className="font-semibold text-[#111827]">{invoice}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-[#6B7280]">Дата платежа</dt>
              <dd className="font-semibold text-[#111827]">{date ?? 'Уточняется'}</dd>
            </div>
            {card ? (
              <div className="flex justify-between gap-4">
                <dt className="text-[#6B7280]">Способ оплаты</dt>
                <dd className="font-semibold text-[#111827]">{card}</dd>
              </div>
            ) : null}
          </dl>

          {receiptUrl ? (
            <div className="mt-5 overflow-hidden rounded-[14px] border border-[#F3F4F6] bg-[#FAFAFA]">
              {showPdfPreview ? (
                <iframe
                  src={receiptUrl}
                  title={`Чек ${invoice}`}
                  className="h-[min(22rem,50vh)] w-full bg-white"
                />
              ) : showImagePreview ? (
                <img
                  src={receiptUrl}
                  alt={`Чек ${invoice}`}
                  className="max-h-[min(22rem,50vh)] w-full object-contain bg-white"
                />
              ) : (
                <div className="px-4 py-6 text-center text-[13px] text-[#6B7280]">
                  Электронный чек доступен для скачивания
                </div>
              )}
            </div>
          ) : paid ? (
            <p className="mt-5 rounded-[12px] bg-[#FAFAFA] px-4 py-3 text-center text-[13px] leading-relaxed text-[#6B7280]">
              Электронный чек от провайдера появится здесь после обработки платежа. Данные выше — для
              сверки.
            </p>
          ) : null}

          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            {receiptUrl ? (
              <a
                href={receiptUrl}
                download={receiptDownloadName(invoice)}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex flex-1 items-center justify-center gap-2 text-center ${billingOutlineBtn}`}
              >
                <HiArrowDownTray className="h-4 w-4 shrink-0" aria-hidden />
                Скачать PDF
              </a>
            ) : (
              <button type="button" disabled className={`flex-1 ${billingOutlineBtn} opacity-50`}>
                Скачать PDF
              </button>
            )}
            <button type="button" onClick={onClose} className={`flex-1 ${billingPinkBtn}`}>
              Закрыть
            </button>
          </div>
        </div>

        <div className="flex flex-col items-center gap-2 text-center">
          <PaymentLogoImage
            method={BEPAID}
            logoHeightClass={paymentLogoCompactHeightClass('bepaid')}
            className="opacity-90"
          />
          <p className="text-[12px] text-[#9CA3AF]">Платёж обработан через bePaid</p>
        </div>
      </div>
    </AdminBottomSheet>
  );
}
