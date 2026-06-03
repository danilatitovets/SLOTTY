import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { PLATFORM_ADMIN_PAYMENTS_PATH } from '../../../app/paths';
import {
  getAdminPaymentDetail,
  listAdminPayments,
  type AdminPaymentRow,
} from '../../../features/payments/api/adminPaymentsApi';
import { PlatformAdminPageIntro } from '../shared/PlatformAdminPageIntro';
import { paCard, paFilterChip, paGhostBtn } from '../platformAdminTheme';

const STATUS_OPTIONS = [
  { id: 'all', label: 'Все' },
  { id: 'pending', label: 'Ожидание' },
  { id: 'success', label: 'Успех' },
  { id: 'failed', label: 'Ошибка' },
  { id: 'expired', label: 'Истёк' },
  { id: 'cancelled', label: 'Отмена' },
  { id: 'refunded', label: 'Возврат' },
] as const;

function statusBadge(status: string): string {
  switch (status) {
    case 'success':
      return 'bg-[#DCFCE7] text-[#166534]';
    case 'pending':
      return 'bg-[#FEF3C7] text-[#92400E]';
    case 'failed':
    case 'expired':
      return 'bg-[#FEE2E2] text-[#991B1B]';
    case 'refunded':
      return 'bg-[#E0E7FF] text-[#3730A3]';
    default:
      return 'bg-[#F3F4F6] text-[#374151]';
  }
}

function typeLabel(t: string): string {
  if (t === 'master_pro_plan') return 'Pro мастера';
  if (t === 'appointment_prepayment') return 'Предоплата записи';
  return t;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString('ru-RU', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function PaymentDetailView({ paymentId }: { paymentId: string }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<Awaited<ReturnType<typeof getAdminPaymentDetail>> | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getAdminPaymentDetail(paymentId)
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Ошибка загрузки');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [paymentId]);

  async function copyId() {
    try {
      await navigator.clipboard.writeText(paymentId);
    } catch {
      /* ignore */
    }
  }

  if (loading) {
    return <p className="text-[14px] text-[#6B7280]">Загрузка…</p>;
  }
  if (error || !data) {
    return <p className="text-[14px] text-red-600">{error ?? 'Не найдено'}</p>;
  }

  const p = data.payment;

  return (
    <div className="space-y-6">
      <Link to={PLATFORM_ADMIN_PAYMENTS_PATH} className="text-[14px] font-semibold text-[#ff5f7a] hover:underline">
        ← К списку платежей
      </Link>
      <div className={paCard + ' p-5 sm:p-6'}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-[20px] font-bold text-[#111827]">Платёж</h2>
            <p className="mt-1 font-mono text-[12px] text-[#6B7280]">{p.id}</p>
          </div>
          <button type="button" className={paGhostBtn} onClick={() => void copyId()}>
            Скопировать ID
          </button>
        </div>
        <dl className="mt-6 grid gap-3 sm:grid-cols-2">
          <div>
            <dt className="text-[12px] font-semibold text-[#9CA3AF]">Статус</dt>
            <dd className="mt-1">
              <span className={`inline-flex rounded-full px-2.5 py-1 text-[12px] font-semibold ${statusBadge(p.status)}`}>
                {p.status}
              </span>
            </dd>
          </div>
          <div>
            <dt className="text-[12px] font-semibold text-[#9CA3AF]">Сумма</dt>
            <dd className="mt-1 text-[15px] font-semibold">
              {p.amount} {p.currency}
            </dd>
          </div>
          <div>
            <dt className="text-[12px] font-semibold text-[#9CA3AF]">Тип</dt>
            <dd className="mt-1">{typeLabel(p.paymentType)}</dd>
          </div>
          <div>
            <dt className="text-[12px] font-semibold text-[#9CA3AF]">Провайдер</dt>
            <dd className="mt-1">{p.provider}</dd>
          </div>
          <div>
            <dt className="text-[12px] font-semibold text-[#9CA3AF]">Пользователь</dt>
            <dd className="mt-1">{p.userDisplayName ?? '—'}</dd>
            <dd className="text-[13px] text-[#6B7280]">{p.userEmail ?? ''}</dd>
          </div>
          <div>
            <dt className="text-[12px] font-semibold text-[#9CA3AF]">bePaid transaction</dt>
            <dd className="mt-1 font-mono text-[12px] break-all">{p.bepaidTransactionUid ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-[12px] font-semibold text-[#9CA3AF]">Создан</dt>
            <dd className="mt-1">{formatDate(p.createdAt)}</dd>
          </div>
          <div>
            <dt className="text-[12px] font-semibold text-[#9CA3AF]">Обновлён</dt>
            <dd className="mt-1">{formatDate(p.updatedAt)}</dd>
          </div>
        </dl>
        {p.errorMessage ? (
          <p className="mt-4 rounded-xl bg-[#FEF2F2] px-3 py-2 text-[13px] text-[#991B1B]">{p.errorMessage}</p>
        ) : null}
      </div>

      <div className={paCard + ' p-5'}>
        <h3 className="text-[16px] font-bold text-[#111827]">История статусов</h3>
        <ul className="mt-4 space-y-2">
          {data.events.map((ev) => (
            <li key={ev.id} className="rounded-xl border border-[#eef0f5] px-3 py-2 text-[13px]">
              <span className="font-semibold">{ev.toStatus}</span>
              {ev.fromStatus ? (
                <span className="text-[#6B7280]">
                  {' '}
                  ← {ev.fromStatus}
                </span>
              ) : null}
              <span className="ml-2 text-[#9CA3AF]">({ev.source})</span>
              <span className="block text-[12px] text-[#9CA3AF]">{formatDate(ev.createdAt)}</span>
            </li>
          ))}
        </ul>
      </div>

      {data.payment.providerPayload ? (
        <div className={paCard + ' p-5'}>
          <h3 className="text-[16px] font-bold text-[#111827]">Payload провайдера (без секретов)</h3>
          <pre className="mt-3 max-h-80 overflow-auto rounded-xl bg-[#f9fafb] p-3 text-[11px] leading-relaxed text-[#374151]">
            {JSON.stringify(data.payment.providerPayload, null, 2)}
          </pre>
        </div>
      ) : null}
    </div>
  );
}

export function PlatformAdminPaymentsTab() {
  const { paymentId } = useParams<{ paymentId?: string }>();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<AdminPaymentRow[]>([]);
  const [total, setTotal] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await listAdminPayments({
        status: statusFilter === 'all' ? undefined : statusFilter,
        page: 1,
        pageSize: 50,
      });
      setRows(r.payments);
      setTotal(r.total);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    if (!paymentId) void load();
  }, [load, paymentId]);

  if (paymentId) {
    return (
      <div>
        <PlatformAdminPageIntro />
        <PaymentDetailView paymentId={paymentId} />
      </div>
    );
  }

  return (
    <div>
      <PlatformAdminPageIntro />
      <p className="mb-4 text-[14px] text-[#6B7280]">
        Платежи bePaid. Источник статуса — webhook, не страницы success/fail.
      </p>

      <div className="mb-4 flex flex-wrap gap-2" role="tablist" aria-label="Статус платежа">
        {STATUS_OPTIONS.map((opt) => (
          <button
            key={opt.id}
            type="button"
            className={paFilterChip(statusFilter === opt.id)}
            onClick={() => setStatusFilter(opt.id)}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {error ? <p className="mb-4 text-[14px] text-red-600">{error}</p> : null}

      <div className={`${paCard} overflow-hidden`}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-left text-[13px]">
            <thead className="border-b border-[#eef0f5] bg-[#f9fafb] text-[12px] font-semibold text-[#6B7280]">
              <tr>
                <th className="px-4 py-3">ID / дата</th>
                <th className="px-4 py-3">Пользователь</th>
                <th className="px-4 py-3">Тип</th>
                <th className="px-4 py-3">Сумма</th>
                <th className="px-4 py-3">Статус</th>
                <th className="px-4 py-3">bePaid UID</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-[#6B7280]">
                    Загрузка…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-[#6B7280]">
                    Платежей пока нет. После тестового checkout они появятся здесь.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id} className="border-b border-[#eef0f5] hover:bg-[#fafafa]">
                    <td className="px-4 py-3">
                      <Link
                        to={`${PLATFORM_ADMIN_PAYMENTS_PATH}/${row.id}`}
                        className="font-mono text-[12px] font-semibold text-[#ff5f7a] hover:underline"
                      >
                        {row.id.slice(0, 8)}…
                      </Link>
                      <p className="text-[11px] text-[#9CA3AF]">{formatDate(row.createdAt)}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium">{row.userDisplayName ?? '—'}</p>
                      <p className="text-[11px] text-[#9CA3AF]">{row.userEmail ?? ''}</p>
                    </td>
                    <td className="px-4 py-3">{typeLabel(row.paymentType)}</td>
                    <td className="px-4 py-3 font-semibold">
                      {row.amount} {row.currency}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${statusBadge(row.status)}`}
                      >
                        {row.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-[#6B7280]">
                      {row.bepaidTransactionUid?.slice(0, 12) ?? '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <p className="border-t border-[#eef0f5] px-4 py-2 text-[12px] text-[#9CA3AF]">Всего: {total}</p>
      </div>
    </div>
  );
}
