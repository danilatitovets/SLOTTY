import type { ReactNode } from 'react';
import { AdminSectionAttentionBadge } from '../shared/AdminSectionAttentionBadge';
import {
  apptPendingDeadlineHint,
  apptPendingDeadlineHintCritical,
  apptPendingDeadlineHintUrgent,
} from './adminAppointmentsTheme';
import { formatPendingDeadline } from './formatPendingDeadline';

type Props = {
  pendingExpiresAt?: string | null;
  className?: string;
  compact?: boolean;
};

const TONE_SHELL = {
  normal: apptPendingDeadlineHint,
  warning: apptPendingDeadlineHintUrgent,
  critical: apptPendingDeadlineHintCritical,
} as const;

const TONE_TIME = {
  normal: 'font-bold tabular-nums text-[#F47C8C]',
  warning: 'font-bold tabular-nums text-[#F47C8C]',
  critical: 'font-bold tabular-nums text-[#EF4444]',
} as const;

function emphasizeTime(text: string, timeLabel: string, timeClass: string): ReactNode {
  if (!timeLabel || !text.includes(timeLabel)) return text;

  const [before, after] = text.split(timeLabel);
  return (
    <>
      {before}
      <span className={timeClass}>{timeLabel}</span>
      {after}
    </>
  );
}

export function PendingDeadlineHint({ pendingExpiresAt, className = '', compact = false }: Props) {
  const deadline = formatPendingDeadline(pendingExpiresAt);
  if (!deadline) return null;

  const shellClass = TONE_SHELL[deadline.tone];
  const timeClass = TONE_TIME[deadline.tone];
  const lineClass = compact ? 'text-[12px]' : 'text-[13px]';
  const helperClass = compact ? 'text-[11px]' : 'text-[12px]';

  return (
    <div
      role="status"
      className={`relative ${shellClass} ${compact ? 'px-2.5 py-2 pr-8' : 'pr-9'} ${className}`}
    >
      <AdminSectionAttentionBadge
        className={`absolute right-2 top-2 ${compact ? 'h-4 w-4' : 'h-[18px] w-[18px]'}`}
        label={deadline.line}
      />
      <p className={`pr-1 font-semibold leading-snug text-[#111827] ${lineClass}`}>
        {emphasizeTime(deadline.line, deadline.timeLabel, timeClass)}
      </p>
      <p className={`mt-0.5 pr-1 font-medium leading-snug text-[#6B7280] ${helperClass}`}>
        {emphasizeTime(deadline.helper, deadline.timeLabel, timeClass)}
      </p>
    </div>
  );
}

export function isPendingConfirmDisabled(
  dbStatus: string | undefined,
  pendingExpiresAt?: string | null,
  now = Date.now(),
): boolean {
  if (dbStatus !== 'pending' && dbStatus !== undefined) return false;
  const deadline = formatPendingDeadline(pendingExpiresAt, now);
  return deadline?.confirmDisabled ?? false;
}
