import type { PoolClient } from 'pg';
import { withTransaction, query } from '../../config/db.js';
import { ApiError } from '../../utils/ApiError.js';
import { assertMasterMonthlyAppointmentsAllowNew } from '../billing/billing.service.js';
import {
  applyPromotionToPrice,
  resolveActivePromotionForSlot,
} from '../service-extras/promotionSlots.service.js';
import { assertMasterAcceptsBookings } from '../profiles/profileAccount.service.js';
import { notifyClientByAppointmentId } from './appointments.clientNotifications.js';
import {
  assertBookingReferencePhotoOwnership,
} from './appointments.storage.js';
import { categorySupportsReferencePhoto } from './referencePhotoCategories.js';
import { sanitizeMasterLocationForViewer } from '../../lib/sanitizeMasterLocation.js';
import { resolveClientNotifyLabel } from './clientNotifyLabel.js';

type SlotRow = {
  id: string;
  master_id: string;
  service_id: string | null;
  starts_at: Date | string;
  ends_at: Date | string;
  status: string;
};

export async function createAppointmentTx(input: {
  clientId: string;
  slotId: string;
  serviceId: string;
  clientNote?: string | null;
  clientReferencePhotoUrl?: string | null;
}) {
  return withTransaction(async (client: PoolClient) => {
    const slotRes = await client.query<SlotRow>(
      `select s.id, s.master_id, s.service_id, s.starts_at, s.ends_at, s.status::text
         from public.master_availability_slots s
        where s.id = $1
        for update`,
      [input.slotId],
    );
    const slot = slotRes.rows[0];
    if (!slot) {
      throw ApiError.notFound('Slot not found');
    }

    await assertMasterAcceptsBookings(slot.master_id);

    if (slot.status !== 'available') {
      throw ApiError.conflict('Slot is not available', 'SLOT_UNAVAILABLE');
    }

    const nowRow = await client.query<{ n: Date }>(`select now() as n`);
    const now = nowRow.rows[0]!.n;
    const slotStart = new Date(slot.starts_at as Date);
    if (slotStart <= now) {
      throw ApiError.conflict('Slot already started', 'SLOT_IN_PAST');
    }

    const svcRes = await client.query<{
      id: string;
      master_id: string;
      is_active: boolean;
      admin_hidden_at: Date | string | null;
      duration_minutes: number;
      price_amount: string;
      price_type: string;
      title: string;
      category_code: string | null;
    }>(
      `select ms.id, ms.master_id, ms.is_active, ms.admin_hidden_at, ms.duration_minutes, ms.price_amount::text, ms.price_type::text, ms.title,
              sc.code as category_code
         from public.master_services ms
         left join public.service_categories sc on sc.id = ms.category_id
        where ms.id = $1`,
      [input.serviceId],
    );
    const service = svcRes.rows[0];
    if (!service) {
      throw ApiError.notFound('Service not found');
    }
    if (!service.is_active || service.admin_hidden_at) {
      throw ApiError.conflict('Service inactive', 'SERVICE_INACTIVE');
    }
    if (service.master_id !== slot.master_id) {
      throw ApiError.conflict('Service does not belong to slot master', 'SERVICE_MASTER_MISMATCH');
    }
    if (slot.service_id != null && slot.service_id !== input.serviceId) {
      throw ApiError.conflict('Service does not match slot binding', 'SERVICE_SLOT_MISMATCH');
    }

    const slotEnd = new Date(slot.ends_at as Date);
    const apptEnd = new Date(slotStart.getTime() + service.duration_minutes * 60 * 1000);
    if (apptEnd > slotEnd) {
      throw ApiError.conflict('Service duration does not fit slot', 'SERVICE_DOES_NOT_FIT');
    }

    if (input.clientId === slot.master_id) {
      throw ApiError.conflict('Cannot book your own slot', 'SELF_BOOKING');
    }

    const referencePhotoUrl = input.clientReferencePhotoUrl?.trim() || null;
    if (referencePhotoUrl) {
      if (!categorySupportsReferencePhoto(service.category_code)) {
        throw ApiError.badRequest(
          'Reference photo is not supported for this service category',
          'REFERENCE_PHOTO_NOT_ALLOWED',
        );
      }
      assertBookingReferencePhotoOwnership(input.clientId, referencePhotoUrl);
    }

    const overlapMaster = await client.query(
      `select 1 from public.appointments a
        where a.master_id = $1
          and a.status in ('pending', 'confirmed')
          and tstzrange(a.starts_at, a.ends_at, '[)') && tstzrange($2::timestamptz, $3::timestamptz, '[)')`,
      [slot.master_id, slotStart.toISOString(), apptEnd.toISOString()],
    );
    if (overlapMaster.rowCount) {
      throw ApiError.conflict('Master has overlapping appointment', 'MASTER_OVERLAP');
    }

    const overlapClient = await client.query(
      `select 1 from public.appointments a
        where a.client_id = $1
          and a.status in ('pending', 'confirmed')
          and tstzrange(a.starts_at, a.ends_at, '[)') && tstzrange($2::timestamptz, $3::timestamptz, '[)')`,
      [input.clientId, slotStart.toISOString(), apptEnd.toISOString()],
    );
    if (overlapClient.rowCount) {
      throw ApiError.conflict('You already have an overlapping appointment', 'CLIENT_OVERLAP');
    }

    await assertMasterMonthlyAppointmentsAllowNew(client, slot.master_id);

    const basePrice = Number(service.price_amount);
    const activePromo = await resolveActivePromotionForSlot(
      client,
      input.slotId,
      slot.master_id,
      input.serviceId,
    );
    const priceSnapshot = activePromo
      ? String(
          applyPromotionToPrice(
            basePrice,
            activePromo.discount_type,
            Number(activePromo.discount_value),
          ),
        )
      : service.price_amount;

    const insAppt = await client.query<{ id: string }>(
      `insert into public.appointments (
         client_id, master_id, service_id, slot_id, starts_at, ends_at, status,
         price_snapshot, price_type_snapshot, service_title_snapshot, service_duration_snapshot,
         client_note, client_reference_photo_url
       ) values ($1, $2, $3, $4, $5, $6, 'pending', $7, $8::public.price_type, $9, $10, $11, $12)
       returning id`,
      [
        input.clientId,
        slot.master_id,
        input.serviceId,
        input.slotId,
        slotStart.toISOString(),
        apptEnd.toISOString(),
        priceSnapshot,
        service.price_type,
        service.title,
        service.duration_minutes,
        input.clientNote ?? null,
        referencePhotoUrl,
      ],
    );
    const appointmentId = insAppt.rows[0]!.id;

    await client.query(
      `update public.master_availability_slots set status = 'booked', updated_at = now() where id = $1`,
      [input.slotId],
    );

    // Уведомления клиенту и мастеру — после commit (полный текст с ваучером).

    const vRes = await client.query<{ n: string }>(
      `select 'SL-' || upper(substring(replace(gen_random_uuid()::text, '-', ''), 1, 12)) as n`,
    );
    const voucherNumber = vRes.rows[0]!.n;

    await client.query(`insert into public.booking_vouchers (appointment_id, voucher_number) values ($1, $2)`, [
      appointmentId,
      voucherNumber,
    ]);

    const clientProfileRes = await client.query<{
      full_name: string;
      phone: string | null;
      telegram_username: string | null;
    }>(
      `select coalesce(full_name, '') as full_name, phone, telegram_username
         from public.profiles where id = $1`,
      [input.clientId],
    );
    const masterNameRes = await client.query<{ n: string }>(
      `select coalesce(nullif(trim(display_name), ''), 'Мастер') as n from public.master_profiles where master_id = $1`,
      [slot.master_id],
    );
    const clientRow = clientProfileRes.rows[0];
    const clientDisplayName = resolveClientNotifyLabel(
      clientRow ?? { full_name: '', phone: null, telegram_username: null },
    );
    const clientPhone = clientRow?.phone?.trim() || null;
    const masterDisplayName = masterNameRes.rows[0]?.n ?? 'Мастер';

    return {
      appointmentId,
      clientId: input.clientId,
      masterId: slot.master_id,
      serviceTitle: service.title,
      startsAt: slotStart.toISOString(),
      endsAt: apptEnd.toISOString(),
      price: Number(service.price_amount),
      voucherNumber,
      clientDisplayName,
      clientPhone,
      masterDisplayName,
    };
  });
}

type ClientAppointmentRow = {
  id: string;
  master_id: string;
  service_id: string;
  slot_id: string;
  starts_at: Date | string;
  ends_at: Date | string;
  status: string;
  price_snapshot: string;
  service_title_snapshot: string;
  client_note: string | null;
  client_reference_photo_url: string | null;
  created_at: Date | string;
  master_display_name: string;
  location_visit_type: string | null;
  location_city: string | null;
  location_street: string | null;
  location_building: string | null;
  location_building_detail: string | null;
  location_public_address: string | null;
  location_entrance: string | null;
  location_floor: string | null;
  location_room: string | null;
  location_intercom: string | null;
  location_landmark: string | null;
  location_directions: string | null;
  location_client_note: string | null;
  location_lat: number | string | null;
  location_lng: number | string | null;
  location_show_exact_after_booking: boolean | null;
  voucher_number: string | null;
  has_review: boolean;
};

function mapClientAppointmentRow(row: ClientAppointmentRow, clientId: string) {
  const status = row.status;
  const loc =
    row.location_visit_type != null
      ? sanitizeMasterLocationForViewer(
          {
            visitType: row.location_visit_type,
            city: row.location_city ?? '',
            street: row.location_street ?? '',
            building: row.location_building ?? '',
            buildingDetail: row.location_building_detail,
            entrance: row.location_entrance,
            floor: row.location_floor,
            room: row.location_room,
            intercom: row.location_intercom,
            landmark: row.location_landmark,
            directions: row.location_directions,
            clientNote: row.location_client_note,
            publicAddress: row.location_public_address ?? '',
            lat: row.location_lat != null ? Number(row.location_lat) : null,
            lng: row.location_lng != null ? Number(row.location_lng) : null,
            showExactAddressAfterBooking: row.location_show_exact_after_booking === true,
          },
          {
            viewerProfileId: clientId,
            appointmentStatus: status,
          },
        )
      : null;

  return {
    id: row.id,
    master_id: row.master_id,
    service_id: row.service_id,
    slot_id: row.slot_id,
    starts_at: row.starts_at,
    ends_at: row.ends_at,
    status: row.status,
    price_snapshot: row.price_snapshot,
    service_title_snapshot: row.service_title_snapshot,
    client_note: row.client_note,
    client_reference_photo_url: row.client_reference_photo_url,
    created_at: row.created_at,
    master_display_name: row.master_display_name,
    location_visit_type: loc?.visitType ?? row.location_visit_type,
    location_city: loc?.city ?? row.location_city,
    location_street: loc?.street ?? row.location_street,
    location_building: loc?.building ?? row.location_building,
    location_public_address: loc?.publicAddress ?? row.location_public_address,
    location_lat: loc?.lat ?? null,
    location_lng: loc?.lng ?? null,
    voucher_number: row.voucher_number,
    has_review: row.has_review,
  };
}

const CLIENT_APPOINTMENTS_FROM = `
     from public.appointments a
     left join public.master_profiles mp on mp.master_id = a.master_id
     left join public.master_locations ml
       on ml.master_id = a.master_id
      and ml.is_primary = true
     left join public.booking_vouchers bv on bv.appointment_id = a.id`;

export type AppointmentsListTab = 'pending' | 'upcoming' | 'history' | 'active' | 'all';

export const MASTER_APPOINTMENTS_LIST_MAX = 200;

function appointmentsTabFilter(tab: AppointmentsListTab | undefined): string {
  switch (tab) {
    case 'pending':
      return `a.status = 'pending'`;
    case 'upcoming':
      return `a.status = 'confirmed' and a.starts_at >= now()`;
    case 'history':
      return `a.status in ('completed', 'no_show', 'cancelled_by_client', 'cancelled_by_master')`;
    case 'active':
      return `a.status in ('pending', 'confirmed')`;
    default:
      return 'true';
  }
}

function appointmentsTabOrder(tab: AppointmentsListTab | undefined): string {
  switch (tab) {
    case 'upcoming':
    case 'active':
      return 'a.starts_at asc';
    default:
      return 'a.starts_at desc';
  }
}

export async function listClientAppointments(
  clientId: string,
  params?: { limit?: number; offset?: number },
) {
  const limit = Math.min(Math.max(params?.limit ?? 30, 1), 100);
  const offset = Math.max(params?.offset ?? 0, 0);

  const countR = await query<{ total: string }>(
    `select count(*)::text as total from public.appointments a where a.client_id = $1`,
    [clientId],
  );
  const total = Number(countR.rows[0]?.total ?? 0);

  const r = await query<ClientAppointmentRow>(
    `select
       a.id,
       a.master_id,
       a.service_id,
       a.slot_id,
       a.starts_at,
       a.ends_at,
       a.status::text as status,
       a.price_snapshot::text as price_snapshot,
       a.service_title_snapshot,
       a.client_note,
       a.client_reference_photo_url,
       a.created_at,
       coalesce(mp.display_name, 'Мастер') as master_display_name,
       ml.visit_type::text as location_visit_type,
       ml.city as location_city,
       ml.street as location_street,
       ml.building as location_building,
       ml.building_detail as location_building_detail,
       ml.public_address as location_public_address,
       ml.entrance as location_entrance,
       ml.floor as location_floor,
       ml.room as location_room,
       ml.intercom as location_intercom,
       ml.landmark as location_landmark,
       ml.directions as location_directions,
       ml.client_note as location_client_note,
       ml.lat as location_lat,
       ml.lng as location_lng,
       ml.show_exact_address_after_booking as location_show_exact_after_booking,
       bv.voucher_number,
       exists (select 1 from public.reviews rv where rv.appointment_id = a.id) as has_review
     ${CLIENT_APPOINTMENTS_FROM}
    where a.client_id = $1
    order by a.starts_at desc
    limit $2 offset $3`,
    [clientId, limit, offset],
  );

  const items = r.rows.map((row) => mapClientAppointmentRow(row, clientId));
  const hasMore = offset + items.length < total;
  return { items, appointments: items, total, limit, offset, hasMore };
}

export type MasterAppointmentStatsDto = {
  pending: number;
  upcoming: number;
  history: number;
  completedCount: number;
  cancelledCount: number;
  earnedTotal: number;
};

export async function getMasterAppointmentStats(masterId: string): Promise<MasterAppointmentStatsDto> {
  const r = await query<{
    pending: number;
    upcoming: number;
    history: number;
    completed_count: number;
    cancelled_count: number;
    earned_total: string;
  }>(
    `select count(*) filter (where a.status = 'pending')::int as pending,
            count(*) filter (where a.status = 'confirmed' and a.starts_at >= now())::int as upcoming,
            count(*) filter (
              where a.status in ('completed', 'no_show', 'cancelled_by_client', 'cancelled_by_master')
            )::int as history,
            count(*) filter (where a.status in ('completed', 'no_show'))::int as completed_count,
            count(*) filter (
              where a.status in ('cancelled_by_client', 'cancelled_by_master')
            )::int as cancelled_count,
            coalesce(
              sum(a.price_snapshot) filter (where a.status in ('completed', 'no_show')),
              0
            )::text as earned_total
       from public.appointments a
      where a.master_id = $1`,
    [masterId],
  );
  const row = r.rows[0];
  return {
    pending: row?.pending ?? 0,
    upcoming: row?.upcoming ?? 0,
    history: row?.history ?? 0,
    completedCount: row?.completed_count ?? 0,
    cancelledCount: row?.cancelled_count ?? 0,
    earnedTotal: Number(row?.earned_total ?? 0),
  };
}

export async function listMasterAppointments(
  masterId: string,
  params?: { limit?: number; offset?: number; tab?: AppointmentsListTab },
) {
  const limit = Math.min(Math.max(params?.limit ?? 30, 1), MASTER_APPOINTMENTS_LIST_MAX);
  const offset = Math.max(params?.offset ?? 0, 0);
  const tab = params?.tab ?? 'all';
  const tabFilter = appointmentsTabFilter(tab);
  const orderBy = appointmentsTabOrder(tab);

  const countR = await query<{ total: string }>(
    `select count(*)::text as total
       from public.appointments a
      where a.master_id = $1 and (${tabFilter})`,
    [masterId],
  );
  const total = Number(countR.rows[0]?.total ?? 0);

  const r = await query(
    `select a.id, a.client_id, a.service_id, a.slot_id, a.starts_at, a.ends_at, a.status::text,
            a.price_snapshot::text, a.service_title_snapshot, a.client_note,
            a.client_reference_photo_url, a.created_at,
            coalesce(nullif(trim(p.full_name), ''), 'Клиент') as client_name,
            nullif(trim(p.phone), '') as client_phone,
            nullif(trim(p.avatar_url), '') as client_avatar_url
       from public.appointments a
       left join public.profiles p on p.id = a.client_id
      where a.master_id = $1 and (${tabFilter})
      order by ${orderBy}
      limit $2 offset $3`,
    [masterId, limit, offset],
  );
  const items = r.rows;
  const hasMore = offset + items.length < total;
  return { items, appointments: items, total, limit, offset, hasMore };
}

function normalizeCancelReason(reason?: string | null): string | null {
  const t = reason?.trim();
  return t && t.length > 0 ? t.slice(0, 2000) : null;
}

export async function cancelClientAppointment(
  clientId: string,
  appointmentId: string,
  reason?: string | null,
): Promise<{ masterId: string }> {
  const r = await query<{ status: string; master_id: string }>(
    `select status::text, master_id from public.appointments where id = $1 and client_id = $2`,
    [appointmentId, clientId],
  );
  const row = r.rows[0];
  if (!row) {
    throw ApiError.notFound('Appointment not found');
  }
  if (row.status !== 'pending' && row.status !== 'confirmed') {
    throw ApiError.conflict('Appointment cannot be cancelled', 'BAD_STATUS');
  }
  await query(
    `update public.appointments
        set status = 'cancelled_by_client', cancel_reason = $2, updated_at = now()
      where id = $1`,
    [appointmentId, normalizeCancelReason(reason)],
  );
  await query(
    `update public.master_availability_slots s
        set status = 'available', updated_at = now()
      from public.appointments a
      where a.id = $1 and s.id = a.slot_id and s.status = 'booked'`,
    [appointmentId],
  );

  void notifyClientByAppointmentId(appointmentId, 'cancelled_by_self');

  return { masterId: row.master_id };
}

export async function masterConfirmAppointment(masterId: string, appointmentId: string): Promise<{ clientId: string }> {
  const r = await query<{ status: string; client_id: string }>(
    `select status::text, client_id from public.appointments where id = $1 and master_id = $2`,
    [appointmentId, masterId],
  );
  const row = r.rows[0];
  if (!row) {
    throw ApiError.notFound('Appointment not found');
  }
  if (row.status !== 'pending') {
    throw ApiError.conflict('Only pending appointments can be confirmed', 'BAD_STATUS');
  }
  await query(`update public.appointments set status = 'confirmed', updated_at = now() where id = $1`, [
    appointmentId,
  ]);

  void notifyClientByAppointmentId(appointmentId, 'confirmed');

  return { clientId: row.client_id };
}

export async function masterCompleteAppointment(masterId: string, appointmentId: string): Promise<{ clientId: string }> {
  const r = await query<{ status: string; client_id: string }>(
    `select status::text, client_id from public.appointments where id = $1 and master_id = $2`,
    [appointmentId, masterId],
  );
  const row = r.rows[0];
  if (!row) {
    throw ApiError.notFound('Appointment not found');
  }
  if (row.status !== 'confirmed') {
    throw ApiError.conflict('Only confirmed appointments can be completed', 'BAD_STATUS');
  }
  await query(`update public.appointments set status = 'completed', updated_at = now() where id = $1`, [
    appointmentId,
  ]);

  void notifyClientByAppointmentId(appointmentId, 'completed');

  return { clientId: row.client_id };
}

export async function masterCancelAppointment(
  masterId: string,
  appointmentId: string,
  reason?: string | null,
): Promise<{ clientId: string }> {
  const r = await query<{ status: string; client_id: string }>(
    `select status::text, client_id from public.appointments where id = $1 and master_id = $2`,
    [appointmentId, masterId],
  );
  const row = r.rows[0];
  if (!row) {
    throw ApiError.notFound('Appointment not found');
  }
  if (row.status !== 'pending' && row.status !== 'confirmed') {
    throw ApiError.conflict('Appointment cannot be cancelled', 'BAD_STATUS');
  }
  const cancelReason = normalizeCancelReason(reason);
  if (!cancelReason) {
    throw ApiError.badRequest('Укажите причину отмены', 'CANCEL_REASON_REQUIRED');
  }
  await query(
    `update public.appointments
        set status = 'cancelled_by_master', cancel_reason = $2, updated_at = now()
      where id = $1`,
    [appointmentId, cancelReason],
  );
  await query(
    `update public.master_availability_slots s
        set status = 'available', updated_at = now()
      from public.appointments a
      where a.id = $1 and s.id = a.slot_id and s.status = 'booked'`,
    [appointmentId],
  );

  void notifyClientByAppointmentId(appointmentId, 'cancelled_by_master');

  return { clientId: row.client_id };
}
