import { useState } from 'react';
import { HiShieldExclamation } from 'react-icons/hi2';
import {
  MASTER_PROFILE_REPORT_REASONS,
  submitMasterProfileReport,
  type MasterProfileReportReason,
} from '../../../features/masters/api/masterProfileReportApi';
import { useAuth } from '../../../features/auth/AuthProvider';
import { ClientSheetShell } from './ClientSheetShell';
import { MASTER_PROFILE_REPORT_ART } from './masterProfileReportAssets';
import {
  catalogDesktopPanel,
  catalogPrimaryBtn,
  catalogSecondaryBtn,
  masterProfileCard,
} from './masterProfileTheme';

type Props = {
  open: boolean;
  masterId: string;
  masterName: string;
  onClose: () => void;
  onSuccess: () => void;
  onNeedLogin: () => void;
};

const textareaClass =
  'mt-2 w-full resize-none rounded-[14px] border-0 bg-[#F5F5F5] px-3.5 py-3 text-[14px] text-[#111827] outline-none transition placeholder:text-[#8E8E93] focus:bg-[#EBEBEB]';

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
        <div className="flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className={`${catalogSecondaryBtn} w-full min-h-11 sm:w-auto sm:min-w-[7.5rem]`}
          >
            Отмена
          </button>
          <button
            type="button"
            onClick={() => void submit()}
            disabled={busy}
            className={`${catalogPrimaryBtn} w-full min-h-11 sm:w-auto sm:min-w-[11rem]`}
          >
            {busy ? 'Отправка…' : 'Отправить жалобу'}
          </button>
        </div>
      }
    >
      <div className={`${masterProfileCard} overflow-hidden`}>
        <div className="relative h-36 overflow-hidden bg-[#FFF1F4] sm:h-40">
          <img
            src={MASTER_PROFILE_REPORT_ART}
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
              Жалоба на профиль{' '}
              <span className="font-semibold text-[#111827]">{masterName}</span> попадёт в админку
              Slotty. Мы проверим информацию и при необходимости примем меры.
            </p>
          </div>
        </div>
      </div>

      {!isAuthenticated ? (
        <p className="mt-4 rounded-[14px] bg-[#FFF1F4] px-3.5 py-3 text-[13px] font-medium leading-snug text-[#9D174D]">
          Войдите в аккаунт, чтобы отправить жалобу.
        </p>
      ) : null}

      <div className={`mt-5 ${catalogDesktopPanel} p-3 sm:p-4`}>
        <p className="mb-2.5 text-[13px] font-semibold text-[#111827]">Причина</p>
        <div className="space-y-1.5 rounded-[14px] bg-[#F5F5F5] p-1.5">
          {MASTER_PROFILE_REPORT_REASONS.map((item) => {
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
                  name="report-reason"
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
          {reasonCode === 'other' ? 'Опишите проблему' : 'Комментарий (необязательно)'}
        </span>
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
          className={textareaClass}
        />
      </label>

      {error ? (
        <p className="mt-3 rounded-[12px] bg-red-50 px-3 py-2.5 text-[13px] font-medium text-red-600">
          {error}
        </p>
      ) : null}
    </ClientSheetShell>
  );
}
