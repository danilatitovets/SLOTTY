create table if not exists public.master_profile_reports (
  id uuid primary key default gen_random_uuid(),
  master_id uuid not null references public.master_profiles (master_id) on delete cascade,
  reporter_id uuid references public.profiles (id) on delete set null,
  reason_code text not null
    check (reason_code in ('fake_profile', 'inappropriate_photos', 'scam', 'spam', 'harassment', 'other')),
  reason_text text,
  status text not null default 'pending'
    check (status in ('pending', 'in_review', 'closed', 'rejected')),
  admin_comment text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles (id) on delete set null
);

create index if not exists idx_master_profile_reports_master_created
  on public.master_profile_reports (master_id, created_at desc);

create index if not exists idx_master_profile_reports_status_created
  on public.master_profile_reports (status, created_at desc);

comment on table public.master_profile_reports is
  'Жалобы клиентов на публичный профиль мастера.';
