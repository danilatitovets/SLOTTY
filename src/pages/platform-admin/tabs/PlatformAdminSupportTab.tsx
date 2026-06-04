import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../../features/auth/AuthProvider';
import {
  assignPlatformSupportTicket,
  getPlatformSupportTicket,
  getPlatformSupportTickets,
  replyPlatformSupportTicket,
  updatePlatformSupportTicketStatus,
} from '../api/platformAdminApi';
import type { SupportTicketAdmin, SupportTicketAdminDetail } from '../api/platformAdmin.types';
import { PlatformAdminToolbar } from '../shared/PlatformAdminToolbar';
import {
  PlatformAdminCard,
  PlatformAdminEmpty,
  PlatformAdminError,
  PlatformAdminLoading,
} from '../shared/PlatformAdminSharedUi';
import { paGhostBtn, paInput, paPrimaryBtn } from '../platformAdminTheme';

type StatusFilter = 'unresolved' | 'all' | 'OPEN' | 'IN_PROGRESS' | 'WAITING_USER' | 'RESOLVED' | 'CLOSED';
type SeverityFilter = 'all' | 'low' | 'medium' | 'high' | 'critical';

const FILTERS: { id: StatusFilter; label: string }[] = [
  { id: 'unresolved', label: 'Активные' },
  { id: 'OPEN', label: 'Открыты' },
  { id: 'IN_PROGRESS', label: 'В работе' },
  { id: 'WAITING_USER', label: 'Ждём мастера' },
  { id: 'all', label: 'Все' },
];

const SEVERITY_FILTERS: { id: SeverityFilter; label: string }[] = [
  { id: 'all', label: 'Любая срочность' },
  { id: 'critical', label: 'Critical' },
  { id: 'high', label: 'High' },
  { id: 'medium', label: 'Medium' },
  { id: 'low', label: 'Low' },
];

const STATUSES = ['OPEN', 'IN_PROGRESS', 'WAITING_USER', 'RESOLVED', 'CLOSED'] as const;

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function PlatformAdminSupportTab() {
  const { profile } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [filter, setFilter] = useState<StatusFilter>('unresolved');
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>('all');
  const [search, setSearch] = useState('');
  const [items, setItems] = useState<SupportTicketAdmin[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [detail, setDetail] = useState<SupportTicketAdminDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [reply, setReply] = useState('');
  const [busy, setBusy] = useState(false);

  const ticketFromUrl = searchParams.get('ticket');

  useEffect(() => {
    if (ticketFromUrl) setSelectedCode(ticketFromUrl);
  }, [ticketFromUrl]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getPlatformSupportTickets({
        status: filter,
        severity: severityFilter === 'all' ? undefined : severityFilter,
      });
      setItems(res.tickets);
      setTotal(res.total);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка');
    } finally {
      setLoading(false);
    }
  }, [filter, severityFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (t) =>
        t.ticketCode.toLowerCase().includes(q) ||
        t.subject.toLowerCase().includes(q) ||
        (t.masterName ?? '').toLowerCase().includes(q) ||
        (t.userEmail ?? '').toLowerCase().includes(q),
    );
  }, [items, search]);

  useEffect(() => {
    if (!selectedCode) {
      setDetail(null);
      return;
    }
    setDetailLoading(true);
    getPlatformSupportTicket(selectedCode)
      .then(setDetail)
      .catch((e) => setError(e instanceof Error ? e.message : 'Ошибка'))
      .finally(() => setDetailLoading(false));
  }, [selectedCode]);

  function selectTicket(code: string) {
    setSelectedCode(code);
    setSearchParams({ ticket: code });
  }

  async function sendReply() {
    if (!selectedCode || !reply.trim()) return;
    setBusy(true);
    try {
      await replyPlatformSupportTicket(selectedCode, reply.trim());
      setReply('');
      const d = await getPlatformSupportTicket(selectedCode);
      setDetail(d);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка');
    } finally {
      setBusy(false);
    }
  }

  async function changeStatus(status: (typeof STATUSES)[number]) {
    if (!selectedCode) return;
    setBusy(true);
    try {
      await updatePlatformSupportTicketStatus(selectedCode, status);
      const d = await getPlatformSupportTicket(selectedCode);
      setDetail(d);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка');
    } finally {
      setBusy(false);
    }
  }

  async function assignToSelf() {
    if (!selectedCode || !profile?.id) return;
    setBusy(true);
    try {
      await assignPlatformSupportTicket(selectedCode, profile.id);
      const d = await getPlatformSupportTicket(selectedCode);
      setDetail(d);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <PlatformAdminToolbar
        resultCount={loading ? undefined : filteredItems.length}
        filterGroups={[
          {
            label: 'Статус',
            chips: FILTERS.map((f) => ({
              id: f.id,
              label: f.label,
              active: filter === f.id,
              onClick: () => {
                setFilter(f.id);
                setSelectedCode(null);
                setSearchParams({});
              },
            })),
          },
          {
            label: 'Срочность',
            chips: SEVERITY_FILTERS.map((f) => ({
              id: f.id,
              label: f.label,
              active: severityFilter === f.id,
              onClick: () => setSeverityFilter(f.id),
            })),
          },
        ]}
      />

      <div className="mb-4">
        <input
          className={`${paInput} max-w-md`}
          placeholder="Поиск: код, тема, мастер, email"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? <PlatformAdminLoading /> : null}
      {error ? <PlatformAdminError message={error} onRetry={() => void load()} /> : null}

      {!loading && !error && filteredItems.length === 0 ? (
        <PlatformAdminEmpty title="Обращений нет" text="Новые тикеты появятся здесь." />
      ) : null}

      {!loading && !error && filteredItems.length > 0 ? (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,340px)_1fr]">
          <ul className="space-y-2">
            {filteredItems.map((t) => (
              <li key={t.id}>
                <button
                  type="button"
                  onClick={() => selectTicket(t.ticketCode)}
                  className={`w-full rounded-[14px] border p-3 text-left transition ${
                    selectedCode === t.ticketCode
                      ? 'border-[#ff5f7a] bg-[#FFF8F9]'
                      : 'border-[#EAECEF] bg-white hover:border-[#FFD6DE]'
                  }`}
                >
                  <p className="font-mono text-[12px] font-bold text-[#ff5f7a]">{t.ticketCode}</p>
                  <p className="mt-1 text-[14px] font-semibold text-[#111827]">{t.subject}</p>
                  <p className="mt-1 text-[12px] text-[#6B7280]">
                    {t.masterName ?? '—'} · {t.severity} · {t.status}
                  </p>
                  <p className="mt-0.5 text-[11px] text-[#9CA3AF]">
                    {formatWhen(t.updatedAt)} · {t.plan ?? '—'}
                  </p>
                </button>
              </li>
            ))}
          </ul>

          <PlatformAdminCard>
            {detailLoading || !detail ? (
              <PlatformAdminLoading />
            ) : (
              <div className="space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h2 className="text-[18px] font-bold text-[#111827]">{detail.subject}</h2>
                    <p className="mt-1 text-[13px] text-[#6B7280]">
                      {detail.userEmail ?? '—'} · {detail.plan ?? '—'} · {detail.category} · {detail.severity}
                    </p>
                    <p className="mt-1 font-mono text-[12px] text-[#ff5f7a]">{detail.ticketCode}</p>
                    {detail.assignedTo ? (
                      <p className="mt-1 text-[12px] text-[#6B7280]">Назначен: {detail.assignedTo}</p>
                    ) : (
                      <p className="mt-1 text-[12px] text-[#9CA3AF]">Не назначен</p>
                    )}
                  </div>
                  <button
                    type="button"
                    className={paGhostBtn}
                    disabled={busy || !profile?.id || detail.assignedTo === profile.id}
                    onClick={() => void assignToSelf()}
                  >
                    Назначить на себя
                  </button>
                </div>
                {detail.relatedBookingCode ? (
                  <p className="text-[13px]">Запись: {detail.relatedBookingCode}</p>
                ) : null}
                {detail.relatedPaymentId ? (
                  <p className="text-[13px]">Платёж: {detail.relatedPaymentId}</p>
                ) : null}
                <p className="whitespace-pre-wrap rounded-[12px] bg-[#F6F7FB] p-3 text-[14px] text-[#374151]">
                  {detail.message}
                </p>
                {detail.attachments.length > 0 ? (
                  <p className="text-[13px] text-[#6B7280]">
                    Вложения: {detail.attachments.map((a) => a.fileName).join(', ')}
                  </p>
                ) : null}
                <div className="flex flex-wrap gap-2">
                  {STATUSES.map((s) => (
                    <button
                      key={s}
                      type="button"
                      disabled={busy || detail.status === s}
                      className={paGhostBtn}
                      onClick={() => void changeStatus(s)}
                    >
                      {s}
                    </button>
                  ))}
                </div>
                <div>
                  <p className="mb-2 text-[13px] font-semibold text-[#374151]">Переписка</p>
                  <ul className="max-h-48 space-y-2 overflow-y-auto">
                    {detail.events.map((ev) => (
                      <li key={ev.id} className="rounded-[10px] bg-[#F6F7FB] px-2 py-1.5 text-[13px]">
                        <span className="font-semibold text-[#9CA3AF]">
                          {ev.actorRole} · {ev.eventType} · {formatWhen(ev.createdAt)}
                        </span>
                        {ev.message ? <p className="mt-0.5">{ev.message}</p> : null}
                      </li>
                    ))}
                  </ul>
                </div>
                <textarea
                  className={paInput}
                  rows={3}
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  placeholder="Ответ поддержки"
                />
                <button type="button" className={paPrimaryBtn} disabled={busy || !reply.trim()} onClick={() => void sendReply()}>
                  Отправить ответ
                </button>
              </div>
            )}
          </PlatformAdminCard>
        </div>
      ) : null}
      {!loading && total > filteredItems.length ? (
        <p className="mt-3 text-[12px] text-[#9CA3AF]">
          Показано {filteredItems.length} из {total} (поиск на текущей странице)
        </p>
      ) : null}
    </div>
  );
}
