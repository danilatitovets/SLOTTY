import { useEffect, type ReactNode } from 'react';
import { clientOutlineBtn, clientPinkBtn } from '../clientTheme';

type Props = {
  open: boolean;
  title: string;
  onClose: () => void;
  onReset: () => void;
  onApply: () => void;
  children: ReactNode;
};

export function FilterSheet({ open, title, onClose, onReset, onApply, children }: Props) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex flex-col justify-end">
      <button
        type="button"
        className="absolute inset-0 bg-black/35 backdrop-blur-[2px]"
        aria-label="Закрыть"
        onClick={onClose}
      />
      <div className="relative max-h-[88dvh] overflow-hidden rounded-t-[28px] bg-white shadow-[0_-12px_40px_rgba(17,24,39,0.12)]">
        <div className="flex justify-center pt-3">
          <div className="h-1 w-10 rounded-full bg-[#E5E7EB]" aria-hidden />
        </div>
        <div className="flex items-center justify-between px-5 pb-2 pt-1">
          <h2 className="text-[20px] font-semibold tracking-tight text-[#111827]">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-[14px] font-semibold text-[#9CA3AF]"
          >
            Закрыть
          </button>
        </div>
        <div className="max-h-[62dvh] overflow-y-auto px-5 pb-4">{children}</div>
        <div className="flex gap-2 border-t border-[#F3F4F6] px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <button type="button" className={`${clientOutlineBtn} flex-1`} onClick={onReset}>
            Сбросить
          </button>
          <button type="button" className={`${clientPinkBtn} flex-[1.4]`} onClick={onApply}>
            Показать
          </button>
        </div>
      </div>
    </div>
  );
}

export function FilterChipGroup({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { id: string; label: string }[];
  value: string | null;
  onChange: (id: string | null) => void;
}) {
  return (
    <div className="mb-5">
      <p className="mb-2 text-[13px] font-semibold text-[#6B7280]">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => {
          const on = value === o.id;
          return (
            <button
              key={o.id}
              type="button"
              onClick={() => onChange(on ? null : o.id)}
              className={`rounded-full border-0 px-4 py-2 text-[13px] font-semibold transition ${
                on
                  ? 'bg-[#FFF1F4] text-[#F47C8C] shadow-[0_4px_14px_rgba(244,124,140,0.15)]'
                  : 'bg-[#F1EFEF] text-[#374151] shadow-[0_2px_10px_rgba(17,24,39,0.04)]'
              }`}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function FilterSwitch({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="mb-4 flex cursor-pointer items-center justify-between gap-3 rounded-[16px] bg-[#FAFAFA] px-4 py-3.5">
      <span className="text-[15px] font-medium text-[#111827]">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-7 w-12 shrink-0 rounded-full transition ${
          checked ? 'bg-[#F47C8C]' : 'bg-[#D1D5DB]'
        }`}
      >
        <span
          className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition ${
            checked ? 'left-[22px]' : 'left-0.5'
          }`}
        />
      </button>
    </label>
  );
}
