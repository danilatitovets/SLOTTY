create table if not exists public.category_change_requests (
  id uuid primary key default gen_random_uuid(),
  master_id uuid not null references public.master_profiles (master_id) on delete cascade,
  current_category_id uuid references public.service_categories (id) on delete set null,
  requested_category_id uuid not null references public.service_categories (id) on delete restrict,
  reason text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  admin_comment text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles (id) on delete set null
);

create index if not exists idx_category_change_requests_master_pending
  on public.category_change_requests (master_id)
  where status = 'pending';

create unique index if not exists idx_category_change_requests_one_pending_per_master
  on public.category_change_requests (master_id)
  where status = 'pending';
