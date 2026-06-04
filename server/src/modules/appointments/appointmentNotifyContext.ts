import { query } from '../../config/db.js';
import { resolveClientNotifyLabel, type ClientProfileNotifyFields } from './clientNotifyLabel.js';
import { formatServiceName } from '../../lib/displayFormat.js';

export type AppointmentNotifyContext = {
  appointmentId: string;
  clientId: string;
  masterId: string;
  serviceTitle: string;
  startsAt: string;
  voucherNumber: string | null;
  clientName: string;
  clientPhone: string | null;
  masterName: string;
};

export async function fetchAppointmentNotifyContext(
  appointmentId: string,
): Promise<AppointmentNotifyContext | null> {
  const r = await query<{
    id: string;
    client_id: string;
    master_id: string;
    service_title_snapshot: string;
    starts_at: Date | string;
    voucher_number: string | null;
    full_name: string;
    phone: string | null;
    telegram_username: string | null;
    master_name: string;
  }>(
    `select a.id, a.client_id, a.master_id, a.service_title_snapshot, a.starts_at,
            bv.voucher_number,
            coalesce(pc.full_name, '') as full_name,
            pc.phone,
            pc.telegram_username,
            coalesce(nullif(trim(mp.display_name), ''), 'Мастер') as master_name
       from public.appointments a
       join public.profiles pc on pc.id = a.client_id
       join public.master_profiles mp on mp.master_id = a.master_id
       left join public.booking_vouchers bv on bv.appointment_id = a.id
      where a.id = $1`,
    [appointmentId],
  );
  const row = r.rows[0];
  if (!row) return null;

  const startsAt =
    row.starts_at instanceof Date ? row.starts_at.toISOString() : String(row.starts_at);

  const clientFields: ClientProfileNotifyFields = {
    full_name: row.full_name,
    phone: row.phone,
    telegram_username: row.telegram_username,
  };

  return {
    appointmentId: row.id,
    clientId: row.client_id,
    masterId: row.master_id,
    serviceTitle: formatServiceName(row.service_title_snapshot),
    startsAt,
    voucherNumber: row.voucher_number,
    clientName: resolveClientNotifyLabel(clientFields),
    clientPhone: row.phone?.trim() || null,
    masterName: row.master_name,
  };
}
