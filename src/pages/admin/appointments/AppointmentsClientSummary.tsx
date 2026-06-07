import { useCallback, useState } from 'react';
import { HiEllipsisVertical, HiPhone } from 'react-icons/hi2';
import type { DemoMasterAppointment } from '../../../features/master/model/demoMasterAppointments';
import {
  apptClientContactMenuBtn,
  apptClientContactMenuBtnOpen,
  apptClientContactMenuItem,
  apptClientContactMenuPanel,
  apptDetailSectionLabel,
  apptDetailSurfaceCardMenuHost,
} from './adminAppointmentsTheme';
import { isReturningClient } from './appointmentDetailPresentation';
import { AppointmentsClientAvatar } from './AppointmentsClientAvatar';
import { bookingSourceLabel } from './appointmentsFormat';
import { resolveClientDisplayName } from './appointmentDetailHelpers';

type Props = {
  appointment: DemoMasterAppointment;
  size?: 'md' | 'lg';
  compact?: boolean;
  /** Карточка в модалке записи: кнопки связи, без лишних полей. */
  variant?: 'default' | 'detail';
};

function AppointmentsClientDetailSummary({ appointment }: { appointment: DemoMasterAppointment }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const phone = appointment.contact?.trim() || null;
  const email = appointment.clientEmail?.trim() || null;
  const telegram = appointment.clientTelegramUsername?.trim().replace(/^@+/, '') || null;
  const telegramLabel = telegram ? `@${telegram}` : null;
  const displayName = resolveClientDisplayName(appointment);
  const phoneHref = phone ? `tel:${phone.replace(/\s/g, '')}` : null;
  const telegramHref = telegram ? `https://t.me/${telegram}` : null;
  const writeHref = telegramHref ?? (email ? `mailto:${email}` : null);
  const writeLabel = telegram ? 'Написать в Telegram' : email ? 'Написать на email' : null;
  const returning = isReturningClient(appointment);
  const hasContactMenu = Boolean(phoneHref || phone || writeHref);

  const copyPhone = useCallback(async () => {
    if (!phone) return;
    try {
      await navigator.clipboard.writeText(phone);
      setCopied(true);
      setMenuOpen(false);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }, [phone]);

  return (
    <section
      className={`${apptDetailSurfaceCardMenuHost} px-4 py-3.5 sm:px-5 sm:py-5 ${menuOpen ? 'z-30' : 'z-0'}`}
    >
      <p className={apptDetailSectionLabel}>Клиент</p>

      <div className="mt-3 flex items-start gap-3">
        <AppointmentsClientAvatar
          name={displayName}
          phone={phone}
          photoUrl={appointment.clientAvatarUrl}
          size="md"
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[16px] font-bold tracking-[-0.03em] text-[#111827] sm:text-[17px]">{displayName}</p>
            {returning ? (
              <span className="rounded-full bg-[#FFF1F4] px-2 py-0.5 text-[10px] font-bold text-[#F47C8C]">
                Повторный клиент
              </span>
            ) : null}
          </div>
          {phone ? (
            <p className="mt-1 inline-flex items-center gap-1 text-[14px] font-semibold tabular-nums text-[#374151]">
              <HiPhone className="h-4 w-4 shrink-0 text-[#9CA3AF]" aria-hidden />
              {phone}
            </p>
          ) : (
            <p className="mt-1 text-[13px] font-medium text-[#9CA3AF]">Телефон не указан</p>
          )}
          {email ? <p className="mt-0.5 truncate text-[13px] text-[#6B7280]">{email}</p> : null}
          {telegramLabel ? (
            <p className="mt-0.5 text-[13px] font-medium text-[#6B7280]">{telegramLabel}</p>
          ) : null}
        </div>

        {hasContactMenu ? (
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              className={`${apptClientContactMenuBtn} ${menuOpen ? apptClientContactMenuBtnOpen : ''}`}
              aria-label="Действия с клиентом"
              aria-expanded={menuOpen}
              aria-haspopup="menu"
            >
              <HiEllipsisVertical className="h-5 w-5" aria-hidden />
            </button>
            {menuOpen ? (
              <div role="menu" className={apptClientContactMenuPanel}>
                {phoneHref ? (
                  <a
                    href={phoneHref}
                    role="menuitem"
                    onClick={() => setMenuOpen(false)}
                    className={apptClientContactMenuItem}
                  >
                    Позвонить
                  </a>
                ) : null}
                {phone ? (
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => void copyPhone()}
                    className={`${apptClientContactMenuItem} w-full text-left`}
                  >
                    {copied ? 'Скопировано' : 'Скопировать телефон'}
                  </button>
                ) : null}
                {writeHref && writeLabel ? (
                  <a
                    href={writeHref}
                    role="menuitem"
                    target={telegram ? '_blank' : undefined}
                    rel={telegram ? 'noopener noreferrer' : undefined}
                    onClick={() => setMenuOpen(false)}
                    className={apptClientContactMenuItem}
                  >
                    {writeLabel}
                  </a>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}

function ContactLine({ label, value, href }: { label: string; value: string; href?: string }) {
  const content = (
    <span className="text-[14px] font-semibold text-[#111827]">{value}</span>
  );
  return (
    <div className="flex items-start justify-between gap-3 text-[13px]">
      <span className="shrink-0 text-[#6B7280]">{label}</span>
      {href ? (
        <a href={href} className="min-w-0 text-right text-[#F47C8C] hover:underline">
          {content}
        </a>
      ) : (
        <div className="min-w-0 text-right">{content}</div>
      )}
    </div>
  );
}

export function AppointmentsClientSummary({
  appointment,
  size = 'md',
  compact = false,
  variant = 'default',
}: Props) {
  const phone = appointment.contact?.trim() || null;
  const email = appointment.clientEmail?.trim() || null;
  const telegram = appointment.clientTelegramUsername?.trim().replace(/^@+/, '') || null;
  const telegramLabel = telegram ? `@${telegram}` : null;
  const displayName = resolveClientDisplayName(appointment);
  if (variant === 'detail') {
    return <AppointmentsClientDetailSummary appointment={appointment} />;
  }

  return (
    <div className={compact ? 'flex items-start gap-3' : 'rounded-[10px] bg-[#F5F5F5] px-4 py-4 lg:px-5 lg:py-5'}>
      <AppointmentsClientAvatar
        name={displayName}
        phone={phone}
        photoUrl={appointment.clientAvatarUrl}
        size={size}
      />
      <div className="min-w-0 flex-1">
        <p className="text-[17px] font-bold tracking-[-0.03em] text-[#111827] lg:text-[18px]">
          {displayName}
        </p>
        {!compact ? (
          <div className="mt-3 space-y-2">
            {phone ? (
              <ContactLine label="Телефон" value={phone} href={`tel:${phone.replace(/\s/g, '')}`} />
            ) : null}
            {email ? <ContactLine label="Email" value={email} href={`mailto:${email}`} /> : null}
            {telegramLabel ? (
              <ContactLine label="Telegram" value={telegramLabel} href={`https://t.me/${telegram}`} />
            ) : null}
            <ContactLine
              label="Источник"
              value={bookingSourceLabel(appointment.bookingSource)}
            />
          </div>
        ) : (
          <div className="mt-1 space-y-0.5">
            {phone ? (
              <a
                href={`tel:${phone.replace(/\s/g, '')}`}
                className="inline-flex items-center gap-1 text-[13px] font-semibold text-[#F47C8C]"
              >
                <HiPhone className="h-3.5 w-3.5" aria-hidden />
                {phone}
              </a>
            ) : null}
            {telegramLabel ? (
              <p className="text-[13px] font-medium text-[#6B7280]">{telegramLabel}</p>
            ) : null}
            {email ? <p className="truncate text-[13px] text-[#6B7280]">{email}</p> : null}
          </div>
        )}
      </div>
    </div>
  );
}
