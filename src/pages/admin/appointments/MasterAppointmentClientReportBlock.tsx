import { useState } from 'react';
import { HiChevronDown, HiShieldExclamation } from 'react-icons/hi2';
import { MASTER_CLIENT_REPORT_ART } from '../shared/masterClientReportAssets';
import { apptDetailReportBtn, apptDetailReportToggle } from './adminAppointmentsTheme';

type Props = {
  clientName: string;
  reported?: boolean;
  disabled?: boolean;
  onReport: () => void;
};

export function MasterAppointmentClientReportBlock({
  clientName,
  reported = false,
  disabled = false,
  onReport,
}: Props) {
  const [open, setOpen] = useState(false);
  const toggleLabel = reported ? 'Жалоба отправлена' : 'Что-то пошло не так?';

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={apptDetailReportToggle}
        aria-expanded={open}
        aria-controls="appointment-client-report-panel"
      >
        {toggleLabel}
        <HiChevronDown
          className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`}
          aria-hidden
        />
      </button>

      {open ? (
        <section
          id="appointment-client-report-panel"
          className="mt-3 overflow-hidden rounded-[20px] bg-white ring-1 ring-[#EEEEEE]"
        >
          <div className="relative h-28 overflow-hidden sm:h-32">
            <img
              src={MASTER_CLIENT_REPORT_ART}
              alt=""
              className="h-full w-full object-cover object-center"
              loading="lazy"
              decoding="async"
            />
            <div
              className="pointer-events-none absolute inset-0 bg-gradient-to-t from-white via-white/55 to-white/10"
              aria-hidden
            />
          </div>

          <div className="px-4 pb-4 pt-3 sm:px-5 sm:pb-5">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-[#FFF1F4] text-[#E11D48]">
                <HiShieldExclamation className="h-5 w-5" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-bold tracking-[-0.02em] text-[#9F1239]">
                  {reported ? 'Жалоба отправлена' : 'Что-то пошло не так?'}
                </p>
                <p className="mt-1.5 text-[13px] font-medium leading-relaxed text-[#374151]">
                  {reported ? (
                    <>
                      Мы проверим ситуацию с клиентом{' '}
                      <span className="font-bold text-[#111827]">{clientName}</span> и при необходимости
                      примем меры.
                    </>
                  ) : (
                    <>
                      Если с визитом возникла проблема, отправьте жалобу — мы проверим ситуацию с{' '}
                      <span className="font-bold text-[#111827]">{clientName}</span>.
                    </>
                  )}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onReport}
              disabled={disabled || reported}
              className={`${apptDetailReportBtn} mt-4 bg-[#FEF2F2] text-[#BE123C] hover:bg-[#FEE2E2]`}
            >
              {reported ? 'Жалоба уже отправлена' : 'Пожаловаться на клиента'}
            </button>
          </div>
        </section>
      ) : null}
    </div>
  );
}
