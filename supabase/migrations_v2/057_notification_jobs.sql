-- Планировщик уведомлений о записях (email / Telegram), в т.ч. напоминания за 1ч.

create table if not exists public.notification_jobs (
  id uuid primary key default gen_random_uuid(),
  job_type text not null,
  channel text not null,
  recipient_user_id uuid not null references public.profiles (id) on delete cascade,
  appointment_id uuid not null references public.appointments (id) on delete cascade,
  scheduled_at timestamptz not null,
  status text not null default 'pending',
  attempts int not null default 0,
  last_error text,
  provider_message_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint notification_jobs_type_check check (
    job_type in (
      'booking_client_pending',
      'booking_master_new',
      'booking_client_confirmed',
      'booking_client_cancelled',
      'booking_master_client_cancelled',
      'booking_reminder_1h',
      'booking_reminder_24h'
    )
  ),
  constraint notification_jobs_channel_check check (channel in ('email', 'telegram', 'in_app')),
  constraint notification_jobs_status_check check (
    status in ('pending', 'processing', 'sent', 'failed', 'cancelled', 'skipped')
  )
);

create index if not exists idx_notification_jobs_due
  on public.notification_jobs (scheduled_at)
  where status = 'pending';

create index if not exists idx_notification_jobs_appointment
  on public.notification_jobs (appointment_id, created_at desc);

create unique index if not exists idx_notification_jobs_active_dedupe
  on public.notification_jobs (appointment_id, job_type, channel, recipient_user_id)
  where status in ('pending', 'processing');

comment on table public.notification_jobs is 'Отложенные уведомления о записи (Resend / Telegram); worker забирает due jobs';
