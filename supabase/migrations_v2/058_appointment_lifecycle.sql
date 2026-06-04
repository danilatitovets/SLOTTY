-- Жизненный цикл записи: новые статусы, снимок контактов, audit-события.

alter type public.appointment_status add value if not exists 'client_arrived';
alter type public.appointment_status add value if not exists 'in_progress';

alter table public.appointments
  add column if not exists client_name_snapshot text,
  add column if not exists client_phone_snapshot text,
  add column if not exists client_email_snapshot text,
  add column if not exists client_telegram_username_snapshot text,
  add column if not exists client_telegram_id_snapshot bigint,
  add column if not exists booking_source text,
  add column if not exists service_duration_snapshot int,
  add column if not exists cancel_reason_category text;

create table if not exists public.booking_events (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.appointments (id) on delete cascade,
  event_type text not null,
  old_status text,
  new_status text,
  actor_user_id uuid references public.profiles (id) on delete set null,
  actor_role text not null default 'system',
  reason text,
  comment text,
  metadata jsonb,
  created_at timestamptz not null default now(),
  constraint booking_events_actor_role_check check (
    actor_role in ('client', 'master', 'admin', 'system')
  )
);

create index if not exists idx_booking_events_appointment on public.booking_events (appointment_id, created_at asc);

comment on table public.booking_events is 'История изменений записи (статусы, уведомления)';
