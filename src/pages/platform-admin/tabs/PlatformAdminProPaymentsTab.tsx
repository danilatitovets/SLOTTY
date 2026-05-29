import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  approveProPaymentRequest,
  getProPaymentRequests,
  rejectProPaymentRequest,
} from '../api/platformAdminApi';
import type { ProManualPaymentRequestAdmin } from '../api/platformAdmin.types';
import { PlatformAdminToolbar } from '../shared/PlatformAdminToolbar';
import {
  ConfirmModal,
  PlatformAdminCard,
  PlatformAdminEmpty,
  PlatformAdminError,
  PlatformAdminLoading,
} from '../shared/PlatformAdminSharedUi';
import { PlatformAdminLoadMore } from '../shared/PlatformAdminLoadMore';
import { paGhostBtn, paInput, paPrimaryBtn } from '../platformAdminTheme';
import { labelBillingPeriod } from '../platformAdminLabels';

type StatusFilter = 'all' | 'pending' | 'approved' | 'rejected' | 'cancelled';

const FILTERS: { id: StatusFilter; label: string }[] = [
  { id: 'pending', label: 'На проверке' },
  { id: 'approved', label: 'Одобрены' },
  { id: 'rejected', label: 'Отклонены' },
  { id: 'all', label: 'Все' },
];

const REJECT_PRESETS = [
  'Платёж не найден',
  'Неверные данные',
  'Не удалось сопоставить оплату',
];

function money(amount: number | null | undefined, currency = 'BYN'): string {
  if (amount == null) return '—';
  return `${amount.toLocaleString('ru-RU', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ${currency}`;
}

function feeCoveredLabel(value: string): string {
  if (value === 'slotty') return 'SLOTTY';
  return value;
}

function StatusBadge({ status }: { status: ProManualPaymentRequestAdmin['status'] }) {
  const map: Record<ProManualPaymentRequestAdmin['status'], string> = {
    pending: 'bg-[#FEF3C7] text-[#92400E]',
    approved: 'bg-[#D1FAE5] text-[#065F46]',
    rejected: 'bg-[#FEE2E2] text-[#991B1B]',
    cancelled: 'bg-[#F3F4F6] text-[#4B5563]',
  };
  const labels: Record<ProManualPaymentRequestAdmin['status'], string> = {
    pending: 'На проверке',
    approved: 'Одобрена',
    rejected: 'Отклонена',
    cancelled: 'Отменена',
  };
  return (
    <span className={`rounded-full px-3 py-1 text-[12px] font-bold uppercase tracking-wide ${map[status]}`}>
      {labels[status]}
    </span>
  );
}

export function PlatformAdminProPaymentsTab() {
  const [filter, setFilter] = useState<StatusFilter>('pending');
  const [items, setItems] = useState<ProManualPaymentRequestAdmin[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [approveId, setApproveId] = useState<string | null>(null);
  const [receivedAmount, setReceivedAmount] = useState('');
  const [adminNote, setAdminNote] = useState('');
  const [taxReceiptCreated, setTaxReceiptCreated] = useState(false);
  const [taxReceiptNote, setTaxReceiptNote] = useState('');

  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const approveRequest = useMemo(
    () => items.find((x) => x.id === approveId) ?? null,
    [approveId, items],
  );

  const receivedWarning = useMemo(() => {
    if (!approveRequest) return null;
    const received = Number(receivedAmount.replace(',', '.'));
    if (!Number.isFinite(received) || received <= 0) return null;
    if (received < approveRequest.tariffAmount) {
      return 'Фактически поступившая сумма меньше тарифа. Комиссия будет учтена как покрытая SLOTTY.';
    }
    return null;
  }, [approveRequest, receivedAmount]);

  const load = useCallback(async (offset = 0) => {
    const append = offset > 0;
    if (append) setLoadingMore(true);
    else setLoading(true);
    setError(null);
    try {
      const res = await getProPaymentRequests(filter, { offset });
      setTotal(res.total);
      setItems((prev) => (append ? [...prev, ...res.requests] : res.requests));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [filter]);

  useEffect(() => {
    void load(0);
  }, [load]);

  function openApprove(req: ProManualPaymentRequestAdmin) {
    setApproveId(req.id);
    setReceivedAmount(req.declaredPaidAmount ? String(req.declaredPaidAmount) : '');
    setAdminNote('');
    setTaxReceiptCreated(false);
    setTaxReceiptNote('');
  }

  async function confirmApprove() {
    if (!approveId) return;
    setBusyId(approveId);
    try {
      const parsed = receivedAmount.trim()
        ? Number(receivedAmount.replace(',', '.'))
        : null;
      await approveProPaymentRequest(approveId, {
        receivedAmount: parsed != null && Number.isFinite(parsed) ? parsed : null,
        adminNote: adminNote.trim() || null,
        taxReceiptCreated,
        taxReceiptNote: taxReceiptNote.trim() || null,
      });
      setApproveId(null);
      await load(0);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка одобрения');
    } finally {
      setBusyId(null);
    }
  }

  async function confirmReject() {
    if (!rejectId || rejectReason.trim().length < 5) return;
    setBusyId(rejectId);
    try {
      await rejectProPaymentRequest(rejectId, { rejectionReason: rejectReason.trim() });
      setRejectId(null);
      setRejectReason('');
      await load(0);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка отклонения');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <p className="mb-4 rounded-2xl bg-[#F9FAFB] px-4 py-3 text-[14px] leading-relaxed text-[#374151]">
        После подтверждения оплаты сформируйте чек в Профдоход вручную и отметьте это в заявке.
      </p>

      <PlatformAdminToolbar
        resultCount={loading ? undefined : total}
        filterGroups={[
          {
            label: 'Статус',
            chips: FILTERS.map((f) => ({
              id: f.id,
              label: f.label,
              active: filter === f.id,
              onClick: () => setFilter(f.id),
            })),
          },
        ]}
      />

      {loading ? <PlatformAdminLoading /> : null}
      {error ? <PlatformAdminError message={error} onRetry={() => void load(0)} /> : null}

      {!loading && !error && items.length === 0 ? (
        <PlatformAdminEmpty
          title={filter === 'pending' ? 'Новых заявок нет' : 'Заявок не найдено'}
          text={
            filter === 'pending'
              ? 'Когда мастер отправит заявку на оплату Pro, она появится здесь.'
              : 'Попробуйте другой фильтр.'
          }
        />
      ) : null}

      {!loading && !error ? (
        <div className="space-y-4">
          {items.map((req) => (
            <PlatformAdminCard key={req.id} className="space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-[17px] font-bold text-[#111827]">{req.masterName}</h3>
                  <p className="mt-0.5 text-[14px] font-semibold text-[#374151]">{req.payerFullName}</p>
                  <a
                    href={req.profileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 inline-block text-[13px] font-semibold text-[#ff5f7a] hover:underline"
                  >
                    Профиль мастера →
                  </a>
                </div>
                <StatusBadge status={req.status} />
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <Field label="Сумма тарифа" value={money(req.tariffAmount, req.currency)} />
                <Field label="Указано мастером" value={money(req.declaredPaidAmount, req.currency)} />
                <Field label="Фактически поступило" value={money(req.receivedAmount, req.currency)} />
                <Field label="Комиссия / разница" value={money(req.bankFeeAmount, req.currency)} />
                <Field label="Покрывает комиссию" value={feeCoveredLabel(req.feeCoveredBy)} />
                <Field
                  label="Период"
                  value={labelBillingPeriod(req.billingPeriod)}
                />
                <Field label="Дата оплаты" value={req.paidAt ?? '—'} />
                <Field
                  label="Чек в Профдоход"
                  value={req.taxReceiptCreated ? 'Да' : 'Нет'}
                />
                <Field label="Заметка по чеку" value={req.taxReceiptNote ?? '—'} />
              </div>

              <div className="rounded-2xl bg-[#f6f7fb] px-4 py-3">
                <p className="text-[12px] font-semibold uppercase tracking-wide text-[#9CA3AF]">
                  Комментарий мастера
                </p>
                <p className="mt-1 whitespace-pre-wrap text-[15px] font-semibold text-[#111827]">
                  {req.paymentComment}
                </p>
              </div>

              {req.receiptUrl || req.receiptFilePath ? (
                <a
                  href={req.receiptUrl ?? '#'}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[14px] font-semibold text-[#ff5f7a] hover:underline"
                >
                  Открыть чек / скрин →
                </a>
              ) : null}

              {req.rejectionReason ? (
                <p className="text-[14px] text-[#991B1B]">Причина отказа: {req.rejectionReason}</p>
              ) : null}

              {req.status === 'pending' ? (
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={busyId === req.id}
                    className={paPrimaryBtn}
                    onClick={() => openApprove(req)}
                  >
                    Одобрить
                  </button>
                  <button
                    type="button"
                    disabled={busyId === req.id}
                    className={paGhostBtn}
                    onClick={() => {
                      setRejectId(req.id);
                      setRejectReason('');
                    }}
                  >
                    Отклонить
                  </button>
                </div>
              ) : null}
            </PlatformAdminCard>
          ))}

          <PlatformAdminLoadMore
            loadedCount={items.length}
            total={total}
            loading={loadingMore}
            onLoadMore={() => void load(items.length)}
          />
        </div>
      ) : null}

      <ConfirmModal
        open={Boolean(approveId)}
        title="Одобрить заявку на Pro"
        confirmLabel="Одобрить и активировать Pro"
        busy={Boolean(busyId && approveId)}
        onClose={() => setApproveId(null)}
        onConfirm={() => void confirmApprove()}
      >
        <div className="space-y-3 text-left">
          <label className="block space-y-1">
            <span className="text-[13px] font-semibold text-[#374151]">Фактически поступило</span>
            <input
              value={receivedAmount}
              onChange={(e) => setReceivedAmount(e.target.value)}
              className={paInput}
              inputMode="decimal"
              placeholder={approveRequest ? String(approveRequest.tariffAmount) : ''}
            />
          </label>
          {receivedWarning ? (
            <p className="rounded-xl bg-[#FFFBEB] px-3 py-2 text-[13px] font-semibold text-[#92400E]">
              {receivedWarning}
            </p>
          ) : null}
          <label className="block space-y-1">
            <span className="text-[13px] font-semibold text-[#374151]">Заметка админа</span>
            <textarea
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              className={`${paInput} min-h-[80px]`}
            />
          </label>
          <label className="flex items-center gap-2 text-[14px] text-[#374151]">
            <input
              type="checkbox"
              checked={taxReceiptCreated}
              onChange={(e) => setTaxReceiptCreated(e.target.checked)}
            />
            Чек в Профдоход сформирован
          </label>
          <label className="block space-y-1">
            <span className="text-[13px] font-semibold text-[#374151]">Номер / заметка по чеку</span>
            <input
              value={taxReceiptNote}
              onChange={(e) => setTaxReceiptNote(e.target.value)}
              className={paInput}
            />
          </label>
        </div>
      </ConfirmModal>

      <ConfirmModal
        open={Boolean(rejectId)}
        title="Отклонить заявку"
        confirmLabel="Отклонить"
        busy={Boolean(busyId && rejectId)}
        onClose={() => setRejectId(null)}
        onConfirm={() => void confirmReject()}
      >
        <div className="space-y-3 text-left">
          <div className="flex flex-wrap gap-2">
            {REJECT_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                className={paGhostBtn}
                onClick={() => setRejectReason(preset)}
              >
                {preset}
              </button>
            ))}
          </div>
          <label className="block space-y-1">
            <span className="text-[13px] font-semibold text-[#374151]">Причина отказа *</span>
            <textarea
              required
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className={`${paInput} min-h-[90px]`}
            />
          </label>
        </div>
      </ConfirmModal>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-[#f6f7fb] px-4 py-3">
      <p className="text-[12px] font-semibold uppercase tracking-wide text-[#9CA3AF]">{label}</p>
      <p className="mt-1 text-[15px] font-semibold text-[#111827]">{value}</p>
    </div>
  );
}
