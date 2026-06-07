import { useState } from 'react';
import { HiShieldExclamation } from 'react-icons/hi2';
import {
  BOOKING_CLIENT_REPORT_REASONS,
  submitBookingClientReport,
  type BookingClientReportReason,
} from '../../../features/appointments/api/bookingClientReportApi';
import { AdminBottomSheet } from './AdminBottomSheet';
import {
  catalogSheetPrimaryBtn,
  catalogSheetSecondaryBtn,
} from './adminCatalogSheetTheme';
import { MASTER_CLIENT_REPORT_ART } from './masterClientReportAssets';

type Props = {
  open: boolean;
  appointmentId: string;
  clientName: string;
  onClose: () => void;
  onSuccess: () => void;
};

const textareaClass =
  'mt-2 w-full resize-none rounded-[14px] border-0 bg-[#F5F5F5] px-3.5 py-3 text-[14px] text-[#111827] outline-none transition placeholder:text-[#8E8E93] focus:bg-[#EBEBEB]';

export function MasterClientReportSheet({
  open,
  appointmentId,
  clientName,
  onClose,
  onSuccess,
}: Props) {
  const [reasonCode, setReasonCode] = useState<BookingClientReportReason>('client_misconduct');
  const [reasonText, setReasonText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      await submitBookingClientReport(appointmentId, {
        reasonCode,
        reasonText: reasonText.trim() || null,
      });
      onSuccess();
      onClose();
      setReasonText('');
      setReasonCode('client_misconduct');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось отправить жалобу');
    } finally {
      setBusy(false);
    }
  };

  return (
    <AdminBottomSheet
      variant="catalog"
      open={open}
      onClose={onClose}
      title="Пожаловаться на клиента"
      footer={
        <div className="flex w-full flex-col gap-2">
          <button type="button" onClick={onClose} disabled={busy} className={catalogSheetSecondaryBtn}>
            Отмена
          </button>
          <button
            type="button"
            onClick={() => void submit()}
            disabled={busy || (reasonCode === 'other' && reasonText.trim().length < 10)}
            className={catalogSheetPrimaryBtn}
          >
            {busy ? 'Отправка…' : 'Отправить жалобу'}
          </button>
        </div>
      }
    >
      <div className="overflow-hidden rounded-[12px] bg-white ring-1 ring-[#EEEEEE]">
        <div className="relative h-32 overflow-hidden sm:h-36">
          <img
            src={MASTER_CLIENT_REPORT_ART}
            alt=""
            className="h-full w-full object-cover object-center"
            loading="lazy"
            decoding="async"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-white via-white/25 to-transparent" />
        </div>
        <div className="px-4 pb-4 pt-3 sm:px-5 sm:pb-5">
          <div className="flex items-start gap-2.5">
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] bg-[#FFF1F4] text-[#F47C8C]">
              <HiShieldExclamation className="h-[18px] w-[18px]" aria-hidden />
            </span>
            <p className="text-[14px] leading-relaxed text-[#4B5563]">
              Жалоба на клиента{' '}
              <span className="font-semibold text-[#111827]">{clientName}</span> попадёт в админку
              SLOTTY. Мы проверим информацию и при необходимости примем меры.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-5 rounded-[12px] bg-white p-3 ring-1 ring-[#EEEEEE] sm:p-4">
        <p className="mb-2.5 text-[13px] font-semibold text-[#111827]">Причина</p>
        <div className="space-y-1.5 rounded-[14px] bg-[#F5F5F5] p-1.5">
          {BOOKING_CLIENT_REPORT_REASONS.map((item) => {
            const active = reasonCode === item.code;
            return (
              <label
                key={item.code}
                className={`flex cursor-pointer items-center gap-3 rounded-[10px] px-3 py-2.5 text-[14px] font-semibold transition ${
                  active
                    ? 'bg-[#FFF1F4] text-[#F47C8C] ring-1 ring-[#F47C8C]/15'
                    : 'bg-white text-[#374151] hover:bg-[#FAFAFA]'
                }`}
              >
                <input
                  type="radio"
                  name="client-report-reason"
                  value={item.code}
                  checked={active}
                  onChange={() => setReasonCode(item.code)}
                  className="sr-only"
                />
                <span
                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${
                    active ? 'border-[#F47C8C] bg-[#F47C8C]' : 'border-[#D1D5DB] bg-white'
                  }`}
                  aria-hidden
                >
                  {active ? <span className="h-1.5 w-1.5 rounded-full bg-white" /> : null}
                </span>
                <span className="leading-snug">{item.label}</span>
              </label>
            );
          })}
        </div>
      </div>

      <label className="mt-4 block">
        <span className="text-[13px] font-semibold text-[#111827]">
          {reasonCode === 'other' ? 'Опишите проблему *' : 'Комментарий (необязательно)'}
        </span>
        <textarea
          value={reasonText}
          onChange={(e) => setReasonText(e.target.value)}
          rows={4}
          maxLength={2000}
          placeholder={
            reasonCode === 'other'
              ? 'Расскажите, что произошло…'
              : 'Дополнительные детали для модерации…'
          }
          className={textareaClass}
        />
      </label>

      {error ? (
        <p className="mt-3 rounded-[12px] bg-[#FEF2F2] px-3 py-2.5 text-[13px] font-medium text-[#EF4444]">
          {error}
        </p>
      ) : null}
    </AdminBottomSheet>
  );
}
