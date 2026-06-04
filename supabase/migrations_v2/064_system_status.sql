-- SLOTTY — Status Center: компоненты, checks, инциденты, плановые работы

create type public.system_component_status as enum (
  'operational',
  'degraded',
  'partial_outage',
  'major_outage',
  'maintenance',
  'unknown'
);

create type public.system_incident_severity as enum (
  'low',
  'medium',
  'high',
  'critical'
);

create type public.system_incident_status as enum (
  'investigating',
  'identified',
  'monitoring',
  'resolved'
);

create type public.system_maintenance_status as enum (
  'scheduled',
  'in_progress',
  'completed',
  'cancelled'
);

create table if not exists public.system_status_components (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  name text not null,
  description text,
  category text not null default 'core',
  status public.system_component_status not null default 'unknown',
  is_public boolean not null default true,
  sort_order int not null default 0,
  last_checked_at timestamptz,
  last_success_at timestamptz,
  response_time_ms int,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.system_status_checks (
  id uuid primary key default gen_random_uuid(),
  component_id uuid not null references public.system_status_components (id) on delete cascade,
  status public.system_component_status not null,
  response_time_ms int,
  checked_at timestamptz not null default now(),
  error_message text,
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists idx_system_status_checks_component_at
  on public.system_status_checks (component_id, checked_at desc);

create table if not exists public.system_incidents (
  id uuid primary key default gen_random_uuid(),
  incident_code text not null unique,
  title text not null,
  description text,
  severity public.system_incident_severity not null default 'medium',
  status public.system_incident_status not null default 'investigating',
  affected_components text[] not null default '{}',
  started_at timestamptz not null default now(),
  resolved_at timestamptz,
  created_by_admin_id uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.system_incident_updates (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid not null references public.system_incidents (id) on delete cascade,
  status public.system_incident_status not null,
  message text not null,
  created_by_admin_id uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_system_incident_updates_incident
  on public.system_incident_updates (incident_id, created_at asc);

create table if not exists public.system_maintenance_windows (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  affected_components text[] not null default '{}',
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status public.system_maintenance_status not null default 'scheduled',
  created_by_admin_id uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_system_status_components_updated
before update on public.system_status_components
for each row execute function public.set_updated_at();

create trigger trg_system_incidents_updated
before update on public.system_incidents
for each row execute function public.set_updated_at();

create trigger trg_system_maintenance_windows_updated
before update on public.system_maintenance_windows
for each row execute function public.set_updated_at();

-- Seed компонентов (идемпотентно по key)
insert into public.system_status_components (key, name, description, category, sort_order, status)
values
  ('website', 'Веб-сайт SLOTTY', 'Публичные страницы и каталог', 'frontend', 10, 'unknown'),
  ('master_cabinet', 'Кабинет мастера', 'Раздел мастера и настройки', 'frontend', 20, 'unknown'),
  ('api', 'API', 'REST API платформы', 'core', 30, 'unknown'),
  ('auth', 'Авторизация Google / Telegram', 'Вход и привязка аккаунтов', 'core', 40, 'unknown'),
  ('catalog', 'Каталог мастеров', 'Поиск и карточки мастеров', 'product', 50, 'unknown'),
  ('booking', 'Записи / Booking lifecycle', 'Создание и статусы записей', 'product', 60, 'unknown'),
  ('telegram_bot', 'Telegram bot', 'Бот и Mini App', 'integrations', 70, 'unknown'),
  ('email_notifications', 'Email уведомления', 'Resend / email', 'integrations', 80, 'unknown'),
  ('payments_bepaid', 'Оплата / BePaid', 'Онлайн-оплата и webhook', 'billing', 90, 'unknown'),
  ('pro_subscription', 'Подписка Master Pro', 'Биллинг подписки', 'billing', 100, 'unknown'),
  ('maps', 'Карта / адреса', 'Геокодинг и карта', 'product', 110, 'unknown'),
  ('database', 'База данных', 'PostgreSQL', 'infrastructure', 120, 'unknown'),
  ('notification_worker', 'Notification worker', 'Очередь уведомлений', 'workers', 130, 'unknown'),
  ('billing_worker', 'Billing worker', 'Автопродление и списания', 'workers', 140, 'unknown')
on conflict (key) do update set
  name = excluded.name,
  description = excluded.description,
  category = excluded.category,
  sort_order = excluded.sort_order;
