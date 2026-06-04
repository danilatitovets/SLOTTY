import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { MASTER_SETTINGS_SUPPORT_TICKETS_PATH } from '../../../../../app/paths';
import { SettingsHeader } from '../SettingsHeader';
import {
  SettingsCabinetFeatureCard,
  SettingsCabinetSectionTitle,
  SettingsCabinetStatusPill,
  settingsCabinetOutlineBtn,
  settingsCabinetStack,
} from '../settingsCabinetUi';
import { SettingsSkeleton } from '../settingsUi';
import { SupportIconContact } from './supportIcons';
import { fetchSupportTicket, isSupportApiAvailable, type SupportTicketDetail } from './supportApi';
import {
  formatTicketWhen,
  TICKET_STATUS,
  ticketActorLabel,
  ticketCategoryLabel,
  ticketEventTypeLabel,
  ticketServicesLabel,
  ticketSeverityLabel,
} from './supportTicketUi';

function MetaCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[12px] bg-[#F6F7FB] px-3 py-2.5">
      <dt className="text-[11px] font-medium uppercase tracking-wide text-[#9CA3AF]">{label}</dt>
      <dd className="mt-0.5 text-[14px] font-medium text-[#111827]">{value}</dd>
    </div>
  );
}

export function SupportTicketDetailPage() {
  const { ticketCode } = useParams<{ ticketCode: string }>();
  const [ticket, setTicket] = useState<SupportTicketDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ticketCode || !isSupportApiAvailable()) {
      setLoading(false);
      return;
    }
    fetchSupportTicket(ticketCode)
      .then(setTicket)
      .catch((e) => setError(e instanceof Error ? e.message : 'Ошибка'))
      .finally(() => setLoading(false));
  }, [ticketCode]);

  const status = ticket ? (TICKET_STATUS[ticket.status] ?? { label: ticket.status, tone: 'neutral' as const }) : null;

  return (
    <>
      <SettingsHeader
        title={ticket?.subject ?? ticketCode ?? 'Обращение'}
        description={ticket ? ticket.ticketCode : ''}
        breadcrumb="Поддержка / Обращение"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {status ? <SettingsCabinetStatusPill tone={status.tone}>{status.label}</SettingsCabinetStatusPill> : null}
            <Link to={MASTER_SETTINGS_SUPPORT_TICKETS_PATH} className={settingsCabinetOutlineBtn}>
              К списку
            </Link>
          </div>
        }
      />

      <div className={settingsCabinetStack}>
        {loading ? (
          <div className="rounded-[16px] bg-white p-5">
            <SettingsSkeleton rows={4} />
          </div>
        ) : error ? (
          <SettingsCabinetFeatureCard
            icon={<SupportIconContact />}
            title="Не удалось загрузить"
            subtitle={error}
          />
        ) : ticket ? (
          <>
            <section className="rounded-[16px] bg-white p-5 sm:p-6">
              <dl className="grid gap-3 sm:grid-cols-2">
                <MetaCell label="Категория" value={ticketCategoryLabel(ticket.category)} />
                <MetaCell label="Срочность" value={ticketSeverityLabel(ticket.severity)} />
                <MetaCell label="Сервисы" value={ticketServicesLabel(ticket.affectedServices)} />
                <MetaCell
                  label="Ответ"
                  value={
                    ticket.preferredContactChannel === 'telegram'
                      ? 'Telegram'
                      : ticket.preferredContactChannel === 'in_app'
                        ? 'В приложении'
                        : 'Email'
                  }
                />
                <MetaCell label="Создано" value={formatTicketWhen(ticket.createdAt)} />
                <MetaCell label="Обновлено" value={formatTicketWhen(ticket.updatedAt)} />
                {ticket.contactEmail ? (
                  <MetaCell label="Email" value={ticket.contactEmail} />
                ) : null}
              </dl>
            </section>

            <section className="rounded-[16px] bg-white p-5 sm:p-6">
              <SettingsCabinetSectionTitle title="Ваше сообщение" />
              <p className="mt-4 whitespace-pre-wrap text-[15px] leading-[1.65] text-[#374151]">{ticket.message}</p>
            </section>

            <section>
              <SettingsCabinetSectionTitle
                title="История"
                description="События и ответы по обращению"
              />
              {ticket.events.length === 0 ? (
                <p className="mt-4 text-[14px] text-[#9CA3AF]">Событий пока нет</p>
              ) : (
                <ul className="mt-4 divide-y divide-[#F0F1F5] rounded-[16px] bg-white">
                  {ticket.events.map((ev) => (
                    <li key={ev.id} className="px-5 py-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[13px] font-bold text-[#111827]">
                          {ticketEventTypeLabel(ev.eventType)}
                        </span>
                        <span className="text-[12px] text-[#9CA3AF]">· {ticketActorLabel(ev.actorRole)}</span>
                      </div>
                      {ev.message ? (
                        <p className="mt-2 text-[14px] leading-relaxed text-[#374151]">{ev.message}</p>
                      ) : null}
                      <p className="mt-1.5 text-[12px] text-[#9CA3AF]">{formatTicketWhen(ev.createdAt)}</p>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {ticket.attachments.length > 0 ? (
              <section className="rounded-[16px] bg-white p-5 sm:p-6">
                <SettingsCabinetSectionTitle title="Вложения" />
                <ul className="mt-3 space-y-2 text-[14px] text-[#374151]">
                  {ticket.attachments.map((a) => (
                    <li key={a.id}>
                      {a.fileName}{' '}
                      <span className="text-[#9CA3AF]">({Math.round(a.sizeBytes / 1024)} КБ)</span>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </>
        ) : null}
      </div>
    </>
  );
}
