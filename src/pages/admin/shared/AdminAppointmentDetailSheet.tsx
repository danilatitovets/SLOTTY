import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchMasterAppointmentByVoucher, type MasterBookingByVoucher } from '../../../features/appointments/api/bookingByVoucher';
import { dbStatusToUi } from '../../../features/appointments/appointmentStatus';
import type { DemoMasterAppointment } from '../../../features/master/model/demoMasterAppointments';
import {
  buildMasterAppointmentActions,
  type MasterAppointmentAction,
  type MasterAppointmentActionId,
  type MasterAppointmentsTab,
  type MasterAppointmentLifecycleResult,
  type MasterAppointmentPhase,
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
import { AppointmentsClientSummary } from '../appointments/AppointmentsClientSummary';
import {
  apptDetailCloseBtn,
  apptDetailNoteCard,
  apptDetailSectionLabel,
} from '../appointments/adminAppointmentsTheme';
import { MasterAppointmentNextStepsMessage } from '../appointments/MasterAppointmentNextStepsMessage';
import { MasterAppointmentClientReportBlock } from '../appointments/MasterAppointmentClientReportBlock';
import { MasterAppointmentDetailHeader } from '../appointments/MasterAppointmentDetailHeader';
import { MasterAppointmentReferencePhotoBlock } from '../appointments/MasterAppointmentReferencePhotoBlock';
import { MasterAppointmentTimelineBlock } from '../appointments/MasterAppointmentTimelineBlock';
import { MasterAppointmentWhenCard } from '../appointments/MasterAppointmentWhenCard';
import { PendingDeadlineHint } from '../appointments/PendingDeadlineHint';
import { SlideToConfirmButton } from '../appointments/SlideToConfirmButton';
import {
  buildDetailHelperText,
  formatVoucherLabel,
  normalizeMasterTimeline,
} from '../appointments/appointmentDetailHelpers';
import {
  bookingSourceLabel,
  clientNameInputForResolve,
} from '../appointments/appointmentsFormat';
import { resolveNotificationClientName } from '../../../features/notifications/resolveNotificationClientName';
import { AdminBottomSheet } from './AdminBottomSheet';
import { MasterAppointmentNoShowModal } from './MasterAppointmentNoShowModal';
import { MasterAppointmentReviewSheet } from './MasterAppointmentReviewSheet';
import { MasterClientReportSheet } from './MasterClientReportSheet';
import { resolveClientDisplayName } from '../appointments/appointmentDetailHelpers';
import { appointmentDetailStatusTone } from '../appointments/appointmentDetailPresentation';
import {
  catalogSheetField,
  catalogSheetLabel,
  catalogSheetPrimaryBtn,
  catalogSheetSecondaryBtn,
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

function actionBtnClass(action: MasterAppointmentAction, disabled: boolean): string {
  if (action.variant === 'primary') return catalogSheetPrimaryBtn;
  if (action.variant === 'danger') {
    return `${catalogSheetSecondaryBtn} !text-[#EF4444] ${disabled ? '' : ''}`;
  }
  return catalogSheetSecondaryBtn;
}

function appointmentTiming(appointment: DemoMasterAppointment) {
  const startsAt = appointment.startsAt ?? `${appointment.date}T${appointment.time}:00`;
  const endsAt =
    appointment.endsAt ??
    new Date(new Date(startsAt).getTime() + (appointment.durationMinutes ?? 90) * 60_000).toISOString();
  return { startsAt, endsAt };
}

const NEXT_STEPS_PHASES = new Set<MasterAppointmentPhase>([
  'pending',
  'before_visit',
  'visit_window',
  'in_progress',
  'requires_attention',
]);

function showNextStepsBanner(phase: MasterAppointmentPhase): boolean {
  return NEXT_STEPS_PHASES.has(phase);
}

type LiveExtra = {
  timeline?: DemoMasterAppointment['timeline'];
  clientSignal?: DemoMasterAppointment['clientSignal'];
  lifecycle?: MasterAppointmentLifecycleResult;
  clientPatch?: Partial<DemoMasterAppointment>;
};

function mapMasterLiveRow(row: MasterBookingByVoucher, tab: MasterAppointmentsTab): LiveExtra {
  return {
    timeline: row.timeline,
    clientSignal: row.client_signal ?? undefined,
    lifecycle: (tab === 'history' ? row.lifecycle_history : row.lifecycle) as
      | MasterAppointmentLifecycleResult
      | undefined,
    clientPatch: {
      clientName:
        resolveNotificationClientName({
          full_name: clientNameInputForResolve(row.client_name),
          phone: row.client_phone,
          telegram_username: row.client_telegram_username?.replace(/^@+/, '') ?? null,
        }) ??
        clientNameInputForResolve(row.client_name) ??
        'Клиент',
      contact: row.client_phone ?? undefined,
      clientEmail: row.client_email ?? null,
      clientTelegramUsername: row.client_telegram_username?.replace(/^@+/, '') ?? null,
      clientAvatarUrl: row.client_avatar_url,
      voucherNumber: row.voucher_number,
      dbStatus: row.status,
      status: dbStatusToUi(row.status) as DemoMasterAppointment['status'],
    },
  };
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
  const [noShowOpen, setNoShowOpen] = useState(false);
  const [clientReportOpen, setClientReportOpen] = useState(false);
  const [reviewSheetOpen, setReviewSheetOpen] = useState(false);
  const [reviewSheetReviewId, setReviewSheetReviewId] = useState<string | null>(null);
  const [reportSent, setReportSent] = useState(false);
  const [confirmKind, setConfirmKind] = useState<ConfirmKind | null>(null);
  const [reason, setReason] = useState('');
  const [cancelCategory, setCancelCategory] = useState<string>(CANCEL_CATEGORIES[0].id);
  const [disputeReason, setDisputeReason] = useState('client_no_show');

  const [liveExtra, setLiveExtra] = useState<LiveExtra | null>(null);

  const reloadLiveExtra = useCallback(async () => {
    if (!appointment?.voucherNumber || !useLiveApi) return;
    const row = await fetchMasterAppointmentByVoucher(appointment.voucherNumber);
    setLiveExtra(mapMasterLiveRow(row, tab));
  }, [appointment?.voucherNumber, tab, useLiveApi]);


  useEffect(() => {
    if (!appointment?.voucherNumber || !useLiveApi) {
      setLiveExtra(null);
      return;
    }
    let cancelled = false;
    void reloadLiveExtra().catch(() => {
      if (!cancelled) setLiveExtra(null);
    });
    return () => {
      cancelled = true;
    };
  }, [appointment?.voucherNumber, reloadLiveExtra, useLiveApi]);

  const lifecycle = useMemo(() => {
    if (!appointment) return null;
    if (liveExtra?.lifecycle) return liveExtra.lifecycle;
    const { startsAt, endsAt } = appointmentTiming(appointment);
    const clientSignal = liveExtra?.clientSignal ?? appointment.clientSignal;
    const status =
      liveExtra?.clientPatch?.dbStatus ?? appointment.dbStatus ?? appointment.status;
    const uiStatus = liveExtra?.clientPatch?.status ?? appointment.status;
    return buildMasterAppointmentActions(
      {
        status,
        startsAt,
        endsAt,
        hasClientOnSiteSignal:
          clientSignal?.kind === 'reported_arrived' ||
          uiStatus === 'client_arrived' ||
          status === 'client_arrived',
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
        if (useLiveApi) {
          await reloadLiveExtra().catch(() => undefined);
        }
        await onAfterAction?.();
        if (closeAfter) onClose();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Не удалось выполнить действие');
      } finally {
        setBusy(false);
      }
    },
    [onAfterAction, onClose, reloadLiveExtra, useLiveApi],
  );

  const executeAction = useCallback(
    async (actionId: MasterAppointmentActionId) => {
      if (!appointment || !lifecycle) return;
      setError(null);
      const allowed = [
        lifecycle.primaryAction?.id,
        lifecycle.secondaryAction?.id,
        ...lifecycle.moreActions.map((a) => a.id),
      ].filter(Boolean);
      if (!allowed.includes(actionId)) return;
      if (!useLiveApi) {
        if (actionId === 'report_client') {
          setClientReportOpen(true);
          return;
        }
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
        case 'report_client':
          setClientReportOpen(true);
          break;
        case 'contact_client':
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

  const displayAppointment = useMemo(() => {
    if (!appointment) return null;
    if (!liveExtra?.clientPatch) return appointment;
    return { ...appointment, ...liveExtra.clientPatch };
  }, [appointment, liveExtra?.clientPatch]);

  const timeline = useMemo(() => {
    const raw = liveExtra?.timeline ?? appointment?.timeline;
    if (!raw?.length) return [];
    return normalizeMasterTimeline(raw).slice().reverse();
  }, [appointment?.timeline, liveExtra?.timeline]);

  useEffect(() => {
    const reported = timeline.some((ev) => ev.eventType === 'booking.client_reported_by_master');
    setReportSent(reported);
  }, [appointment?.id, timeline]);

  const helperText =
    displayAppointment && lifecycle ? buildDetailHelperText(lifecycle, displayAppointment) : null;
  const voucherLabel = formatVoucherLabel(displayAppointment?.voucherNumber);
  const bookingSource = bookingSourceLabel(displayAppointment?.bookingSource);
  const referencePhotoUrl = displayAppointment?.clientReferencePhotoUrl?.trim() || null;

  const openClientReport = useCallback(() => {
    setClientReportOpen(true);
  }, []);

  const openReviewSheet = useCallback((reviewId?: string | null) => {
    setReviewSheetReviewId(reviewId?.trim() || null);
    setReviewSheetOpen(true);
  }, []);

  const renderActionButton = (action: MasterAppointmentAction | null) => {
    if (!action || action.id === 'contact_client' || action.id === 'view_details' || action.id === 'report_client') {
      return null;
    }
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

  const primaryFooterAction = renderActionButton(lifecycle?.primaryAction ?? null);
  const secondaryFooterAction = renderActionButton(lifecycle?.secondaryAction ?? null);
  const hasLifecycleFooter =
    Boolean(primaryFooterAction || secondaryFooterAction) &&
    appointment &&
    lifecycle?.allowsActiveLifecycle !== false;

  const footer = hasLifecycleFooter ? (
    <div className="flex w-full flex-col gap-2">
      {primaryFooterAction}
      {secondaryFooterAction}
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
          {confirmKind !== 'complete' ? (
            <button
              type="button"
              disabled={busy || ((confirmKind === 'reject' || confirmKind === 'cancel' || confirmKind === 'dispute') && !reason.trim())}
              onClick={() => void submitConfirm()}
              className={catalogSheetPrimaryBtn}
            >
              Подтвердить
            </button>
          ) : null}
        </div>
      }
    >
      <div className="space-y-3">
        {confirmKind === 'complete' ? (
          <>
            <p className="text-[14px] text-[#6B7280]">
              После завершения клиент сможет оставить отзыв.
            </p>
            <SlideToConfirmButton
              label="Проведите, чтобы завершить визит"
              disabled={busy}
              onConfirm={() => void submitConfirm()}
            />
          </>
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
        closeButtonClassName={apptDetailCloseBtn}
        headerContent={
          appointment && lifecycle && displayAppointment ? (
            <MasterAppointmentDetailHeader
              appointment={displayAppointment}
              lifecycle={lifecycle}
              warning={
                lifecycle.warning && !showNextStepsBanner(lifecycle.phase) ? lifecycle.warning : null
              }
            />
          ) : undefined
        }
        footer={footer}
      >
        {displayAppointment && lifecycle ? (
          <div className="space-y-4 pb-1 sm:space-y-5">
            {error ? (
              <p className="rounded-[10px] bg-[#FEF2F2] px-4 py-3 text-[14px] font-semibold text-[#EF4444]">
                {error}
              </p>
            ) : null}
            <MasterAppointmentWhenCard
              appointment={displayAppointment}
              statusLabel={lifecycle.phaseLabel}
              statusTone={appointmentDetailStatusTone(lifecycle.phase, displayAppointment)}
            />

            {lifecycle.phase === 'pending' ? (
              <PendingDeadlineHint pendingExpiresAt={displayAppointment.pendingExpiresAt} />
            ) : null}

            {helperText && showNextStepsBanner(lifecycle.phase) ? (
              <MasterAppointmentNextStepsMessage
                text={helperText}
                warning={lifecycle.warning}
              />
            ) : null}

            <AppointmentsClientSummary appointment={displayAppointment} variant="detail" />

            {displayAppointment.clientNote?.trim() ? (
              <div className={apptDetailNoteCard}>
                <p className={apptDetailSectionLabel}>Пожелания клиента</p>
                <p className="mt-2 text-[14px] font-medium leading-relaxed text-[#111827]">
                  {displayAppointment.clientNote.trim()}
                </p>
              </div>
            ) : null}

            {referencePhotoUrl ? (
              <MasterAppointmentReferencePhotoBlock photoUrl={referencePhotoUrl} />
            ) : null}

            <MasterAppointmentTimelineBlock
              events={timeline}
              onReviewClick={useLiveApi ? openReviewSheet : undefined}
            />

            {voucherLabel || bookingSource !== 'Сайт' ? (
              <p className="px-1 text-center text-[11px] font-medium leading-relaxed text-[#9CA3AF]">
                {voucherLabel ? <>№ {voucherLabel}</> : null}
                {voucherLabel && bookingSource !== 'Сайт' ? ' · ' : null}
                {bookingSource !== 'Сайт' ? <>Запись через {bookingSource}</> : null}
              </p>
            ) : null}

            <MasterAppointmentClientReportBlock
              clientName={resolveClientDisplayName(displayAppointment)}
              reported={reportSent}
              disabled={actionsDisabled || busy}
              onReport={openClientReport}
            />
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

      {appointment && displayAppointment ? (
        <MasterClientReportSheet
          open={clientReportOpen}
          appointmentId={appointment.id}
          clientName={resolveClientDisplayName(displayAppointment)}
          onClose={() => setClientReportOpen(false)}
          onSuccess={() => {
            setReportSent(true);
            setError(null);
            afterBookingMutation();
            if (useLiveApi) void reloadLiveExtra().catch(() => undefined);
          }}
        />
      ) : null}

      {appointment && useLiveApi ? (
        <MasterAppointmentReviewSheet
          open={reviewSheetOpen}
          appointmentId={appointment.id}
          reviewId={reviewSheetReviewId}
          onClose={() => {
            setReviewSheetOpen(false);
            setReviewSheetReviewId(null);
          }}
        />
      ) : null}
    </>
  );
}
