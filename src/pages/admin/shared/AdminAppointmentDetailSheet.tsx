import { useCallback, useEffect, useState } from 'react';
import { fetchMasterAppointmentByVoucher } from '../../../features/appointments/api/bookingByVoucher';
import type { DemoMasterAppointment } from '../../../features/master/model/demoMasterAppointments';
import {
  appointmentStatusLabel,
  statusHint,
} from '../../../features/appointments/appointmentStatus';
import {
  patchMasterAppointmentCancel,
  patchMasterAppointmentClientArrived,
  patchMasterAppointmentConfirm,
  patchMasterAppointmentComplete,
  patchMasterAppointmentNoShow,
  patchMasterAppointmentStart,
} from '../../../features/admin/api/masterCabinetApi';
import { masterDispute } from '../../../features/appointments/api/bookingLifecycleApi';
import { afterBookingMutation } from '../../../features/appointments/bookingDataSync';
import { formatBynRu, formatDdMmYyyy } from '../overview/overviewFormat';
import { AppointmentsClientAvatar } from '../appointments/AppointmentsClientAvatar';
import {
  formatDurationMinutes,
  formatVisitPlace,
} from '../appointments/appointmentsFormat';
import { AdminBottomSheet } from './AdminBottomSheet';
import {
  catalogSheetField,
  catalogSheetLabel,
  catalogSheetPrimaryBtn,
  catalogSheetSecondaryBtn,
  catalogSheetTitle,
} from './adminCatalogSheetTheme';

type Props = {
  appointment: DemoMasterAppointment | null;
  onClose: () => void;
  useLiveApi?: boolean;
  onAfterAction?: () => void | Promise<void>;
  actionsDisabled?: boolean;
};

type PendingAction =
  | { kind: 'confirm' }
  | { kind: 'reject' }
  | { kind: 'client_arrived' }
  | { kind: 'no_show' }
  | { kind: 'start' }
  | { kind: 'mark_completed' }
  | { kind: 'cancel' }
  | { kind: 'dispute' };

const CANCEL_CATEGORIES = [
  { id: 'client_requested', label: 'Клиент попросил отменить' },
  { id: 'master_unavailable', label: 'Мастер не может принять' },
  { id: 'booking_error', label: 'Ошибка в записи' },
  { id: 'other', label: 'Другое' },
] as const;

function statusBadgeClass(status: DemoMasterAppointment['status']): string {
  switch (status) {
    case 'pending':
      return 'bg-[#FFF4E8] text-[#B45309]';
    case 'confirmed':
    case 'client_arrived':
    case 'in_progress':
    case 'master_marked_completed':
    case 'client_confirmed_completed':
      return 'bg-[#ECFDF5] text-[#16A34A]';
    case 'disputed':
      return 'bg-[#FEF2F2] text-[#B91C1C]';
    case 'completed':
      return 'bg-[#EEF2FF] text-[#4F46E5]';
    case 'no_show':
      return 'bg-[#FEF2F2] text-[#EF4444]';
    case 'cancelled':
      return 'bg-[#FEF2F2] text-[#EF4444]';
    default:
      return 'bg-[#EBEBEB] text-[#6B7280]';
  }
}

function bookingSourceLabel(source?: string | null): string {
  if (!source) return 'Сайт';
  if (source === 'telegram') return 'Telegram';
  if (source === 'google') return 'Google';
  if (source === 'email') return 'Email';
  return source;
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 first:pt-0 last:pb-0">
      <span className="shrink-0 text-[13px] font-medium text-[#6B7280]">{label}</span>
      <span className="min-w-0 text-right text-[14px] font-semibold leading-snug text-[#111827]">
        {value}
      </span>
    </div>
  );
}

function ClientWarnings({ appointment }: { appointment: DemoMasterAppointment }) {
  const stats = appointment.clientStats;
  if (!stats) return null;
  const items: string[] = [];
  if (stats.isFirstTime) items.push('Клиент впервые');
  const cancels = stats.cancellationsByClient + stats.cancellationsByMaster;
  if (cancels > 0) items.push(`Было ${cancels} отмен`);
  if (stats.noShows > 0) items.push(`${stats.noShows} раз не приходил`);
  if (!items.length) return null;
  return (
    <ul className="space-y-1 rounded-[10px] bg-[#FFF4F6] px-3 py-2.5 text-[13px] font-medium text-[#B45309]">
      {items.map((t) => (
        <li key={t}>{t}</li>
      ))}
    </ul>
  );
}

function ContactBlock({ appointment }: { appointment: DemoMasterAppointment }) {
  const phone = appointment.contact?.match(/^\+?\d/) ? appointment.contact : null;
  const tg = appointment.clientTelegramUsername;
  const email = appointment.clientEmail;

  return (
    <div className="space-y-2 rounded-[10px] bg-white px-4 py-3 ring-1 ring-[#EEEEEE]">
      <p className="text-[12px] font-bold uppercase tracking-wide text-[#9CA3AF]">Контакты</p>
      {phone ? (
        <a href={`tel:${phone.replace(/\s/g, '')}`} className="block text-[15px] font-semibold text-[#111827]">
          {phone}
        </a>
      ) : null}
      {tg ? (
        <a
          href={`https://t.me/${tg.replace(/^@+/, '')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex rounded-full bg-[#E8F4FC] px-3 py-1.5 text-[13px] font-semibold text-[#0088CC]"
        >
          Написать в Telegram
        </a>
      ) : null}
      {email ? (
        <a href={`mailto:${email}`} className="block text-[14px] font-medium text-[#6B7280]">
          {email}
        </a>
      ) : null}
      {!phone && !tg && !email ? (
        <p className="text-[13px] text-[#EF4444]">Контакт не указан — свяжитесь через поддержку</p>
      ) : null}
    </div>
  );
}

export function AdminAppointmentDetailSheet({
  appointment,
  onClose,
  useLiveApi = false,
  onAfterAction,
  actionsDisabled,
}: Props) {
  const [pending, setPending] = useState<PendingAction | null>(null);
  const [reason, setReason] = useState('');
  const [comment, setComment] = useState('');
  const [cancelCategory, setCancelCategory] = useState<string>(CANCEL_CATEGORIES[0].id);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runApi = useCallback(
    async (fn: () => Promise<void>) => {
      setBusy(true);
      setError(null);
      try {
        await fn();
        setPending(null);
        setReason('');
        setComment('');
        afterBookingMutation();
        await onAfterAction?.();
        onClose();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Не удалось выполнить действие');
      } finally {
        setBusy(false);
      }
    },
    [onAfterAction, onClose],
  );

  const executePending = useCallback(async () => {
    if (!appointment || !pending) return;
    const id = appointment.id;
    if (!useLiveApi) {
      setPending(null);
      onClose();
      return;
    }
    switch (pending.kind) {
      case 'confirm':
        await runApi(() => patchMasterAppointmentConfirm(id));
        break;
      case 'reject':
        if (!reason.trim()) return;
        await runApi(() => patchMasterAppointmentCancel(id, reason.trim(), 'rejected_request'));
        break;
      case 'client_arrived':
        await runApi(() => patchMasterAppointmentClientArrived(id));
        break;
      case 'start':
        await runApi(() => patchMasterAppointmentStart(id));
        break;
      case 'mark_completed':
        await runApi(() => patchMasterAppointmentComplete(id));
        break;
      case 'dispute':
        if (!reason.trim()) return;
        await runApi(() => masterDispute(id, { reason: cancelCategory, comment: reason.trim() }));
        break;
      case 'no_show':
        await runApi(() => patchMasterAppointmentNoShow(id, comment.trim() || undefined));
        break;
      case 'cancel':
        if (!reason.trim()) return;
        await runApi(() => patchMasterAppointmentCancel(id, reason.trim(), cancelCategory));
        break;
      default:
        break;
    }
  }, [appointment, pending, reason, comment, cancelCategory, useLiveApi, runApi]);

  const [liveExtra, setLiveExtra] = useState<{
    timeline?: DemoMasterAppointment['timeline'];
    clientSignal?: DemoMasterAppointment['clientSignal'];
  } | null>(null);

  useEffect(() => {
    if (!appointment?.voucherNumber || !useLiveApi) {
      setLiveExtra(null);
      return;
    }
    let cancelled = false;
    void fetchMasterAppointmentByVoucher(appointment.voucherNumber)
      .then((row) => {
        if (cancelled) return;
        setLiveExtra({
          timeline: row.timeline,
          clientSignal: row.client_signal ?? undefined,
        });
      })
      .catch(() => {
        if (!cancelled) setLiveExtra(null);
      });
    return () => {
      cancelled = true;
    };
  }, [appointment?.voucherNumber, useLiveApi]);

  const statusKey = appointment?.dbStatus ?? appointment?.status ?? 'pending';
  const hint = appointment ? statusHint(statusKey) : '';
  const timeline = liveExtra?.timeline ?? appointment?.timeline;
  const clientSignal = liveExtra?.clientSignal ?? appointment?.clientSignal;

  const addressLine = (() => {
    if (!appointment) return null;
    const fmt = formatVisitPlace(appointment.addressShort);
    if (fmt === 'На дому' && appointment.addressShort?.trim()) {
      return appointment.addressShort.trim();
    }
    if (appointment.addressShort?.trim()) return appointment.addressShort.trim();
    if (fmt === 'В студии') return null;
    return null;
  })();

  const actionButtons = appointment ? (
    <div className="flex w-full flex-col gap-2">
      {appointment.status === 'pending' ? (
        <>
          <button
            type="button"
            disabled={actionsDisabled || busy}
            onClick={() => setPending({ kind: 'confirm' })}
            className={catalogSheetPrimaryBtn}
          >
            Подтвердить заявку
          </button>
          <button
            type="button"
            disabled={actionsDisabled || busy}
            onClick={() => setPending({ kind: 'reject' })}
            className={`${catalogSheetPrimaryBtn} !bg-[#FEF2F2] !text-[#EF4444]`}
          >
            Отклонить
          </button>
        </>
      ) : null}
      {appointment.status === 'confirmed' ? (
        <>
          <button
            type="button"
            disabled={actionsDisabled || busy}
            onClick={() => setPending({ kind: 'client_arrived' })}
            className={catalogSheetPrimaryBtn}
          >
            Клиент пришёл
          </button>
          <button
            type="button"
            disabled={actionsDisabled || busy}
            onClick={() => setPending({ kind: 'no_show' })}
            className={catalogSheetSecondaryBtn}
          >
            Клиент не пришёл
          </button>
          <button
            type="button"
            disabled={actionsDisabled || busy}
            onClick={() => setPending({ kind: 'cancel' })}
            className={`${catalogSheetSecondaryBtn} !text-[#EF4444]`}
          >
            Отменить запись
          </button>
        </>
      ) : null}
      {appointment.status === 'client_arrived' ? (
        <>
          <button
            type="button"
            disabled={actionsDisabled || busy}
            onClick={() => setPending({ kind: 'start' })}
            className={catalogSheetPrimaryBtn}
          >
            Начать визит
          </button>
          <button
            type="button"
            disabled={actionsDisabled || busy}
            onClick={() => setPending({ kind: 'cancel' })}
            className={catalogSheetSecondaryBtn}
          >
            Отменить
          </button>
        </>
      ) : null}
      {appointment.status === 'master_marked_completed' ? (
        <p className="mb-2 text-[13px] font-medium text-[#6B7280]">Ожидаем подтверждение клиента</p>
      ) : null}
      {appointment.status === 'in_progress' || appointment.status === 'client_arrived' ? (
        <>
          <button
            type="button"
            disabled={actionsDisabled || busy}
            onClick={() => setPending({ kind: 'mark_completed' })}
            className={catalogSheetPrimaryBtn}
          >
            Услуга выполнена
          </button>
          <button
            type="button"
            disabled={actionsDisabled || busy}
            onClick={() => setPending({ kind: 'dispute' })}
            className={catalogSheetSecondaryBtn}
          >
            Есть проблема
          </button>
          <button
            type="button"
            disabled={actionsDisabled || busy}
            onClick={() => setPending({ kind: 'cancel' })}
            className={`${catalogSheetSecondaryBtn} !text-[#EF4444]`}
          >
            Отменить визит
          </button>
        </>
      ) : null}
      <button type="button" onClick={onClose} className={catalogSheetSecondaryBtn}>
        Закрыть
      </button>
    </div>
  ) : undefined;

  const confirmModal = pending ? (
    <AdminBottomSheet
      variant="catalog"
      open
      onClose={() => setPending(null)}
      title={
        pending.kind === 'confirm'
          ? 'Подтвердить заявку?'
          : pending.kind === 'reject'
            ? 'Отклонить заявку?'
            : pending.kind === 'no_show'
              ? 'Отметить неявку?'
              : pending.kind === 'mark_completed'
                ? 'Отметить услугу выполненной?'
                : pending.kind === 'dispute'
                  ? 'Сообщить о проблеме?'
                  : pending.kind === 'cancel'
                  ? 'Отменить запись?'
                  : 'Подтвердить действие?'
      }
      footer={
        <div className="flex w-full flex-col gap-2">
          <button type="button" onClick={() => setPending(null)} className={catalogSheetSecondaryBtn}>
            Назад
          </button>
          <button
            type="button"
            disabled={
              busy ||
              ((pending.kind === 'reject' || pending.kind === 'cancel') && !reason.trim())
            }
            onClick={() => void executePending()}
            className={catalogSheetPrimaryBtn}
          >
            Подтвердить
          </button>
        </div>
      }
    >
      <div className="space-y-3">
        {pending.kind === 'no_show' ? (
          <p className="text-[14px] text-[#6B7280]">
            Клиент получит уведомление о неявке, если уведомления включены. Запись уйдёт в историю.
          </p>
        ) : null}
        {pending.kind === 'mark_completed' ? (
          <p className="text-[14px] text-[#6B7280]">
            Клиент получит запрос подтвердить выполнение. Запись завершится после подтверждения клиента
            или автоматически через 24 часа.
          </p>
        ) : null}
        {pending.kind === 'dispute' ? (
          <>
            <label className="block">
              <span className={catalogSheetLabel}>Причина</span>
              <select
                value={cancelCategory}
                onChange={(e) => setCancelCategory(e.target.value)}
                className={catalogSheetField}
              >
                <option value="client_no_show">Клиент не пришёл</option>
                <option value="client_late">Клиент опоздал</option>
                <option value="other">Другое</option>
              </select>
            </label>
            <label className="block">
              <span className={catalogSheetLabel}>Комментарий *</span>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                className={`${catalogSheetField} min-h-[5rem] resize-none`}
              />
            </label>
          </>
        ) : null}
        {(pending.kind === 'reject' || pending.kind === 'cancel') && (
          <>
            {pending.kind === 'cancel' ? (
              <label className="block">
                <span className={catalogSheetLabel}>Причина</span>
                <select
                  value={cancelCategory}
                  onChange={(e) => setCancelCategory(e.target.value)}
                  className={catalogSheetField}
                >
                  {CANCEL_CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
            <label className="block">
              <span className={catalogSheetLabel}>Комментарий *</span>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                className={`${catalogSheetField} min-h-[5rem] resize-none`}
              />
            </label>
          </>
        )}
        {pending.kind === 'no_show' ? (
          <label className="block">
            <span className={catalogSheetLabel}>Комментарий (необязательно)</span>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={2}
              className={`${catalogSheetField} min-h-[4rem] resize-none`}
            />
          </label>
        ) : null}
        {error ? (
          <p className="rounded-[10px] bg-[#FEF2F2] px-3 py-2 text-[13px] font-semibold text-[#EF4444]">
            {error}
          </p>
        ) : null}
      </div>
    </AdminBottomSheet>
  ) : null;

  return (
    <>
      <AdminBottomSheet
        variant="catalog"
        open={Boolean(appointment)}
        onClose={onClose}
        headerContent={
          appointment ? (
            <div className="min-w-0 pr-2">
              <div className="flex flex-wrap items-center gap-2">
                <h2 id="admin-sheet-title" className={`${catalogSheetTitle} min-w-0 break-words`}>
                  Запись
                </h2>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${statusBadgeClass(appointment.status)}`}
                >
                  {appointmentStatusLabel(statusKey)}
                </span>
              </div>
              <p className="mt-1 text-[13px] font-medium text-[#6B7280]">
                {formatDdMmYyyy(appointment.date)} · {appointment.timeLabel ?? appointment.time}
              </p>
            </div>
          ) : undefined
        }
        footer={actionButtons}
      >
        {appointment ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <AppointmentsClientAvatar name={appointment.clientName} size="md" />
              <div className="min-w-0">
                <p className="text-[17px] font-bold text-[#111827]">{appointment.clientName}</p>
                <p className="text-[13px] text-[#6B7280]">
                  Источник: {bookingSourceLabel(appointment.bookingSource)}
                </p>
              </div>
            </div>

            <ClientWarnings appointment={appointment} />

            {clientSignal?.kind ? (
              <div className="rounded-[12px] bg-[#ECFDF5] px-4 py-3 ring-1 ring-[#16A34A]/20">
                <p className="text-[14px] font-bold text-[#166534]">
                  {clientSignal.kind === 'on_the_way'
                    ? 'Клиент в пути'
                    : clientSignal.kind === 'running_late'
                      ? clientSignal.lateMinutes
                        ? `Клиент опаздывает на ${clientSignal.lateMinutes} мин`
                        : 'Клиент опаздывает'
                      : 'Клиент сообщил, что на месте'}
                </p>
                {clientSignal.comment ? (
                  <p className="mt-1 text-[13px] text-[#374151]">{clientSignal.comment}</p>
                ) : null}
              </div>
            ) : null}

            <ContactBlock appointment={appointment} />

            {appointment.clientNote ? (
              <p className="rounded-[10px] bg-[#F5F5F5] px-3 py-2.5 text-[14px] leading-relaxed text-[#374151]">
                {appointment.clientNote}
              </p>
            ) : null}

            <div className="divide-y divide-[#EEEEEE] rounded-[10px] bg-white px-4 py-1 ring-1 ring-[#EEEEEE]">
              <SummaryRow label="Услуга" value={appointment.serviceTitle} />
              <SummaryRow
                label="Длительность"
                value={formatDurationMinutes(appointment.durationMinutes, appointment.serviceTitle)}
              />
              <SummaryRow label="Цена" value={formatBynRu(appointment.priceByn)} />
              <SummaryRow label="Формат" value={formatVisitPlace(appointment.addressShort)} />
              {addressLine ? <SummaryRow label="Адрес" value={addressLine} /> : null}
            </div>

            <div className="rounded-[10px] bg-[#FFF4F6] px-4 py-3">
              <p className="text-[12px] font-bold uppercase tracking-wide text-[#F47C8C]">Дальше</p>
              <p className="mt-1 text-[14px] font-medium text-[#111827]">{hint}</p>
            </div>

            {appointment.cancelReason ? (
              <p className="text-[13px] text-[#6B7280]">
                Причина отмены: <span className="font-semibold text-[#111827]">{appointment.cancelReason}</span>
              </p>
            ) : null}

            {timeline?.length ? (
              <div className="space-y-2">
                <p className="text-[12px] font-bold uppercase tracking-wide text-[#9CA3AF]">История</p>
                <ul className="space-y-1.5">
                  {timeline.map((ev) => (
                    <li key={`${ev.eventType}-${ev.createdAt}`} className="text-[13px] text-[#374151]">
                      <span className="font-semibold">{ev.label}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {appointment.clientReferencePhotoUrl ? (
              <a
                href={appointment.clientReferencePhotoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block overflow-hidden rounded-[12px] ring-1 ring-[#EEEEEE]"
              >
                <img src={appointment.clientReferencePhotoUrl} alt="" className="max-h-48 w-full object-cover" />
              </a>
            ) : null}
          </div>
        ) : null}
      </AdminBottomSheet>
      {confirmModal}
    </>
  );
}
