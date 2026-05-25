-- Platform admin: profile account status, audit log, moderation fields

create type public.profile_account_status as enum ('active', 'restricted', 'blocked', 'deleted');

alter table public.profiles
  add column if not exists account_status public.profile_account_status not null default 'active',
  add column if not exists blocked_at timestamptz,
  add column if not exists blocked_reason text,
  add column if not exists blocked_by uuid references public.profiles (id) on delete set null,
  add column if not exists access_restricted_until timestamptz,
  add column if not exists access_restriction_reason text;

create index if not exists idx_profiles_account_status on public.profiles (account_status);

comment on column public.profiles.account_status is 'active | restricted | blocked | deleted';

create table if not exists public.admin_audit_logs (
  id uuid primary key default gen_random_uuid (),
  admin_user_id uuid not null references public.profiles (id) on delete restrict,
  action text not null,
  entity_type text not null,
  entity_id text not null,
  target_user_id uuid references public.profiles (id) on delete set null,
  reason text,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_admin_audit_logs_created on public.admin_audit_logs (created_at desc);

create index if not exists idx_admin_audit_logs_admin on public.admin_audit_logs (admin_user_id, created_at desc);

alter table public.master_profiles
  add column if not exists admin_hidden_reason text,
  add column if not exists admin_paused_at timestamptz,
  add column if not exists admin_pause_reason text;

alter table public.master_services
  add column if not exists admin_hidden_reason text,
  add column if not exists admin_hidden_at timestamptz;

-- paused publication status for platform moderation
alter type public.master_publication_status add value if not exists 'paused';
