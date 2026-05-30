-- Надёжная доставка напоминаний: pending → sent / failed с retry

alter table public.appointment_reminder_deliveries
  add column if not exists status text,
  add column if not exists failed_at timestamptz,
  add column if not exists error_message text,
  add column if not exists retry_count integer not null default 0,
  add column if not exists created_at timestamptz not null default now();

update public.appointment_reminder_deliveries
   set status = 'sent'
 where status is null;

alter table public.appointment_reminder_deliveries
  alter column status set not null,
  alter column status set default 'pending';

alter table public.appointment_reminder_deliveries
  alter column sent_at drop not null,
  alter column sent_at drop default;

alter table public.appointment_reminder_deliveries
  drop constraint if exists appointment_reminder_deliveries_status_check;

alter table public.appointment_reminder_deliveries
  add constraint appointment_reminder_deliveries_status_check
  check (status in ('pending', 'sent', 'failed'));

comment on column public.appointment_reminder_deliveries.status is 'pending — в процессе; sent — доставлено; failed — ошибка, возможен retry';
