import type { ReactNode } from 'react';
import { clientOutlineBtn } from '../clientTheme';

type Props = {
  icon?: ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({ icon, title, description, actionLabel, onAction }: Props) {
  return (
    <div className="flex flex-col items-center rounded-[28px] bg-[#FAFAFA] px-6 py-10 text-center">
      {icon ? <div className="mb-4 text-[#F47C8C] opacity-80">{icon}</div> : null}
      <p className="text-[17px] font-semibold text-[#111827]">{title}</p>
      {description ? (
        <p className="mt-2 max-w-[18rem] text-[14px] leading-snug text-[#6B7280]">{description}</p>
      ) : null}
      {actionLabel && onAction ? (
        <button type="button" className={`${clientOutlineBtn} mt-5`} onClick={onAction}>
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}
