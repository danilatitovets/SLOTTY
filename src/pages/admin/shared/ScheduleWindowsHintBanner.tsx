import { useCallback, useState, type ReactNode } from 'react';
import { HiInformationCircle } from 'react-icons/hi2';
import {
  dismissScheduleWindowsHintPermanently,
  isScheduleWindowsHintDismissed,
  SCHEDULE_WINDOWS_HINT_TEXT,
  SCHEDULE_WINDOWS_HINT_TITLE,
} from './scheduleWindowsHintStorage';

type Props = {
  /** Условие показа снаружи (например, нет окон). */
  show?: boolean;
  /** Синий акцент — только страница расписания. */
  variant?: 'default' | 'schedule';
  children?: ReactNode;
};

const VARIANT_STYLES = {
  default: {
    iconShell: 'flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] bg-[#FFF1F4] text-[#F47C8C]',
    actionPrimary:
      'inline-flex min-h-9 items-center justify-center rounded-[12px] bg-[#FFF1F4] px-3.5 text-[13px] font-semibold text-[#F47C8C] transition hover:bg-[#FFE4EA] active:scale-[0.98]',
  },
  schedule: {
    iconShell: 'flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] bg-[#EEF0FC] text-[#3B4CCA]',
    actionPrimary:
      'inline-flex min-h-9 items-center justify-center rounded-[12px] bg-[#EEF0FC] px-3.5 text-[13px] font-semibold text-[#3B4CCA] transition hover:bg-[#E0E4F8] active:scale-[0.98]',
  },
} as const;

const dismissBtnClass =
  'inline-flex min-h-9 shrink-0 items-center justify-center px-1 text-[13px] font-medium text-[#9CA3AF] transition hover:text-[#6B7280] active:scale-[0.98]';

export function ScheduleWindowsHintBanner({
  show = true,
  variant = 'default',
  children,
}: Props) {
  const [hidden, setHidden] = useState(() => isScheduleWindowsHintDismissed());
  const styles = VARIANT_STYLES[variant];

  const dismiss = useCallback(() => {
    setHidden(true);
  }, []);

  const dismissPermanently = useCallback(() => {
    dismissScheduleWindowsHintPermanently();
    setHidden(true);
  }, []);

  if (!show || hidden) return null;

  return (
    <article className="overflow-hidden rounded-[16px] bg-[#F5F5F5]" role="note">
      <div className="p-4">
        <div className="flex items-start gap-3">
          <span className={styles.iconShell} aria-hidden>
            <HiInformationCircle className="h-[18px] w-[18px]" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-bold leading-snug tracking-[-0.02em] text-[#111827]">
              {SCHEDULE_WINDOWS_HINT_TITLE}
            </p>
            <p className="mt-1 text-[13px] font-medium leading-snug text-[#6B7280]">
              {SCHEDULE_WINDOWS_HINT_TEXT}
            </p>
          </div>
        </div>

        {children ? <div className="mt-3">{children}</div> : null}

        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1">
          <button type="button" onClick={dismiss} className={styles.actionPrimary}>
            Понятно
          </button>
          <button type="button" onClick={dismissPermanently} className={dismissBtnClass}>
            Не показывать снова
          </button>
        </div>
      </div>
    </article>
  );
}
