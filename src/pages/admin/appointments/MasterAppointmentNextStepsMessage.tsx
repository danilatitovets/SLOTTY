import { useState } from 'react';
import { HiChatBubbleLeftEllipsis, HiChevronDown } from 'react-icons/hi2';
import {
  apptDetailNextStepsToggle,
  apptPendingDeadlineHint,
  apptPendingDeadlineHintUrgent,
} from './adminAppointmentsTheme';

type Props = {
  text: string;
  warning?: string | null;
};

export function MasterAppointmentNextStepsMessage({ text, warning }: Props) {
  const [open, setOpen] = useState(false);
  const shellClass = warning?.trim() ? apptPendingDeadlineHintUrgent : apptPendingDeadlineHint;

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={apptDetailNextStepsToggle}
        aria-expanded={open}
        aria-controls="appointment-next-steps-message"
      >
        Что делать
        <HiChevronDown
          className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`}
          aria-hidden
        />
      </button>

      {open ? (
        <div id="appointment-next-steps-message" role="status" className={`mt-3 ${shellClass}`}>
          <div className={`flex gap-3 ${warning?.trim() ? 'items-start' : 'items-center'}`}>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-[#F47C8C]">
              <HiChatBubbleLeftEllipsis className="h-4 w-4" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold leading-snug text-[#111827]">{text}</p>
              {warning?.trim() ? (
                <p className="mt-1.5 text-[12px] font-semibold leading-snug text-[#F47C8C]">
                  {warning.trim()}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
