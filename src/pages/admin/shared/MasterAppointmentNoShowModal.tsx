import { useState } from 'react';
import { AdminBottomSheet } from './AdminBottomSheet';
import {
  catalogSheetField,
  catalogSheetLabel,
  catalogSheetPrimaryBtn,
  catalogSheetSecondaryBtn,
} from './adminCatalogSheetTheme';

type Props = {
  open: boolean;
  busy?: boolean;
  error?: string | null;
  onClose: () => void;
  onSubmit: (payload: { waitedMinutes: number; hadClientContact: boolean; comment: string }) => void;
};

const WAIT_OPTIONS = [5, 10, 15, 20] as const;

export function MasterAppointmentNoShowModal({ open, busy, error, onClose, onSubmit }: Props) {
  const [waitedMinutes, setWaitedMinutes] = useState<number>(10);
  const [hadClientContact, setHadClientContact] = useState<boolean>(false);
  const [comment, setComment] = useState('');

  if (!open) return null;

  return (
    <AdminBottomSheet
      variant="catalog"
      open
      onClose={onClose}
      title="Клиент не пришёл?"
      footer={
        <div className="flex w-full flex-col gap-2">
          <button type="button" onClick={onClose} className={catalogSheetSecondaryBtn} disabled={busy}>
            Назад
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => onSubmit({ waitedMinutes, hadClientContact, comment: comment.trim() })}
            className={catalogSheetPrimaryBtn}
          >
            Отправить в поддержку
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        <p className="text-[14px] leading-relaxed text-[#6B7280]">
          Если клиент не пришёл и не предупредил, вы можете сообщить об этом в поддержку. Мы сохраним
          событие и при необходимости проверим историю клиента.
        </p>

        <label className="block">
          <span className={catalogSheetLabel}>Сколько ждали</span>
          <select
            value={waitedMinutes}
            onChange={(e) => setWaitedMinutes(Number(e.target.value))}
            className={catalogSheetField}
          >
            {WAIT_OPTIONS.map((m) => (
              <option key={m} value={m}>
                {m} минут
              </option>
            ))}
          </select>
        </label>

        <fieldset>
          <legend className={catalogSheetLabel}>Был ли контакт с клиентом</legend>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={() => setHadClientContact(true)}
              className={`flex-1 rounded-[10px] px-3 py-2.5 text-[14px] font-semibold ${
                hadClientContact ? 'bg-[#F47C8C] text-white' : 'bg-[#F5F5F5] text-[#374151]'
              }`}
            >
              Да
            </button>
            <button
              type="button"
              onClick={() => setHadClientContact(false)}
              className={`flex-1 rounded-[10px] px-3 py-2.5 text-[14px] font-semibold ${
                !hadClientContact ? 'bg-[#F47C8C] text-white' : 'bg-[#F5F5F5] text-[#374151]'
              }`}
            >
              Нет
            </button>
          </div>
        </fieldset>

        <label className="block">
          <span className={catalogSheetLabel}>Комментарий</span>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            className={`${catalogSheetField} min-h-[5rem] resize-none`}
            placeholder="Необязательно"
          />
        </label>

        {error ? (
          <p className="rounded-[10px] bg-[#FEF2F2] px-3 py-2 text-[13px] font-semibold text-[#EF4444]">
            {error}
          </p>
        ) : null}
      </div>
    </AdminBottomSheet>
  );
}
