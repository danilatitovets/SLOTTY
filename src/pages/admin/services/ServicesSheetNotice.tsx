import type { ReactNode } from 'react';
import { SlottyImg } from '../../../shared/ui/SlottyImg';
import { ADMIN_ATTENTION_EXCLAMATION_ICON_SRC } from '../shared/AdminSectionAttentionBadge';

type Props = {
  title: string;
  body?: string;
  hint?: string;
  tone?: 'warning' | 'error';
  action?: ReactNode;
};

export function ServicesSheetNotice({
  title,
  body,
  hint,
  tone = 'warning',
  action,
}: Props) {
  const shellClass =
    tone === 'error'
      ? 'rounded-[12px] border border-[#FECACA] bg-[#FEF2F2] px-3.5 py-3'
      : 'rounded-[12px] border border-[#FDE8ED] bg-[#FFFBFC] px-3.5 py-3';

  return (
    <div className={shellClass} role="note">
      <div className={`flex gap-2.5 ${action ? 'flex-col sm:flex-row sm:items-center sm:justify-between' : ''}`}>
        <div className="flex min-w-0 items-start gap-2.5">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center" aria-hidden>
            <SlottyImg
              src={ADMIN_ATTENTION_EXCLAMATION_ICON_SRC}
              alt=""
              className="h-6 w-6 object-contain"
              decoding="async"
            />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-bold leading-snug text-[#111827]">{title}</p>
            {body ? (
              <p className="mt-0.5 text-[12px] leading-relaxed text-[#6B7280]">{body}</p>
            ) : null}
            {hint ? (
              <p className="mt-2 text-[12px] font-medium leading-snug text-[#9CA3AF]">{hint}</p>
            ) : null}
          </div>
        </div>
        {action ? <div className="shrink-0 sm:pl-8">{action}</div> : null}
      </div>
    </div>
  );
}
