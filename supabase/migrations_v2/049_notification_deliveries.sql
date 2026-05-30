-- Минимальный лог доставки (Telegram) для диагностики

create table public.notification_deliveries (
  id uuid primary key default gen_random_uuid (),
  notification_id uuid references public.notifications (id) on delete set null,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  channel text not null,
  status text not null,
  dedupe_key text,
  error_message text,
  sent_at timestamptz,
  failed_at timestamptz,
  created_at timestamptz not null default now(),
  constraint notification_deliveries_channel_check check (channel in ('telegram')),
  constraint notification_deliveries_status_check check (status in ('sent', 'failed', 'skipped'))
);

create index idx_notification_deliveries_profile_created on public.notification_deliveries (profile_id, created_at desc);

create index idx_notification_deliveries_notification on public.notification_deliveries (notification_id)
where
  notification_id is not null;

comment on table public.notification_deliveries is 'Лог попыток доставки уведомлений по каналам (сейчас Telegram)';
