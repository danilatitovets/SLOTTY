import { useState } from 'react';
import {
  MASTER_PROFILE_REPORT_REASONS,
  submitMasterProfileReport,
  type MasterProfileReportReason,
} from '../../../features/masters/api/masterProfileReportApi';
import { useAuth } from '../../../features/auth/AuthProvider';
import { clientPinkBtn } from '../clientTheme';
import { ClientSheetShell } from './ClientSheetShell';

type Props = {
  open: boolean;
  masterId: string;
  masterName: string;
  onClose: () => void;
  onSuccess: () => void;
  onNeedLogin: () => void;
};

const inputClass =
  'mt-2 w-full rounded-[12px] border border-[#E5E7EB] bg-white px-3 py-2.5 text-[14px] text-[#111827] outline-none ring-[#F47C8C]/30 transition focus:border-[#F47C8C] focus:ring-2';

export function MasterProfileReportSheet({
  open,
  masterId,
  masterName,
  onClose,
  onSuccess,
  onNeedLogin,
}: Props) {
  const { isAuthenticated } = useAuth();
  const [reasonCode, setReasonCode] = useState<MasterProfileReportReason>('fake_profile');
  const [reasonText, setReasonText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!isAuthenticated) {
      onNeedLogin();
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await submitMasterProfileReport(masterId, {
        reasonCode,
        reasonText: reasonCode === 'other' ? reasonText.trim() : reasonText.trim() || null,
      });
      onSuccess();
      onClose();
      setReasonText('');
      setReasonCode('fake_profile');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось отправить жалобу');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ClientSheetShell
      open={open}
      onClose={onClose}
      title="Пожаловаться на профиль"
      footer={
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#E5E7EB] px-5 text-[14px] font-semibold text-[#374151]"
          >
            Отмена
          </button>
          <button type="button" onClick={() => void submit()} disabled={busy} className={clientPinkBtn}>
            {busy ? 'Отправка…' : 'Отправить жалобу'}
          </button>
        </div>
      }
    >
      <p className="text-[14px] leading-relaxed text-[#6B7280]">
        Жалоба на профиль <span className="font-semibold text-[#111827]">{masterName}</span> попадёт в
        админку SLOTTY. Мы проверим информацию и при необходимости примем меры.
      </p>

      {!isAuthenticated ? (
        <p className="mt-4 rounded-[12px] bg-[#FFF1F4] px-3 py-2.5 text-[13px] font-medium text-[#9D174D]">
          Войдите в аккаунт, чтобы отправить жалобу.
        </p>
      ) : null}

      <fieldset className="mt-5 space-y-2">
        <legend className="text-[13px] font-semibold text-[#374151]">Причина</legend>
        {MASTER_PROFILE_REPORT_REASONS.map((item) => (
          <label
            key={item.code}
            className={`flex cursor-pointer items-start gap-3 rounded-[12px] border px-3 py-2.5 text-[14px] transition ${
              reasonCode === item.code
                ? 'border-[#F47C8C] bg-[#FFF1F4] text-[#111827]'
                : 'border-[#E5E7EB] bg-white text-[#374151] hover:border-[#D1D5DB]'
            }`}
          >
            <input
              type="radio"
              name="report-reason"
              value={item.code}
              checked={reasonCode === item.code}
              onChange={() => setReasonCode(item.code)}
              className="mt-1 accent-[#F47C8C]"
            />
            <span>{item.label}</span>
          </label>
        ))}
      </fieldset>

      <label className="mt-4 block text-[13px] font-semibold text-[#374151]">
        {reasonCode === 'other' ? 'Опишите проблему' : 'Комментарий (необязательно)'}
        <textarea
          value={reasonText}
          onChange={(e) => setReasonText(e.target.value)}
          rows={4}
          maxLength={2000}
          placeholder={
            reasonCode === 'other'
              ? 'Расскажите, что не так с профилем…'
              : 'Дополнительные детали для модерации…'
          }
          className={inputClass}
        />
      </label>

      {error ? <p className="mt-3 text-[13px] font-medium text-red-600">{error}</p> : null}
    </ClientSheetShell>
  );
}
