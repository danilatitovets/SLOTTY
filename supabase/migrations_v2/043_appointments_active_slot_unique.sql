-- Allow rebooking a slot after cancel/complete: unique only for active appointments.

alter table public.appointments
  drop constraint if exists appointments_slot_id_key;

drop index if exists public.appointments_slot_id_key;

create unique index if not exists appointments_active_slot_id_idx
  on public.appointments (slot_id)
  where status in (
    'pending'::public.appointment_status,
    'confirmed'::public.appointment_status
  );
