create table if not exists public.sponsor_requests (
  id uuid primary key default gen_random_uuid(),
  master_id uuid not null references public.master_profiles (master_id) on delete cascade,
  contact_name text not null,
  phone text not null,
  email text,
  company_name text,
  city text,
  message text not null,
  status text not null default 'pending'
    check (status in ('pending', 'in_review', 'closed', 'rejected')),
  admin_comment text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles (id) on delete set null
);

create index if not exists idx_sponsor_requests_master_pending
  on public.sponsor_requests (master_id)
  where status = 'pending';

create unique index if not exists idx_sponsor_requests_one_pending_per_master
  on public.sponsor_requests (master_id)
  where status in ('pending', 'in_review');

comment on table public.sponsor_requests is
  'Заявки мастеров на партнёрство / спонсорство SLOTTY.';
