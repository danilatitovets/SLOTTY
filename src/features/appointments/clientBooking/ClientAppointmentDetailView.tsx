import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { getProfilePath } from '../../../app/paths';
import {
  cancelClientAppointmentById,
  cancelClientAppointmentByVoucher,
} from '../api/bookingByVoucher';
import {
  clientCommentByVoucher,
  clientConfirmCompletedByVoucher,
  clientDisputeByVoucher,
  clientSignalByVoucher,
} from '../api/bookingLifecycleApi';
import { afterBookingMutation } from '../bookingDataSync';
import { appointmentStatusLabel, dbStatusToUi } from '../appointmentStatus';
import type { DemoAppointmentRecord } from '../model/demoAppointments';
import { buildYandexMapWidgetUrl, buildYandexMapsRouteUrl } from '../model/demoAppointments';
import { formatServiceName } from '../../../shared/lib/displayFormat';
import type { ClientBookingDetail } from './clientBookingDetailTypes';
import { formatPriceByn, statusLabelRu } from '../../../pages/profile/profileFormat';
import { openBookingVoucherPrint } from '../../../features/booking/lib/bookingConfirmationVoucherPrint';
import { HEADER_LOGO_SRC } from '../../../app/headerLogo';
import { formatDurationMinutes } from '../../../pages/admin/appointments/appointmentsFormat';

const LATE_PRESETS = [5, 10, 15, 30] as const;

const DISPUTE_REASONS = [
  { id: 'master_no_show', label: 'Мастер не пришёл' },
  { id: 'service_not_done', label: 'Услуга не выполнена' },
  { id: 'service_poor_quality', label: 'Некачественная работа' },
  { id: 'master_late_cancel', label: 'Мастер отменил в последний момент' },
  { id: 'wrong_address_or_contact', label: 'Неверный адрес или контакт' },
  { id: 'no_show_dispute', label: 'Оспорить неявку' },
  { id: 'other', label: 'Другое' },
] as const;

const CANCEL_REASONS = [
  { id: 'plans_changed', label: 'Изменились планы' },
  { id: 'no_time', label: 'Не успеваю' },
  { id: 'wrong_time', label: 'Ошибся со временем' },
  { id: 'other_master', label: 'Хочу выбрать другого мастера' },
  { id: 'other', label: 'Другое' },
] as const;

function pinkBtn(disabled?: boolean) {
  return `min-h-11 w-full rounded-full bg-[#F47C8C] text-[14px] font-semibold text-white shadow-[0_8px_24px_rgba(244,124,140,0.28)] transition hover:opacity-95 disabled:opacity-50 ${disabled ? 'pointer-events-none' : ''}`;
}

function softBtn() {
  return 'min-h-11 w-full rounded-full border border-[#E8E4E4] bg-white text-[14px] font-semibold text-[#374151]';
}

function ghostBtn() {
  return 'min-h-10 w-full rounded-full bg-[#F1EFEF] text-[14px] font-semibold text-neutral-900';
}

function DetailRow({ label, value }: { label: string; value: string }) {
  if (!value.trim()) return null;
  return (
    <div className="flex items-start justify-between gap-3 border-b border-[#F0EEEE] py-3 last:border-0">
      <span className="shrink-0 text-[13px] font-medium text-[#9CA3AF]">{label}</span>
      <span className="min-w-0 text-right text-[14px] font-semibold leading-snug text-[#111827]">{value}</span>
    </div>
  );
}

function mapDetailToDemoRow(detail: ClientBookingDetail): DemoAppointmentRecord {
  const when = new Date(detail.starts_at);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const day = new Date(when);
  day.setHours(0, 0, 0, 0);
  const diff = Math.round((day.getTime() - today.getTime()) / 86_400_000);
  let dateLabel = when.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
  if (diff === 0) dateLabel = 'Сегодня';
  else if (diff === 1) dateLabel = 'Завтра';

  const lat = detail.location_lat != null ? Number(detail.location_lat) : undefined;
  const lng = detail.location_lng != null ? Number(detail.location_lng) : undefined;
  const addressShort = detail.address?.line?.trim() || '';

  return {
    id: detail.id,
    masterId: detail.master_id,
    masterName: detail.master?.display_name ?? detail.master_display_name,
    serviceTitle: formatServiceName(detail.service_title_snapshot),
    dateLabel,
    timeLabel: when.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
    location: {
      visitType: detail.location_visit_type === 'at_home' ? 'at_home' : 'studio',
      street: detail.location_street ?? addressShort,
      building: detail.location_building ?? '',
      city: detail.location_city ?? undefined,
      lat: Number.isFinite(lat) ? lat : undefined,
      lng: Number.isFinite(lng) ? lng : undefined,
    },
    addressShort,
    yandexMap: lat != null && lng != null ? { lon: lng, lat, zoom: 16 } : undefined,
    price: Number.parseFloat(String(detail.price_snapshot)) || 0,
    status: dbStatusToUi(detail.status) as DemoAppointmentRecord['status'],
    type: 'upcoming',
    voucherNumber: detail.voucher_number,
    hasReview: Boolean(detail.has_review),
  };
}

type Props = {
  detail: ClientBookingDetail;
  layout?: 'sheet' | 'page';
  onRefresh: () => void | Promise<void>;
  onClose?: () => void;
  onOpenReview?: (appointmentId: string) => void;
  onRebook?: (masterId: string) => void;
};

export function ClientAppointmentDetailView({
  detail,
  layout = 'sheet',
  onRefresh,
  onClose,
  onOpenReview,
  onRebook,
}: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lateOpen, setLateOpen] = useState(false);
  const [lateMinutes, setLateMinutes] = useState(10);
  const [lateComment, setLateComment] = useState('');
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState<string>(CANCEL_REASONS[0].id);
  const [cancelComment, setCancelComment] = useState('');
  const [commentDraft, setCommentDraft] = useState('');
  const [disputeOpen, setDisputeOpen] = useState(false);
  const [disputeReason, setDisputeReason] = useState<string>(DISPUTE_REASONS[0].id);
  const [disputeComment, setDisputeComment] = useState('');

  const voucher = detail.voucher_number ?? '';
  const actions = new Set(detail.available_actions ?? []);
  const openDispute =
    detail.dispute?.status === 'open' || detail.dispute?.status === 'in_review';
  const demoRow = useMemo(() => mapDetailToDemoRow(detail), [detail]);
  const hero = detail.hero;

  const run = useCallback(
    async (fn: () => Promise<void>) => {
      setBusy(true);
      setError(null);
      try {
        await fn();
        await onRefresh();
        afterBookingMutation();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Не удалось выполнить действие');
      } finally {
        setBusy(false);
      }
    },
    [onRefresh],
  );

  const visitLabel = detail.location_visit_type === 'at_home' ? 'На дому' : 'В студии';
  const durationLabel = formatDurationMinutes(
    detail.service_duration_minutes,
    detail.service_title_snapshot,
  );
  const showMap = Boolean(detail.address?.map_available && (detail.address?.line || demoRow.yandexMap));

  const contactPrimary = detail.master?.contact_actions.find((a) => a.href) ?? null;

  let overlay: ReactNode = null;
  if (lateOpen) {
    overlay = (
      <div
        className="fixed inset-0 z-[60] flex items-end justify-center bg-black/35 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
        onClick={() => setLateOpen(false)}
      >
        <div className="w-full max-w-lg rounded-t-[28px] bg-white p-5" onClick={(e) => e.stopPropagation()}>
          <h3 className="text-[20px] font-semibold text-neutral-950">На сколько опаздываете?</h3>
          <div className="mt-4 flex flex-wrap gap-2">
            {LATE_PRESETS.map((m) => (
              <button
                key={m}
                type="button"
                className={`rounded-full px-4 py-2 text-[14px] font-semibold ${lateMinutes === m ? 'bg-[#F47C8C] text-white' : 'bg-[#F5F3F3] text-[#374151]'}`}
                onClick={() => setLateMinutes(m)}
              >
                {m} мин
              </button>
            ))}
          </div>
          <input
            type="number"
            min={1}
            max={240}
            value={lateMinutes}
            onChange={(e) => setLateMinutes(Number(e.target.value) || 10)}
            className="mt-4 w-full rounded-[12px] border border-[#E5E7EB] px-3 py-2 text-[15px]"
          />
          <textarea
            value={lateComment}
            onChange={(e) => setLateComment(e.target.value)}
            placeholder="Комментарий (необязательно)"
            rows={2}
            className="mt-3 w-full rounded-[12px] border border-[#E5E7EB] px-3 py-2 text-[15px]"
          />
          <button
            type="button"
            className={`${pinkBtn(busy)} mt-4`}
            disabled={busy}
            onClick={() =>
              void run(async () => {
                if (!voucher) return;
                await clientSignalByVoucher(voucher, 'running-late', {
                  lateMinutes,
                  comment: lateComment.trim() || undefined,
                });
                setLateOpen(false);
              })
            }
          >
            Сообщить мастеру
          </button>
        </div>
      </div>
    );
  }

  if (disputeOpen) {
    const commentOk = disputeComment.trim().length >= 10;
    overlay = (
      <div
        className="fixed inset-0 z-[60] flex items-end justify-center bg-black/35 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
        onClick={() => setDisputeOpen(false)}
      >
        <div className="w-full max-w-lg rounded-t-[28px] bg-white p-5" onClick={(e) => e.stopPropagation()}>
          <h3 className="text-[20px] font-semibold text-neutral-950">Сообщить о проблеме</h3>
          <p className="mt-2 text-[14px] text-neutral-500">
            Опишите ситуацию — мы передадим обращение в поддержку.
          </p>
          <select
            value={disputeReason}
            onChange={(e) => setDisputeReason(e.target.value)}
            className="mt-4 w-full rounded-[12px] border border-[#E5E7EB] px-3 py-2 text-[15px]"
          >
            {DISPUTE_REASONS.map((r) => (
              <option key={r.id} value={r.id}>
                {r.label}
              </option>
            ))}
          </select>
          <textarea
            value={disputeComment}
            onChange={(e) => setDisputeComment(e.target.value)}
            placeholder="Комментарий (минимум 10 символов)"
            rows={4}
            className="mt-3 w-full rounded-[12px] border border-[#E5E7EB] px-3 py-2 text-[15px]"
          />
          <p className="mt-1 text-[12px] text-[#9CA3AF]">
            {commentOk ? 'Можно отправить' : `Ещё ${10 - disputeComment.trim().length} символов`}
          </p>
          <button
            type="button"
            className={`${pinkBtn(busy || !commentOk)} mt-4`}
            disabled={busy || !commentOk || !voucher}
            onClick={() =>
              void run(async () => {
                await clientDisputeByVoucher(voucher, {
                  reason: disputeReason,
                  comment: disputeComment.trim(),
                });
                setDisputeOpen(false);
                setDisputeComment('');
              })
            }
          >
            Отправить обращение
          </button>
        </div>
      </div>
    );
  }

  if (cancelOpen) {
    overlay = (
      <div
        className="fixed inset-0 z-[60] flex items-end justify-center bg-black/35 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
        onClick={() => setCancelOpen(false)}
      >
        <div className="w-full max-w-lg rounded-t-[28px] bg-white p-5" onClick={(e) => e.stopPropagation()}>
          <h3 className="text-[20px] font-semibold text-neutral-950">Отменить запись?</h3>
          <p className="mt-2 text-[14px] text-neutral-500">Мастер получит уведомление.</p>
          <select
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            className="mt-4 w-full rounded-[12px] border border-[#E5E7EB] px-3 py-2 text-[15px]"
          >
            {CANCEL_REASONS.map((r) => (
              <option key={r.id} value={r.id}>
                {r.label}
              </option>
            ))}
          </select>
          <textarea
            value={cancelComment}
            onChange={(e) => setCancelComment(e.target.value)}
            placeholder="Комментарий"
            rows={2}
            className="mt-3 w-full rounded-[12px] border border-[#E5E7EB] px-3 py-2 text-[15px]"
          />
          <button
            type="button"
            className={`${pinkBtn(busy)} mt-4`}
            disabled={busy}
            onClick={() =>
              void run(async () => {
                const label = CANCEL_REASONS.find((r) => r.id === cancelReason)?.label ?? cancelReason;
                const body = {
                  reasonCategory: cancelReason,
                  reason: label,
                  comment: cancelComment.trim() || undefined,
                };
                if (voucher) await cancelClientAppointmentByVoucher(voucher, body);
                else await cancelClientAppointmentById(detail.id, body);
                setCancelOpen(false);
                onClose?.();
              })
            }
          >
            Отменить запись
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {layout === 'page' ? (
        <Link to={getProfilePath('appointments')} className="text-[14px] font-semibold text-[#6B7280]">
          ← Мои записи
        </Link>
      ) : null}

      <div className={layout === 'page' ? 'mt-6' : ''}>
        <div className="rounded-[28px] bg-gradient-to-br from-[#FFF8F9] to-[#FFF4F6] p-5 ring-1 ring-[#F47C8C]/15">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <span className="inline-flex rounded-full bg-white/80 px-3 py-1 text-[12px] font-semibold text-[#F47C8C]">
              {detail.status_label ?? appointmentStatusLabel(detail.status)}
            </span>
            {hero?.lateBadge ? (
              <span className="rounded-full bg-[#FEF2F2] px-3 py-1 text-[11px] font-bold text-[#B91C1C]">
                {hero.lateBadge}
              </span>
            ) : null}
            {hero?.countdown ? (
              <span className="text-[12px] font-semibold text-[#6B7280]">осталось {hero.countdown}</span>
            ) : null}
          </div>
          <h2 className="mt-3 text-[22px] font-bold tracking-tight text-neutral-950">
            {hero?.title ?? detail.status_label}
          </h2>
          <p className="mt-1 text-[14px] leading-relaxed text-[#6B7280]">{hero?.subtitle ?? detail.status_hint}</p>
          {openDispute ? (
            <p className="mt-3 rounded-[14px] bg-[#FFF7ED] px-3 py-2 text-[13px] font-semibold text-[#C2410C]">
              Обращение отправлено — ожидает решения поддержки
            </p>
          ) : null}
        </div>

        <div className="mt-3 flex flex-col gap-2">
          {actions.has('on_the_way') ? (
            <button
              type="button"
              disabled={busy}
              className={pinkBtn(busy)}
              onClick={() => voucher && void run(() => clientSignalByVoucher(voucher, 'on-the-way'))}
            >
              Я в пути
            </button>
          ) : null}
          {actions.has('running_late') ? (
            <button type="button" disabled={busy} className={softBtn()} onClick={() => setLateOpen(true)}>
              Я опаздываю
            </button>
          ) : null}
          {actions.has('reported_arrived') ? (
            <button
              type="button"
              disabled={busy}
              className={softBtn()}
              onClick={() => voucher && void run(() => clientSignalByVoucher(voucher, 'reported-arrived'))}
            >
              Я на месте
            </button>
          ) : null}
          {actions.has('contact_master') && contactPrimary?.href ? (
            <a href={contactPrimary.href} className={`${softBtn()} flex items-center justify-center`}>
              {contactPrimary.label}
            </a>
          ) : null}
          {actions.has('contact_master') && !contactPrimary?.href ? (
            <p className="rounded-[16px] bg-[#F8F7F7] px-4 py-3 text-[13px] text-[#6B7280]">
              Свяжитесь с мастером через SLOTTY — напоминания придут в Telegram.
            </p>
          ) : null}
        </div>

        {detail.master ? (
          <div className="mt-4 rounded-[24px] border border-[#F0EEEE] bg-white p-4">
            <div className="flex gap-3">
              {detail.master.photo_url ? (
                <img
                  src={detail.master.photo_url}
                  alt=""
                  className="h-14 w-14 shrink-0 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#F5F3F3] text-[18px] font-bold text-[#9CA3AF]">
                  {detail.master.display_name.slice(0, 1)}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-[16px] font-bold text-neutral-950">{detail.master.display_name}</p>
                {detail.master.specialty ? (
                  <p className="text-[13px] text-[#6B7280]">{detail.master.specialty}</p>
                ) : null}
                {detail.master.reviews_count > 0 ? (
                  <p className="mt-0.5 text-[13px] font-semibold text-[#F47C8C]">
                    ★ {detail.master.rating.toFixed(1)} · {detail.master.reviews_count} отзывов
                  </p>
                ) : null}
              </div>
            </div>
            <Link
              to={detail.master.profile_path}
              className="mt-3 flex min-h-10 items-center justify-center rounded-full border border-[#E8E4E4] text-[14px] font-semibold text-[#374151]"
            >
              Открыть профиль мастера
            </Link>
          </div>
        ) : null}

        <div className="mt-4 rounded-[24px] border border-[#F0EEEE] bg-white px-4">
          <DetailRow label="Услуга" value={formatServiceName(detail.service_title_snapshot)} />
          <DetailRow label="Дата и время" value={new Date(detail.starts_at).toLocaleString('ru-RU', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })} />
          <DetailRow label="Длительность" value={durationLabel} />
          <DetailRow label="Стоимость" value={formatPriceByn(Number(detail.price_snapshot) || 0)} />
          <DetailRow label="Формат" value={visitLabel} />
          {detail.address?.line ? <DetailRow label="Адрес" value={detail.address.line} /> : null}
          {!detail.address?.line && detail.address?.hint ? (
            <p className="py-3 text-[13px] leading-relaxed text-[#6B7280]">{detail.address.hint}</p>
          ) : null}
          {detail.voucher_number ? (
            <DetailRow label="Номер записи" value={detail.voucher_number} />
          ) : null}
        </div>

        {showMap ? (
          <div className="mt-4 overflow-hidden rounded-[24px] border border-[#F0EEEE] bg-white p-2">
            <iframe
              title="Карта"
              src={buildYandexMapWidgetUrl(demoRow)}
              className="block h-[min(200px,38dvh)] w-full rounded-[18px] border-0"
              loading="lazy"
            />
            <div className="mt-2 flex flex-col gap-2">
              <a
                href={buildYandexMapsRouteUrl(demoRow)}
                target="_blank"
                rel="noopener noreferrer"
                className={softBtn() + ' flex items-center justify-center'}
              >
                Построить маршрут
              </a>
              {detail.address?.line ? (
                <button
                  type="button"
                  className={ghostBtn()}
                  onClick={() => void navigator.clipboard?.writeText(detail.address!.line!)}
                >
                  Скопировать адрес
                </button>
              ) : null}
            </div>
            <p className="mt-2 px-1 text-[12px] text-[#9CA3AF]">Рекомендуем выйти заранее</p>
          </div>
        ) : null}

        {actions.has('add_comment') ? (
          <div className="mt-4 rounded-[24px] border border-[#F0EEEE] bg-white p-4">
            <p className="text-[14px] font-semibold text-neutral-950">Комментарий мастеру</p>
            <textarea
              value={commentDraft}
              onChange={(e) => setCommentDraft(e.target.value)}
              rows={3}
              className="mt-2 w-full rounded-[12px] border border-[#E5E7EB] px-3 py-2 text-[15px]"
              placeholder="Например: подъеду к главному входу"
            />
            <button
              type="button"
              disabled={busy || !commentDraft.trim() || !voucher}
              className={`${pinkBtn(busy)} mt-2`}
              onClick={() =>
                void run(async () => {
                  await clientCommentByVoucher(voucher, commentDraft.trim());
                  setCommentDraft('');
                })
              }
            >
              Отправить
            </button>
          </div>
        ) : null}

        {detail.timeline?.length ? (
          <div className="mt-4 rounded-[24px] border border-[#F0EEEE] bg-white px-4 py-3">
            <p className="text-[12px] font-bold uppercase tracking-wide text-[#9CA3AF]">История</p>
            <ul className="mt-2 space-y-2">
              {detail.timeline.slice(-8).map((ev) => (
                <li key={ev.id} className="text-[13px] text-[#374151]">
                  <span className="font-semibold">{ev.label}</span>
                  <span className="text-[#9CA3AF]"> — {ev.timeLabel}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {detail.cancel_reason && dbStatusToUi(detail.status) === 'cancelled' ? (
          <p className="mt-4 rounded-[16px] bg-[#F8F7F7] px-4 py-3 text-[13px] text-[#6B7280]">
            Причина отмены: {detail.cancel_reason}
          </p>
        ) : null}

        {error ? (
          <p className="mt-4 rounded-[12px] bg-[#FEF2F2] px-4 py-3 text-[14px] font-semibold text-[#EF4444]">
            {error}
          </p>
        ) : null}

        <div className="mt-5 flex flex-col gap-2">
          {actions.has('dispute') && !openDispute ? (
            <button
              type="button"
              disabled={busy}
              className={softBtn()}
              onClick={() => setDisputeOpen(true)}
            >
              {dbStatusToUi(detail.status) === 'no_show' ? 'Оспорить неявку' : 'Есть проблема'}
            </button>
          ) : null}
          {actions.has('confirm_completed') ? (
            <button
              type="button"
              disabled={busy}
              className={pinkBtn(busy)}
              onClick={() => voucher && void run(() => clientConfirmCompletedByVoucher(voucher))}
            >
              Подтвердить выполнение
            </button>
          ) : null}
          {actions.has('leave_review') ? (
            <button
              type="button"
              className={pinkBtn()}
              onClick={() => onOpenReview?.(detail.id)}
            >
              Оставить отзыв
            </button>
          ) : null}
          {actions.has('rebook') ? (
            <button type="button" className={softBtn()} onClick={() => onRebook?.(detail.master_id)}>
              Записаться снова
            </button>
          ) : null}
          {actions.has('download_pdf') ? (
            <button
              type="button"
              className={ghostBtn()}
              onClick={() =>
                openBookingVoucherPrint(
                  {
                    masterName: demoRow.masterName,
                    serviceTitle: demoRow.serviceTitle,
                    dateLabel: demoRow.dateLabel,
                    timeLabel: demoRow.timeLabel,
                    locationLine: demoRow.addressShort,
                    priceLabel: formatPriceByn(demoRow.price),
                    statusLabel: statusLabelRu(demoRow.status),
                    voucherNumber: demoRow.voucherNumber ?? undefined,
                  },
                  HEADER_LOGO_SRC,
                )
              }
            >
              Скачать PDF
            </button>
          ) : null}
          {actions.has('cancel') ? (
            <button type="button" className={softBtn()} onClick={() => setCancelOpen(true)}>
              Отменить запись
            </button>
          ) : null}
          {onClose ? (
            <button type="button" className={ghostBtn()} onClick={onClose}>
              Закрыть
            </button>
          ) : null}
        </div>
      </div>
      {overlay}
    </>
  );
}
