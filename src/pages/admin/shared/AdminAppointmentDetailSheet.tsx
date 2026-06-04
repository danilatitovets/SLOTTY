import { useCallback, useEffect, useMemo, useState } from 'react';
import { HiEllipsisHorizontal, HiPhone } from 'react-icons/hi2';
import { fetchMasterAppointmentByVoucher } from '../../../features/appointments/api/bookingByVoucher';
import type { DemoMasterAppointment } from '../../../features/master/model/demoMasterAppointments';
import {
  buildMasterAppointmentActions,
  type MasterAppointmentAction,
  type MasterAppointmentActionId,
  type MasterAppointmentsTab,
  type MasterAppointmentLifecycleResult,
} from '../../../features/appointments/masterAppointmentLifecycle';
import {
  patchMasterAppointmentCancel,
  patchMasterAppointmentClose,
  patchMasterAppointmentConfirm,
  patchMasterAppointmentComplete,
  patchMasterAppointmentStart,
  postMasterReportNoShow,
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
import { MasterAppointmentNoShowModal } from './MasterAppointmentNoShowModal';
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
  tab?: MasterAppointmentsTab;
};

type ConfirmKind = 'cancel' | 'reject' | 'complete' | 'close' | 'dispute';

const CANCEL_CATEGORIES = [
  { id: 'client_requested', label: 'Клиент попросил отменить' },
  { id: 'master_unavailable', label: 'Мастер не может принять' },
  { id: 'booking_error', label: 'Ошибка в записи' },
  { id: 'other', label: 'Другое' },
] as const;

function statusBadgeClass(phase: MasterAppointmentLifecycleResult['phase']): string {
  switch (phase) {
    case 'pending':
      return 'bg-[#FFF4E8] text-[#B45309]';
    case 'before_visit':
    case 'visit_window':
    case 'in_progress':
      return 'bg-[#ECFDF5] text-[#16A34A]';
    case 'requires_attention':
      return 'bg-[#FEF2F2] text-[#B91C1C]';
    case 'completed':
      return 'bg-[#EEF2FF] text-[#4F46E5]';
    default:
      return 'bg-[#EBEBEB] text-[#6B7280]';
  }
}

function actionBtnClass(action: MasterAppointmentAction, disabled: boolean): string {
  if (action.variant === 'primary') return catalogSheetPrimaryBtn;
  if (action.variant === 'danger') {
    return `${catalogSheetSecondaryBtn} !text-[#EF4444] ${disabled ? '' : ''}`;
  }
  return catalogSheetSecondaryBtn;
}

function bookingSourceLabel(source?: string | null): string {
  if (!source) return 'Сайт';
  if (source === 'telegram') return 'Telegram';
  if (source === 'google') return 'Google';
  if (source === 'email') return 'Email';
  return source;
}

function appointmentTiming(appointment: DemoMasterAppointment) {
  const startsAt = appointment.startsAt ?? `${appointment.date}T${appointment.time}:00`;
  const endsAt =
    appointment.endsAt ??
    new Date(new Date(startsAt).getTime() + (appointment.durationMinutes ?? 90) * 60_000).toISOString();
  return { startsAt, endsAt };
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 first:pt-0 last:pb-0">
      <span className="shrink-0 text-[13px] font-medium text-[#6B7280]">{label}</span>
      <span className="min-w-0 text-right text-[14px] font-semibold leading-snug text-[#111827]">{value}</span>
    </div>
  );
}

export function AdminAppointmentDetailSheet({
  appointment,
  onClose,
  useLiveApi = false,
  onAfterAction,
  actionsDisabled,
  tab = 'upcoming',
}: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [moreOpen, setMoreOpen] = useState(false);
  const [noShowOpen, setNoShowOpen] = useState(false);
  const [confirmKind, setConfirmKind] = useState<ConfirmKind | null>(null);
  const [reason, setReason] = useState('');
  const [cancelCategory, setCancelCategory] = useState<string>(CANCEL_CATEGORIES[0].id);
  const [disputeReason, setDisputeReason] = useState('client_no_show');

  const [liveExtra, setLiveExtra] = useState<{
    timeline?: DemoMasterAppointment['timeline'];
    clientSignal?: DemoMasterAppointment['clientSignal'];
    lifecycle?: MasterAppointmentLifecycleResult;
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
          lifecycle: (tab === 'history' ? row.lifecycle_history : row.lifecycle) as MasterAppointmentLifecycleResult | undefined,
        });
      })
      .catch(() => {
        if (!cancelled) setLiveExtra(null);
      });
    return () => {
      cancelled = true;
    };
  }, [appointment?.voucherNumber, useLiveApi, tab]);

  const lifecycle = useMemo(() => {
    if (!appointment) return null;
    if (liveExtra?.lifecycle) return liveExtra.lifecycle;
    const { startsAt, endsAt } = appointmentTiming(appointment);
    const clientSignal = liveExtra?.clientSignal ?? appointment.clientSignal;
    return buildMasterAppointmentActions(
      {
        status: appointment.dbStatus ?? appointment.status,
        startsAt,
        endsAt,
        hasClientOnSiteSignal:
          clientSignal?.kind === 'reported_arrived' || appointment.status === 'client_arrived',
      },
      new Date(),
      undefined,
      tab,
    );
  }, [appointment, liveExtra, tab]);

  const runApi = useCallback(
    async (fn: () => Promise<void>, closeAfter = true) => {
      setBusy(true);
      setError(null);
      try {
        await fn();
        setConfirmKind(null);
        setNoShowOpen(false);
        setReason('');
        afterBookingMutation();
        await onAfterAction?.();
        if (closeAfter) onClose();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Не удалось выполнить действие');
      } finally {
        setBusy(false);
      }
    },
    [onAfterAction, onClose],
  );

  const executeAction = useCallback(
    async (actionId: MasterAppointmentActionId) => {
      if (!appointment || !lifecycle) return;
      const allowed = [
        lifecycle.primaryAction?.id,
        lifecycle.secondaryAction?.id,
        ...lifecycle.moreActions.map((a) => a.id),
      ].filter(Boolean);
      if (!allowed.includes(actionId)) return;
      if (!useLiveApi) {
        onClose();
        return;
      }
      const id = appointment.id;
      switch (actionId) {
        case 'confirm':
          await runApi(() => patchMasterAppointmentConfirm(id));
          break;
        case 'reject':
          setConfirmKind('reject');
          break;
        case 'start_visit':
          await runApi(() => patchMasterAppointmentStart(id), false);
          break;
        case 'complete_visit':
          setConfirmKind('complete');
          break;
        case 'close_record':
          setConfirmKind('close');
          break;
        case 'cancel':
        case 'cancel_visit':
          setConfirmKind('cancel');
          break;
        case 'report_no_show':
          setNoShowOpen(true);
          break;
        case 'report_problem':
          setConfirmKind('dispute');
          break;
        case 'contact_client':
          setMoreOpen(false);
          break;
        default:
          break;
      }
    },
    [appointment, lifecycle, onClose, runApi, useLiveApi],
  );

  const submitConfirm = useCallback(async () => {
    if (!appointment || !confirmKind) return;
    const id = appointment.id;
    if (confirmKind === 'reject' || confirmKind === 'cancel') {
      if (!reason.trim()) return;
      const category = confirmKind === 'reject' ? 'rejected_request' : cancelCategory;
      await runApi(() => patchMasterAppointmentCancel(id, reason.trim(), category));
      return;
    }
    if (confirmKind === 'complete') {
      await runApi(() => patchMasterAppointmentComplete(id));
      return;
    }
    if (confirmKind === 'close') {
      await runApi(() => patchMasterAppointmentClose(id, reason.trim() || undefined));
      return;
    }
    if (confirmKind === 'dispute') {
      if (!reason.trim()) return;
      await runApi(() => masterDispute(id, { reason: disputeReason, comment: reason.trim() }));
    }
  }, [appointment, cancelCategory, confirmKind, disputeReason, reason, runApi]);

  const phone = appointment?.contact?.match(/^\+?\d/) ? appointment.contact.replace(/\s/g, '') : null;
  const timeline = liveExtra?.timeline ?? appointment?.timeline;
  const clientSignal = liveExtra?.clientSignal ?? appointment?.clientSignal;

  const addressLine = (() => {
    if (!appointment) return null;
    const fmt = formatVisitPlace(appointment.addressShort);
    if (fmt === 'На дому' && appointment.addressShort?.trim()) return appointment.addressShort.trim();
    if (appointment.addressShort?.trim()) return appointment.addressShort.trim();
    return null;
  })();

  const renderActionButton = (action: MasterAppointmentAction | null) => {
    if (!action || action.id === 'contact_client' || action.id === 'view_details') return null;
    return (
      <button
        key={action.id}
        type="button"
        disabled={actionsDisabled || busy}
        onClick={() => void executeAction(action.id)}
        className={actionBtnClass(action, Boolean(actionsDisabled || busy))}
      >
        {action.label}
      </button>
    );
  };

  const footer = appointment && lifecycle?.allowsActiveLifecycle !== false ? (
    <div className="flex w-full flex-col gap-2">
      {renderActionButton(lifecycle?.primaryAction ?? null)}
      {renderActionButton(lifecycle?.secondaryAction ?? null)}
      {lifecycle?.moreActions.length ? (
        <div className="relative">
          <button
            type="button"
            disabled={actionsDisabled || busy}
            onClick={() => setMoreOpen((v) => !v)}
            className={`${catalogSheetSecondaryBtn} flex items-center justify-center gap-1.5`}
          >
            <HiEllipsisHorizontal className="h-5 w-5" aria-hidden />
            Ещё
          </button>
          {moreOpen ? (
            <div className="absolute bottom-full left-0 right-0 z-10 mb-2 overflow-hidden rounded-[12px] bg-white py-1 shadow-lg ring-1 ring-[#EEEEEE]">
              {lifecycle.moreActions.map((action) => (
                <button
                  key={action.id}
                  type="button"
                  disabled={actionsDisabled || busy}
                  onClick={() => {
                    setMoreOpen(false);
                    if (action.id === 'contact_client' && phone) {
                      window.location.href = `tel:${phone}`;
                      return;
                    }
                    void executeAction(action.id);
                  }}
                  className="block w-full px-4 py-2.5 text-left text-[14px] font-semibold text-[#111827] hover:bg-[#F8F7F7]"
                >
                  {action.label}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  ) : undefined;

  const confirmModal = confirmKind ? (
    <AdminBottomSheet
      variant="catalog"
      open
      onClose={() => setConfirmKind(null)}
      title={
        confirmKind === 'reject'
          ? 'Отклонить заявку?'
          : confirmKind === 'cancel'
            ? 'Отменить запись?'
            : confirmKind === 'complete'
              ? 'Завершить визит?'
              : confirmKind === 'close'
                ? 'Закрыть запись?'
                : 'Сообщить о проблеме?'
      }
      footer={
        <div className="flex w-full flex-col gap-2">
          <button type="button" onClick={() => setConfirmKind(null)} className={catalogSheetSecondaryBtn}>
            Назад
          </button>
          <button
            type="button"
            disabled={busy || ((confirmKind === 'reject' || confirmKind === 'cancel' || confirmKind === 'dispute') && !reason.trim())}
            onClick={() => void submitConfirm()}
            className={catalogSheetPrimaryBtn}
          >
            Подтвердить
          </button>
        </div>
      }
    >
      <div className="space-y-3">
        {confirmKind === 'complete' ? (
          <p className="text-[14px] text-[#6B7280]">Клиент получит уведомление и сможет оставить отзыв.</p>
        ) : null}
        {confirmKind === 'close' ? (
          <p className="text-[14px] text-[#6B7280]">Запись будет отмечена как завершённая.</p>
        ) : null}
        {confirmKind === 'dispute' ? (
          <>
            <label className="block">
              <span className={catalogSheetLabel}>Причина</span>
              <select
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value)}
                className={catalogSheetField}
              >
                <option value="client_no_show">Клиент не пришёл</option>
                <option value="client_late">Клиент опоздал</option>
                <option value="other">Другое</option>
              </select>
            </label>
          </>
        ) : null}
        {(confirmKind === 'reject' || confirmKind === 'cancel' || confirmKind === 'dispute' || confirmKind === 'close') && (
          <>
            {confirmKind === 'cancel' ? (
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
              <span className={catalogSheetLabel}>
                {confirmKind === 'dispute' || confirmKind === 'reject' || confirmKind === 'cancel'
                  ? 'Комментарий *'
                  : 'Комментарий'}
              </span>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                className={`${catalogSheetField} min-h-[5rem] resize-none`}
              />
            </label>
          </>
        )}
        {error ? (
          <p className="rounded-[10px] bg-[#FEF2F2] px-3 py-2 text-[13px] font-semibold text-[#EF4444]">{error}</p>
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
          appointment && lifecycle ? (
            <div className="min-w-0 pr-2">
              <div className="flex flex-wrap items-center gap-2">
                <h2 id="admin-sheet-title" className={`${catalogSheetTitle} min-w-0 break-words`}>
                  Запись
                </h2>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${statusBadgeClass(lifecycle.phase)}`}
                >
                  {lifecycle.phaseLabel}
                </span>
              </div>
              <p className="mt-1 text-[13px] font-medium text-[#6B7280]">
                {formatDdMmYyyy(appointment.date)} · {appointment.timeLabel ?? appointment.time}
              </p>
              {lifecycle.warning ? (
                <p className="mt-1 text-[12px] font-semibold text-[#B91C1C]">{lifecycle.warning}</p>
              ) : null}
            </div>
          ) : undefined
        }
        footer={footer}
      >
        {appointment && lifecycle ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <AppointmentsClientAvatar
                name={appointment.clientName}
                phone={appointment.contact}
                photoUrl={appointment.clientAvatarUrl}
                size="md"
              />
              <div className="min-w-0 flex-1">
                <p className="text-[17px] font-bold text-[#111827]">{appointment.clientName}</p>
                {phone ? (
                  <a href={`tel:${phone}`} className="mt-0.5 inline-flex items-center gap-1 text-[14px] font-semibold text-[#F47C8C]">
                    <HiPhone className="h-4 w-4" aria-hidden />
                    {appointment.contact}
                  </a>
                ) : (
                  <p className="text-[13px] text-[#6B7280]">Контакт не указан</p>
                )}
                <p className="mt-1 text-[13px] text-[#6B7280]">
                  Источник: {bookingSourceLabel(appointment.bookingSource)}
                </p>
              </div>
            </div>

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
              <p className="text-[12px] font-bold uppercase tracking-wide text-[#F47C8C]">Что дальше</p>
              <p className="mt-1 text-[14px] font-medium text-[#111827]">{lifecycle.helperText}</p>
            </div>

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
          </div>
        ) : null}
      </AdminBottomSheet>

      {confirmModal}

      <MasterAppointmentNoShowModal
        open={noShowOpen}
        busy={busy}
        error={error}
        onClose={() => {
          setNoShowOpen(false);
          setError(null);
        }}
        onSubmit={(payload) =>
          void runApi(async () => {
            if (!appointment) return;
            await postMasterReportNoShow(appointment.id, payload);
          }, false)
        }
      />
    </>
  );
}
