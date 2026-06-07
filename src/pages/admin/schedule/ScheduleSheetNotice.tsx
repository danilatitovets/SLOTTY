import type { ReactNode } from 'react';
import { HiInformationCircle } from 'react-icons/hi2';
import { SlottyImg } from '../../../shared/ui/SlottyImg';
import { ADMIN_ATTENTION_EXCLAMATION_ICON_SRC } from '../shared/AdminSectionAttentionBadge';

type Props = {
  variant?: 'info' | 'warning';
  children: ReactNode;
  action?: ReactNode;
};

const VARIANTS = {
  info: {
    shell: 'bg-[#EBEBEB]',
    iconWrap: 'bg-white text-[#3B4CCA]',
  },
  warning: {
    shell: 'bg-[#EEF0FC]',
    iconWrap: 'bg-white',
  },
} as const;

export function ScheduleSheetNotice({ variant = 'info', children, action }: Props) {
  const styles = VARIANTS[variant];

  return (
    <div className={`rounded-[12px] px-4 py-3.5 ${styles.shell}`} role="note">
      <div className="flex items-start gap-3">
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] ${styles.iconWrap}`}
          aria-hidden
        >
          {variant === 'warning' ? (
            <SlottyImg
              src={ADMIN_ATTENTION_EXCLAMATION_ICON_SRC}
              alt=""
              className="h-7 w-7 object-contain"
              decoding="async"
            />
          ) : (
            <HiInformationCircle className="h-5 w-5 text-[#3B4CCA]" strokeWidth={2} />
          )}
        </span>
        <div className="min-w-0 flex-1 pt-0.5">
          <p className="text-[14px] font-semibold leading-snug text-[#111827]">{children}</p>
          {action ? <div className="mt-2.5">{action}</div> : null}
        </div>
      </div>
    </div>
  );
}
