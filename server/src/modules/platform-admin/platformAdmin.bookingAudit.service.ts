import { query } from '../../config/db.js';
import { ApiError } from '../../utils/ApiError.js';
import { normalizeBookingCode } from '../../lib/buildBookingLink.js';
import { deriveClientSignalSummary } from '../../lib/bookingClientDetail.js';
import { eventLabel, listBookingEventsForAppointment } from '../appointments/bookingEvents.service.js';
import { listNotificationJobs } from '../notifications/notificationJobs.service.js';
import { getOpenDisputeForAppointment } from '../appointments/bookingDisputes.service.js';

async function appointmentIdByVoucher(voucherRaw: string): Promise<string> {
  const voucherNumber = normalizeBookingCode(voucherRaw);
  const r = await query<{ appointment_id: string }>(
    `select appointment_id from public.booking_vouchers where voucher_number = $1`,
    [voucherNumber],
  );
  const id = r.rows[0]?.appointment_id;
  if (!id) throw ApiError.notFound('Запись не найдена', 'BOOKING_NOT_FOUND');
  return id;
}

export async function getPlatformBookingEvents(voucherRaw: string) {
  const appointmentId = await appointmentIdByVoucher(voucherRaw);
  const events = await listBookingEventsForAppointment(appointmentId, 100);
  return {
    appointmentId,
    events: events.map((ev) => ({
      id: ev.id,
      eventType: ev.event_type,
      label: eventLabel(ev.event_type, 'admin'),
      oldStatus: ev.old_status,
      newStatus: ev.new_status,
      actorRole: ev.actor_role,
      reason: ev.reason,
      comment: ev.comment,
      metadata: ev.metadata,
      createdAt: ev.created_at instanceof Date ? ev.created_at.toISOString() : String(ev.created_at),
    })),
  };
}

export async function getPlatformBookingDisputes(voucherRaw: string) {
  const appointmentId = await appointmentIdByVoucher(voucherRaw);
  const r = await query<{
    id: string;
    reason: string;
    comment: string | null;
    status: string;
    created_by_role: string;
    resolution: string | null;
    admin_note: string | null;
    created_at: Date | string;
    updated_at: Date | string;
  }>(
    `select id, reason, comment, status::text, created_by_role, resolution, admin_note, created_at, updated_at
       from public.booking_disputes
      where appointment_id = $1
      order by created_at desc`,
    [appointmentId],
  );
  return {
    appointmentId,
    disputes: r.rows.map((row) => ({
      id: row.id,
      reason: row.reason,
      comment: row.comment,
      status: row.status,
      createdByRole: row.created_by_role,
      resolution: row.resolution,
      adminNote: row.admin_note,
      createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
      updatedAt: row.updated_at instanceof Date ? row.updated_at.toISOString() : String(row.updated_at),
    })),
    openDispute: await getOpenDisputeForAppointment(appointmentId),
  };
}

export async function getPlatformBookingNotifications(voucherRaw: string) {
  const appointmentId = await appointmentIdByVoucher(voucherRaw);
  const jobs = await listNotificationJobs({ appointmentId, limit: 100 });
  return { appointmentId, jobs };
}

export async function getPlatformBookingAuditSummary(voucherRaw: string) {
  const appointmentId = await appointmentIdByVoucher(voucherRaw);
  const events = await listBookingEventsForAppointment(appointmentId, 100);
  const clientSignal = deriveClientSignalSummary(events);
  const appt = await query<{
    status: string;
    cancel_reason: string | null;
    auto_completed_at: Date | string | null;
    no_show_at: Date | string | null;
    voucher_number: string;
  }>(
    `select a.status::text, a.cancel_reason, a.auto_completed_at, a.no_show_at, bv.voucher_number
       from public.appointments a
       left join public.booking_vouchers bv on bv.appointment_id = a.id
      where a.id = $1`,
    [appointmentId],
  );
  const row = appt.rows[0];
  if (!row) throw ApiError.notFound('Запись не найдена', 'BOOKING_NOT_FOUND');

  return {
    appointmentId,
    voucherNumber: row.voucher_number,
    status: row.status,
    cancelReason: row.cancel_reason,
    autoCompletedAt: row.auto_completed_at
      ? row.auto_completed_at instanceof Date
        ? row.auto_completed_at.toISOString()
        : String(row.auto_completed_at)
      : null,
    noShowAt: row.no_show_at
      ? row.no_show_at instanceof Date
        ? row.no_show_at.toISOString()
        : String(row.no_show_at)
      : null,
    clientSignal,
  };
}
