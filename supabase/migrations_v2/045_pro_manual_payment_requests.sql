create table if not exists public.pro_manual_payment_requests (
  id uuid primary key default gen_random_uuid(),
  master_id uuid not null references public.master_profiles (master_id) on delete cascade,
  payer_full_name text not null,
  tariff_amount numeric(10, 2) not null,
  declared_paid_amount numeric(10, 2) not null,
  received_amount numeric(10, 2),
  bank_fee_amount numeric(10, 2),
  fee_covered_by text not null default 'slotty'
    check (fee_covered_by in ('slotty', 'master', 'other')),
  currency text not null default 'BYN',
  billing_period public.billing_period not null default 'month'::public.billing_period,
  paid_at date,
  payment_comment text not null,
  receipt_url text,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected', 'cancelled')),
  admin_note text,
  rejection_reason text,
  tax_receipt_created boolean not null default false,
  tax_receipt_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles (id) on delete set null
);

create index if not exists idx_pro_manual_payment_requests_master
  on public.pro_manual_payment_requests (master_id, created_at desc);

create index if not exists idx_pro_manual_payment_requests_status
  on public.pro_manual_payment_requests (status, created_at desc);

create unique index if not exists idx_pro_manual_payment_one_pending_per_master
  on public.pro_manual_payment_requests (master_id)
  where status = 'pending';

comment on table public.pro_manual_payment_requests is
  'Заявки мастеров на ручную оплату тарифа Pro (банковский перевод, проверка админом).';
