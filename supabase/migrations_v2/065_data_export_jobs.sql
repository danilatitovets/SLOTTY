-- Экспорт данных кабинета мастера (ZIP-архив с Excel / Word).

create type public.data_export_job_status as enum (
  'pending',
  'processing',
  'ready',
  'failed',
  'expired'
);

create type public.data_export_format as enum ('zip');

create table if not exists public.data_export_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  master_profile_id uuid not null references public.master_profiles (master_id) on delete cascade,
  status public.data_export_job_status not null default 'pending',
  format public.data_export_format not null default 'zip',
  storage_path text,
  file_url text,
  expires_at timestamptz,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_data_export_jobs_user_created
  on public.data_export_jobs (user_id, created_at desc);

create index if not exists idx_data_export_jobs_status_created
  on public.data_export_jobs (status, created_at asc)
  where status in ('pending', 'processing');

create table if not exists public.data_export_audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  job_id uuid references public.data_export_jobs (id) on delete set null,
  action text not null,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_data_export_audit_user_created
  on public.data_export_audit_logs (user_id, created_at desc);

comment on table public.data_export_jobs is 'Запросы мастера на экспорт данных кабинета (ZIP)';
comment on table public.data_export_audit_logs is 'Audit trail действий экспорта данных';
