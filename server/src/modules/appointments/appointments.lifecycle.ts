import { query } from '../../config/db.js';
// query used for no_show_at
import { ApiError } from '../../utils/ApiError.js';
import { logNotification } from '../notifications/notificationLog.js';
import { insertBookingEvent } from './bookingEvents.service.js';
import type { BookingActorRole } from './bookingEvents.service.js';
import { scheduleJobsAfterBookingCancelled, scheduleJobsAfterBookingConfirmed } from '../notifications/notificationJobs.schedule.js';
import { notifyClientByAppointmentId } from './appointments.clientNotifications.js';
import type { DbAppointmentStatus } from '../../lib/appointmentStatus.js';
import { normalizeDbStatus } from '../../lib/appointmentStatus.js';

type TransitionRow = {
  id: string;
  status: string;
  client_id: string;
  master_id: string;
  slot_id: string;
};

async function loadForMaster(masterId: string, appointmentId: string): Promise<TransitionRow> {
  const r = await query<TransitionRow>(
    `select id, status::text, client_id, master_id, slot_id
       from public.appointments where id = $1 and master_id = $2`,
    [appointmentId, masterId],
  );
  const row = r.rows[0];
  if (!row) throw ApiError.notFound('Appointment not found', 'BOOKING_NOT_FOUND');
  return row;
}

async function setStatus(
  appointmentId: string,
  next: DbAppointmentStatus,
  extra?: { cancelReason?: string | null; cancelReasonCategory?: string | null },
): Promise<void> {
  if (extra?.cancelReason !== undefined) {
    await query(
      `update public.appointments
          set status = $2::public.appointment_status,
              cancel_reason = $3,
              cancel_reason_category = $4,
              updated_at = now()
        where id = $1`,
      [appointmentId, next, extra.cancelReason ?? null, extra.cancelReasonCategory ?? null],
    );
    return;
  }
  await query(
    `update public.appointments set status = $2::public.appointment_status, updated_at = now() where id = $1`,
    [appointmentId, next],
  );
}

async function releaseSlot(appointmentId: string): Promise<void> {
  await query(
    `update public.master_availability_slots s
        set status = 'available', updated_at = now()
      from public.appointments a
      where a.id = $1 and s.id = a.slot_id and s.status = 'booked'`,
    [appointmentId],
  );
}

function logStatusChange(params: {
  appointmentId: string;
  voucherNumber?: string | null;
  oldStatus: string;
  newStatus: string;
  actorUserId: string;
  actorRole: BookingActorRole;
  reason?: string | null;
}): void {
  logNotification('booking.status.change', {
    bookingId: params.appointmentId,
    bookingCode: params.voucherNumber,
    oldStatus: params.oldStatus,
    newStatus: params.newStatus,
    actorUserId: params.actorUserId,
    actorRole: params.actorRole,
    reason: params.reason,
  });
}

async function transition(
  masterId: string,
  appointmentId: string,
  target: DbAppointmentStatus,
  opts: {
    eventType: string;
    reason?: string | null;
    cancelReasonCategory?: string | null;
    notify?: 'confirmed' | 'cancelled_by_master' | 'completed' | 'no_show' | null;
    releaseSlot?: boolean;
    scheduleReminders?: boolean;
    cancelReminders?: boolean;
  },
): Promise<{ clientId: string }> {
  const row = await loadForMaster(masterId, appointmentId);
  const oldStatus = normalizeDbStatus(row.status);
  if (oldStatus === target) {
    throw ApiError.conflict('Status already set', 'BAD_STATUS');
  }

  await setStatus(appointmentId, target, {
    cancelReason: opts.reason,
    cancelReasonCategory: opts.cancelReasonCategory,
  });

  if (opts.releaseSlot) await releaseSlot(appointmentId);

  await insertBookingEvent({
    appointmentId,
    eventType: opts.eventType,
    oldStatus,
    newStatus: target,
    actorUserId: masterId,
    actorRole: 'master',
    reason: opts.reason,
  });

  const voucherR = await query<{ n: string | null }>(
    `select voucher_number as n from public.booking_vouchers where appointment_id = $1`,
    [appointmentId],
  );

  logStatusChange({
    appointmentId,
    voucherNumber: voucherR.rows[0]?.n,
    oldStatus,
    newStatus: target,
    actorUserId: masterId,
    actorRole: 'master',
    reason: opts.reason,
  });

  if (opts.notify === 'confirmed') void notifyClientByAppointmentId(appointmentId, 'confirmed');
  if (opts.notify === 'cancelled_by_master') void notifyClientByAppointmentId(appointmentId, 'cancelled_by_master');
  if (opts.notify === 'completed') void notifyClientByAppointmentId(appointmentId, 'completed');
  if (opts.notify === 'no_show') void notifyClientByAppointmentId(appointmentId, 'no_show');

  if (opts.scheduleReminders) void scheduleJobsAfterBookingConfirmed(appointmentId);
  if (opts.cancelReminders) void scheduleJobsAfterBookingCancelled(appointmentId);

  return { clientId: row.client_id };
}

export async function masterConfirmAppointmentLifecycle(
  masterId: string,
  appointmentId: string,
): Promise<{ clientId: string }> {
  const row = await loadForMaster(masterId, appointmentId);
  if (normalizeDbStatus(row.status) !== 'pending') {
    throw ApiError.conflict('Only pending appointments can be confirmed', 'BAD_STATUS');
  }
  return transition(masterId, appointmentId, 'confirmed', {
    eventType: 'booking.confirmed',
    notify: 'confirmed',
    scheduleReminders: true,
  });
}

export async function masterClientArrivedLifecycle(
  masterId: string,
  appointmentId: string,
): Promise<{ clientId: string }> {
  const row = await loadForMaster(masterId, appointmentId);
  const s = normalizeDbStatus(row.status);
  if (s !== 'confirmed') {
    throw ApiError.conflict('Only confirmed appointments allow client arrived', 'BAD_STATUS');
  }
  return transition(masterId, appointmentId, 'client_arrived', { eventType: 'booking.client_arrived' });
}

export async function masterStartVisitLifecycle(
  masterId: string,
  appointmentId: string,
): Promise<{ clientId: string }> {
  const row = await loadForMaster(masterId, appointmentId);
  const s = normalizeDbStatus(row.status);
  if (s !== 'client_arrived' && s !== 'confirmed') {
    throw ApiError.conflict('Start visit from confirmed or client arrived only', 'BAD_STATUS');
  }
  return transition(masterId, appointmentId, 'in_progress', { eventType: 'booking.started' });
}

/** @deprecated Используйте masterMarkServiceCompleted — двустороннее завершение. */
export async function masterCompleteAppointmentLifecycle(
  masterId: string,
  appointmentId: string,
): Promise<{ clientId: string }> {
  const { masterMarkServiceCompleted } = await import('./appointments.completion.service.js');
  return masterMarkServiceCompleted(masterId, appointmentId);
}

export async function masterNoShowLifecycle(
  masterId: string,
  appointmentId: string,
  comment?: string | null,
): Promise<{ clientId: string }> {
  const row = await loadForMaster(masterId, appointmentId);
  if (normalizeDbStatus(row.status) !== 'confirmed') {
    throw ApiError.conflict('No-show only for confirmed upcoming visits', 'BAD_STATUS');
  }
  await query(
    `update public.appointments set no_show_at = coalesce(no_show_at, now()) where id = $1`,
    [appointmentId],
  );
  return transition(masterId, appointmentId, 'no_show', {
    eventType: 'booking.no_show',
    reason: comment,
    notify: 'no_show',
    releaseSlot: true,
    cancelReminders: true,
  });
}

export async function masterCancelAppointmentLifecycle(
  masterId: string,
  appointmentId: string,
  reason: string,
  category?: string | null,
): Promise<{ clientId: string }> {
  const row = await loadForMaster(masterId, appointmentId);
  const s = normalizeDbStatus(row.status);
  if (!['pending', 'confirmed', 'client_arrived', 'in_progress'].includes(s)) {
    throw ApiError.conflict('Appointment cannot be cancelled', 'BAD_STATUS');
  }
  return transition(masterId, appointmentId, 'cancelled_by_master', {
    eventType: 'booking.cancelled_by_master',
    reason,
    cancelReasonCategory: category,
    notify: 'cancelled_by_master',
    releaseSlot: true,
    cancelReminders: true,
  });
}
