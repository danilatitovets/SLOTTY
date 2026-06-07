import { query } from '../../config/db.js';
import { ApiError } from '../../utils/ApiError.js';
import { normalizeBookingCode } from '../../lib/buildBookingLink.js';
import {
  collectLinkedProfileCandidates,
  resolveCanonicalProfileId,
} from '../auth/authIdentities.service.js';

export type AppointmentAccessRow = {
  id: string;
  status: string;
  client_id: string;
  master_id: string;
  slot_id: string;
  master_marked_completed_at: Date | string | null;
  client_confirmed_completed_at: Date | string | null;
  completed_at: Date | string | null;
  voucher_number: string | null;
};

const APPT_SELECT = `
  select a.id, a.status::text as status, a.client_id, a.master_id, a.slot_id,
         a.master_marked_completed_at, a.client_confirmed_completed_at, a.completed_at,
         bv.voucher_number
    from public.appointments a
    left join public.booking_vouchers bv on bv.appointment_id = a.id`;

export async function loadAppointmentById(appointmentId: string): Promise<AppointmentAccessRow | null> {
  const r = await query<AppointmentAccessRow>(`${APPT_SELECT} where a.id = $1`, [appointmentId]);
  return r.rows[0] ?? null;
}

export async function loadAppointmentByVoucher(voucherRaw: string): Promise<AppointmentAccessRow | null> {
  const voucherNumber = normalizeBookingCode(voucherRaw);
  const r = await query<AppointmentAccessRow>(
    `${APPT_SELECT}
      join public.booking_vouchers bv2 on bv2.appointment_id = a.id
     where bv2.voucher_number = $1`,
    [voucherNumber],
  );
  return r.rows[0] ?? null;
}

const BOOKING_FORBIDDEN_MESSAGE =
  'У вас нет доступа к этой записи. Войдите в нужный аккаунт.';

/**
 * Связанные profile.id без merge canonical — только для GET-листингов (уведомления и т.п.).
 * resolveCanonicalProfileId пишет в БД и может подвешивать быстрые read-запросы.
 */
export async function resolveLinkedProfileIdsReadOnly(profileId: string): Promise<string[]> {
  const linked = await collectLinkedProfileCandidates(profileId);
  return [...new Set([profileId, ...linked])];
}

/** Все profile.id, от имени которых клиент может видеть свои записи (canonical + связанные). */
export async function resolveClientAppointmentOwnerIds(clientId: string): Promise<string[]> {
  const canonicalId = await resolveCanonicalProfileId(clientId);
  const linked = [
    ...(await collectLinkedProfileCandidates(clientId)),
    ...(await collectLinkedProfileCandidates(canonicalId)),
  ];
  return [...new Set([clientId, canonicalId, ...linked])];
}

export async function clientOwnsAppointment(
  appointmentClientId: string,
  viewerClientId: string,
): Promise<boolean> {
  if (appointmentClientId === viewerClientId) return true;
  const ownerIds = await resolveClientAppointmentOwnerIds(viewerClientId);
  return ownerIds.includes(appointmentClientId);
}

export async function assertClientAccess(row: AppointmentAccessRow, clientId: string): Promise<void> {
  if (await clientOwnsAppointment(row.client_id, clientId)) return;
  throw ApiError.forbidden(BOOKING_FORBIDDEN_MESSAGE, 'BOOKING_FORBIDDEN');
}

export function assertMasterAccess(row: AppointmentAccessRow, masterId: string): void {
  if (row.master_id !== masterId) {
    throw ApiError.forbidden(
      'У вас нет доступа к этой записи.',
      'BOOKING_FORBIDDEN',
    );
  }
}

export async function requireAppointmentForClient(
  clientId: string,
  appointmentId: string,
): Promise<AppointmentAccessRow> {
  const row = await loadAppointmentById(appointmentId);
  if (!row) throw ApiError.notFound('Запись не найдена', 'BOOKING_NOT_FOUND');
  await assertClientAccess(row, clientId);
  return row;
}

export async function requireAppointmentForMaster(
  masterId: string,
  appointmentId: string,
): Promise<AppointmentAccessRow> {
  const row = await loadAppointmentById(appointmentId);
  if (!row) throw ApiError.notFound('Appointment not found', 'BOOKING_NOT_FOUND');
  assertMasterAccess(row, masterId);
  return row;
}

export async function requireAppointmentForClientByVoucher(
  clientId: string,
  voucherRaw: string,
): Promise<AppointmentAccessRow> {
  const row = await loadAppointmentByVoucher(voucherRaw);
  if (!row) throw ApiError.notFound('Запись не найдена', 'BOOKING_NOT_FOUND');
  await assertClientAccess(row, clientId);
  return row;
}

export async function requireAppointmentForMasterByVoucher(
  masterId: string,
  voucherRaw: string,
): Promise<AppointmentAccessRow> {
  const row = await loadAppointmentByVoucher(voucherRaw);
  if (!row) throw ApiError.notFound('Запись не найдена', 'BOOKING_NOT_FOUND');
  assertMasterAccess(row, masterId);
  return row;
}
