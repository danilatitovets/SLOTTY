/**
 * E2E: cancel appointment → same slot_id can be booked again.
 * Requires: API running, DATABASE_URL, migration 043 applied.
 *
 * Usage: API=http://127.0.0.1:4000 tsx src/scripts/e2eSlotRebookAfterCancel.ts
 */
import { connectE2ePg } from './e2eDb.js';

async function main() {
  const pg = await connectE2ePg();

  const slot = await pg.query<{ id: string; master_id: string }>(
    `select s.id, s.master_id
       from public.master_availability_slots s
       join public.master_services ms on ms.master_id = s.master_id and ms.is_active
      where s.status = 'available'::public.slot_status
        and s.starts_at > now() + interval '2 days'
      limit 1`,
  );
  const row = slot.rows[0];
  if (!row) {
    console.error('No available future slot found — seed data required');
    process.exit(1);
  }

  const svc = await pg.query<{ id: string }>(
    `select id from public.master_services where master_id = $1 and is_active limit 1`,
    [row.master_id],
  );
  const serviceId = svc.rows[0]?.id;
  if (!serviceId) {
    console.error('No active service for master');
    process.exit(1);
  }

  const client = await pg.query<{ id: string }>(
    `select id from public.profiles where role = 'client' limit 1`,
  );
  const clientId = client.rows[0]?.id;
  if (!clientId) {
    console.error('No client profile');
    process.exit(1);
  }

  const appt1 = await pg.query<{ id: string }>(
    `insert into public.appointments (
       client_id, master_id, service_id, slot_id, starts_at, ends_at, status,
       price_snapshot, price_type_snapshot, service_title_snapshot, service_duration_snapshot
     )
     select $1, $2, $3, $4, s.starts_at,
            s.starts_at + (ms.duration_minutes * interval '1 minute'),
            'pending'::public.appointment_status,
            ms.price_amount, ms.price_type, ms.title, ms.duration_minutes
       from public.master_availability_slots s
       join public.master_services ms on ms.id = $3
      where s.id = $4
     returning id`,
    [clientId, row.master_id, serviceId, row.id],
  );
  const apptId = appt1.rows[0]?.id;
  if (!apptId) {
    console.error('Failed to create first appointment');
    process.exit(1);
  }
  console.log('Created appointment', apptId);

  await pg.query(
    `update public.appointments
        set status = 'cancelled_by_client'::public.appointment_status, updated_at = now()
      where id = $1`,
    [apptId],
  );
  console.log('Cancelled appointment');

  try {
    const appt2 = await pg.query<{ id: string }>(
      `insert into public.appointments (
         client_id, master_id, service_id, slot_id, starts_at, ends_at, status,
         price_snapshot, price_type_snapshot, service_title_snapshot, service_duration_snapshot
       )
       select $1, $2, $3, $4, s.starts_at,
              s.starts_at + (ms.duration_minutes * interval '1 minute'),
              'pending'::public.appointment_status,
              ms.price_amount, ms.price_type, ms.title, ms.duration_minutes
         from public.master_availability_slots s
         join public.master_services ms on ms.id = $3
        where s.id = $4
       returning id`,
      [clientId, row.master_id, serviceId, row.id],
    );
    const appt2Id = appt2.rows[0]?.id;
    if (!appt2Id) throw new Error('no second appointment');
    console.log('PASS: rebooked same slot_id after cancel', appt2Id);
    await pg.query(`delete from public.appointments where id in ($1, $2)`, [apptId, appt2Id]);
  } catch (e) {
    console.error('FAIL: could not rebook slot after cancel', e);
    await pg.query(`delete from public.appointments where id = $1`, [apptId]);
    process.exit(1);
  } finally {
    await pg.end();
  }
}

void main();
