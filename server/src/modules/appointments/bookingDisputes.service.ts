import { query } from '../../config/db.js';
import { ApiError } from '../../utils/ApiError.js';
import { normalizeDbStatus } from '../../lib/appointmentStatus.js';
import { insertBookingEvent } from './bookingEvents.service.js';
import { cancelBookingAutoCompleteJob } from './bookingCompletionJobs.service.js';
import { setAppointmentStatus } from './appointments.completion.service.js';
import type { DbAppointmentStatus } from '../../lib/appointmentStatus.js';
import { requireAppointmentForClient, requireAppointmentForMaster } from './appointments.access.js';
import { notifyClientByAppointmentId } from './appointments.clientNotifications.js';
import { notifyMasterByAppointmentId } from './appointments.masterNotifications.js';
import { notifyAdminBookingDispute } from './appointments.adminNotifications.js';

const CLIENT_REASONS = new Set([
  'master_no_show',
  'service_not_done',
  'service_poor_quality',
  'master_late_cancel',
  'wrong_address_or_contact',
  'no_show_dispute',
  'other',
]);

const MASTER_REASONS = new Set([
  'client_no_show',
  'client_late',
  'client_late_cancel',
  'client_misconduct',
  'client_not_paid',
  'other',
]);

export type CreateDisputeInput = {
  reason: string;
  comment?: string | null;
};

async function assertNoOpenDispute(appointmentId: string): Promise<void> {
  const r = await query(
    `select 1 from public.booking_disputes
      where appointment_id = $1 and status in ('open', 'in_review')`,
    [appointmentId],
  );
  if (r.rowCount) {
    throw ApiError.conflict('По этой записи уже есть открытое обращение', 'DISPUTE_EXISTS');
  }
}

export async function createClientBookingDispute(
  clientId: string,
  appointmentId: string,
  input: CreateDisputeInput,
): Promise<{ disputeId: string }> {
  const access = await requireAppointmentForClient(clientId, appointmentId);
  const reason = input.reason.trim();
  const comment = input.comment?.trim() ?? '';
  if (!CLIENT_REASONS.has(reason)) {
    throw ApiError.badRequest('Некорректная причина жалобы', 'DISPUTE_REASON_INVALID');
  }
  if (comment.length < 10) {
    throw ApiError.badRequest('Комментарий обязателен (минимум 10 символов)', 'DISPUTE_COMMENT_REQUIRED');
  }

  const s = normalizeDbStatus(access.status);
  const allowed = [
    'master_marked_completed',
    'in_progress',
    'client_confirmed_completed',
    'no_show',
    'completed',
    'confirmed',
    'client_arrived',
  ];
  if (!allowed.includes(s)) {
    throw ApiError.conflict('Жалоба недоступна для этого статуса', 'BAD_STATUS');
  }

  await assertNoOpenDispute(appointmentId);

  const ins = await query<{ id: string }>(
    `insert into public.booking_disputes (
       appointment_id, created_by_user_id, created_by_role, reason, comment, status
     ) values ($1, $2, 'client', $3, $4, 'open')
     returning id`,
    [appointmentId, clientId, reason, comment.slice(0, 2000)],
  );
  const disputeId = ins.rows[0]!.id;

  await setAppointmentStatus(appointmentId, 'disputed_by_client', { disputed_at: true });
  await cancelBookingAutoCompleteJob(appointmentId);

  await insertBookingEvent({
    appointmentId,
    eventType: 'booking.disputed_by_client',
    oldStatus: s,
    newStatus: 'disputed_by_client',
    actorUserId: clientId,
    actorRole: 'client',
    reason,
    comment: input.comment,
    metadata: { disputeId },
  });

  void notifyMasterByAppointmentId(appointmentId, 'disputed_by_client');
  void notifyClientByAppointmentId(appointmentId, 'disputed_ack');
  void notifyAdminBookingDispute(appointmentId, disputeId, 'client');

  return { disputeId };
}

export async function createMasterBookingDispute(
  masterId: string,
  appointmentId: string,
  input: CreateDisputeInput,
): Promise<{ disputeId: string }> {
  const access = await requireAppointmentForMaster(masterId, appointmentId);
  const reason = input.reason.trim();
  if (!MASTER_REASONS.has(reason)) {
    throw ApiError.badRequest('Некорректная причина жалобы', 'DISPUTE_REASON_INVALID');
  }

  const s = normalizeDbStatus(access.status);
  if (!['confirmed', 'client_arrived', 'in_progress', 'master_marked_completed', 'no_show'].includes(s)) {
    throw ApiError.conflict('Жалоба недоступна для этого статуса', 'BAD_STATUS');
  }

  await assertNoOpenDispute(appointmentId);

  const ins = await query<{ id: string }>(
    `insert into public.booking_disputes (
       appointment_id, created_by_user_id, created_by_role, reason, comment, status
     ) values ($1, $2, 'master', $3, $4, 'open')
     returning id`,
    [appointmentId, masterId, reason, input.comment?.trim().slice(0, 2000) ?? null],
  );
  const disputeId = ins.rows[0]!.id;

  await setAppointmentStatus(appointmentId, 'disputed_by_master' as DbAppointmentStatus, {
    disputed_at: true,
  });

  await insertBookingEvent({
    appointmentId,
    eventType: 'booking.disputed_by_master',
    oldStatus: s,
    newStatus: 'disputed_by_master',
    actorUserId: masterId,
    actorRole: 'master',
    reason,
    comment: input.comment,
    metadata: { disputeId },
  });

  void notifyClientByAppointmentId(appointmentId, 'disputed_by_master');
  void notifyAdminBookingDispute(appointmentId, disputeId, 'master');

  return { disputeId };
}

export async function getOpenDisputeForAppointment(appointmentId: string) {
  const r = await query<{
    id: string;
    reason: string;
    comment: string | null;
    status: string;
    created_by_role: string;
    created_at: Date | string;
  }>(
    `select id, reason, comment, status::text, created_by_role, created_at
       from public.booking_disputes
      where appointment_id = $1
      order by created_at desc
      limit 1`,
    [appointmentId],
  );
  return r.rows[0] ?? null;
}
