-- Двусторонний lifecycle: подтверждение выполнения, споры, auto-complete.

alter type public.appointment_status add value if not exists 'master_marked_completed';
alter type public.appointment_status add value if not exists 'client_confirmed_completed';
alter type public.appointment_status add value if not exists 'disputed_by_client';
alter type public.appointment_status add value if not exists 'disputed_by_master';
alter type public.appointment_status add value if not exists 'cancelled_by_admin';
alter type public.appointment_status add value if not exists 'expired';

alter table public.appointments
  add column if not exists master_marked_completed_at timestamptz,
  add column if not exists client_confirmed_completed_at timestamptz,
  add column if not exists completed_at timestamptz,
  add column if not exists auto_completed_at timestamptz,
  add column if not exists disputed_at timestamptz,
  add column if not exists no_show_at timestamptz;

create type public.booking_dispute_status as enum ('open', 'in_review', 'resolved', 'rejected');

create table if not exists public.booking_disputes (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.appointments (id) on delete cascade,
  created_by_user_id uuid not null references public.profiles (id) on delete cascade,
  created_by_role text not null,
  reason text not null,
  comment text,
  status public.booking_dispute_status not null default 'open',
  resolution text,
  resolved_by_admin_id uuid references public.profiles (id) on delete set null,
  admin_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint booking_disputes_role_check check (created_by_role in ('client', 'master'))
);

create index if not exists idx_booking_disputes_status on public.booking_disputes (status, created_at desc);

create unique index if not exists idx_booking_disputes_one_open
  on public.booking_disputes (appointment_id)
  where status in ('open', 'in_review');

create table if not exists public.booking_completion_jobs (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.appointments (id) on delete cascade,
  run_after timestamptz not null,
  status text not null default 'pending',
  attempts int not null default 0,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint booking_completion_jobs_status_check check (status in ('pending', 'processing', 'done', 'cancelled')),
  constraint booking_completion_jobs_appointment_unique unique (appointment_id)
);

create index if not exists idx_booking_completion_jobs_due
  on public.booking_completion_jobs (run_after)
  where status = 'pending';

comment on table public.booking_disputes is 'Жалобы/споры по записи';
comment on table public.booking_completion_jobs is 'Отложенное auto-complete после master_marked_completed';
