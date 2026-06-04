import { query } from '../../config/db.js';
import { ApiError } from '../../utils/ApiError.js';
import { normalizeBookingCode } from '../../lib/buildBookingLink.js';
import { normalizeDbStatus } from '../../lib/appointmentStatus.js';
import { insertBookingEvent } from './bookingEvents.service.js';
import { finalizeAppointmentCompleted } from './appointments.completion.service.js';
import { notifyClientByAppointmentId } from './appointments.clientNotifications.js';
import { notifyMasterByAppointmentId } from './appointments.masterNotifications.js';

const RESOLUTIONS = new Set(['client_supported', 'master_supported', 'neutral', 'rejected']);

export type ResolveDisputeInput = {
  resolution: string;
  adminNote: string;
  finalStatus?: 'completed' | 'no_show' | 'cancelled_by_master' | null;
};

async function loadDispute(disputeId: string, appointmentId: string) {
  const r = await query<{
    id: string;
    appointment_id: string;
    status: string;
    created_by_role: string;
  }>(
    `select id, appointment_id, status::text, created_by_role
       from public.booking_disputes
      where id = $1 and appointment_id = $2`,
    [disputeId, appointmentId],
  );
  const row = r.rows[0];
  if (!row) throw ApiError.notFound('Спор не найден', 'DISPUTE_NOT_FOUND');
  if (!['open', 'in_review'].includes(row.status)) {
    throw ApiError.conflict('Спор уже закрыт', 'DISPUTE_CLOSED');
  }
  return row;
}

export async function resolveBookingDisputeByAdmin(
  adminUserId: string,
  voucherRaw: string,
  disputeId: string,
  input: ResolveDisputeInput,
): Promise<void> {
  const resolution = input.resolution.trim();
  if (!RESOLUTIONS.has(resolution)) {
    throw ApiError.badRequest('Некорректное решение', 'RESOLUTION_INVALID');
  }
  const adminNote = input.adminNote?.trim();
  if (!adminNote || adminNote.length < 5) {
    throw ApiError.badRequest('Укажите комментарий администратора (мин. 5 символов)', 'ADMIN_NOTE_REQUIRED');
  }

  const voucherNumber = normalizeBookingCode(voucherRaw);
  const meta = await query<{ appointment_id: string }>(
    `select appointment_id from public.booking_vouchers where voucher_number = $1`,
    [voucherNumber],
  );
  const appointmentId = meta.rows[0]?.appointment_id;
  if (!appointmentId) throw ApiError.notFound('Запись не найдена', 'BOOKING_NOT_FOUND');

  const dispute = await loadDispute(disputeId, appointmentId);
  const apptR = await query<{ status: string }>(
    `select status::text from public.appointments where id = $1`,
    [appointmentId],
  );
  const oldStatus = normalizeDbStatus(apptR.rows[0]?.status ?? 'pending');

  const disputeStatus = resolution === 'rejected' ? 'rejected' : 'resolved';

  await query(
    `update public.booking_disputes
        set status = $2::public.booking_dispute_status,
            resolution = $3,
            admin_note = $4,
            resolved_by_admin_id = $5,
            updated_at = now()
      where id = $1`,
    [disputeId, disputeStatus, resolution, adminNote.slice(0, 2000), adminUserId],
  );

  await insertBookingEvent({
    appointmentId,
    eventType: 'booking.dispute_resolved',
    oldStatus,
    newStatus: oldStatus,
    actorUserId: adminUserId,
    actorRole: 'admin',
    reason: resolution,
    comment: adminNote,
    metadata: { disputeId, resolution },
  });

  if (resolution === 'client_supported' || input.finalStatus === 'completed') {
    await finalizeAppointmentCompleted({
      appointmentId,
      actorUserId: adminUserId,
      actorRole: 'admin',
      eventType: 'booking.completed',
    });
  } else if (input.finalStatus === 'no_show') {
    await query(
      `update public.appointments set status = 'no_show'::public.appointment_status, no_show_at = coalesce(no_show_at, now()), updated_at = now() where id = $1`,
      [appointmentId],
    );
    await insertBookingEvent({
      appointmentId,
      eventType: 'booking.no_show',
      oldStatus,
      newStatus: 'no_show',
      actorUserId: adminUserId,
      actorRole: 'admin',
      comment: adminNote,
    });
  } else if (resolution === 'master_supported' && dispute.created_by_role === 'client') {
    await query(
      `update public.appointments set status = 'cancelled_by_master'::public.appointment_status, updated_at = now() where id = $1`,
      [appointmentId],
    );
  }

  void notifyClientByAppointmentId(appointmentId, 'disputed_ack');
  void notifyMasterByAppointmentId(appointmentId, 'disputed_by_client');
}
