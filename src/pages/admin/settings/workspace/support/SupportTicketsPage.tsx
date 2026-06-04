import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  MASTER_SETTINGS_SUPPORT_CONTACT_PATH,
  MASTER_SETTINGS_SUPPORT_PATH,
} from '../../../../../app/paths';
import { SettingsSkeleton } from '../settingsUi';
import { fetchSupportTickets, isSupportApiAvailable, type SupportTicketSummary } from './supportApi';
import {
  SupportTicketsEmptyState,
  SupportTicketsPageHeader,
  SupportTicketsTabs,
  supportTicketsLinkClass,
  type SupportTicketsTab,
} from './supportTicketsUi';
import { formatTicketWhen, isTicketActive, TICKET_STATUS, ticketSeverityLabel } from './supportTicketUi';

function filterTickets(tickets: SupportTicketSummary[], tab: SupportTicketsTab) {
  return tickets.filter((t) => (tab === 'active' ? isTicketActive(t.status) : !isTicketActive(t.status)));
}

export function SupportTicketsPage() {
  const [tickets, setTickets] = useState<SupportTicketSummary[]>([]);
  const [tab, setTab] = useState<SupportTicketsTab>('active');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const apiReady = isSupportApiAvailable();

  useEffect(() => {
    if (!apiReady) {
      setLoading(false);
      return;
    }
    fetchSupportTickets()
      .then((r) => setTickets(r.tickets))
      .catch((e) => setError(e instanceof Error ? e.message : 'Ошибка'))
      .finally(() => setLoading(false));
  }, [apiReady]);

  const activeCount = useMemo(() => tickets.filter((t) => isTicketActive(t.status)).length, [tickets]);
  const closedCount = useMemo(() => tickets.filter((t) => !isTicketActive(t.status)).length, [tickets]);
  const visible = useMemo(() => filterTickets(tickets, tab), [tickets, tab]);

  if (!apiReady) {
    return (
      <div className="min-w-0">
        <SupportTicketsPageHeader />
        <p className="mt-8 text-[14px] text-[#6B7280]">Требуется VITE_API_URL для загрузки запросов.</p>
      </div>
    );
  }

  return (
    <div className="min-w-0">
      <SupportTicketsPageHeader />

      <SupportTicketsTabs
        active={tab}
        onChange={setTab}
        activeCount={activeCount}
        closedCount={closedCount}
      />

      {error ? (
        <p className="mt-6 rounded-[12px] bg-[#FEF2F2] px-4 py-3 text-[13px] text-[#B91C1C]" role="alert">
          {error}
        </p>
      ) : null}

      {loading ? (
        <div className="mt-8">
          <SettingsSkeleton rows={4} />
        </div>
      ) : visible.length === 0 ? (
        <SupportTicketsEmptyState
          title={tab === 'active' ? 'Нет активных тикетов' : 'Нет закрытых тикетов'}
        >
          {tab === 'active' ? (
            <>
              Сейчас у вас нет открытых запросов. Нужна помощь?{' '}
              <Link to={MASTER_SETTINGS_SUPPORT_CONTACT_PATH} className={supportTicketsLinkClass}>
                Создать обращение
              </Link>
              .
            </>
          ) : (
            <>
              Закрытые запросы появятся здесь после решения обращения.{' '}
              <Link to={MASTER_SETTINGS_SUPPORT_CONTACT_PATH} className={supportTicketsLinkClass}>
                Создать обращение
              </Link>
              .
            </>
          )}
        </SupportTicketsEmptyState>
      ) : (
        <ul className="mt-2 divide-y divide-[#EBEBEB]">
          {visible.map((t) => {
            const st = TICKET_STATUS[t.status] ?? { label: t.status, tone: 'neutral' as const };
            return (
              <li key={t.id}>
                <Link
                  to={`${MASTER_SETTINGS_SUPPORT_PATH}/tickets/${encodeURIComponent(t.ticketCode)}`}
                  className="flex items-start justify-between gap-4 py-5 no-underline transition hover:bg-[#FAFAFA] sm:items-center"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-[15px] font-bold text-[#111827]">{t.subject}</p>
                    <p className="mt-1 font-mono text-[12px] text-[#9CA3AF]">{t.ticketCode}</p>
                    <p className="mt-1 text-[13px] text-[#9CA3AF]">
                      {formatTicketWhen(t.updatedAt)} · {ticketSeverityLabel(t.severity)}
                    </p>
                  </div>
                  <span className="shrink-0 text-[13px] font-medium text-[#6B7280]">{st.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
