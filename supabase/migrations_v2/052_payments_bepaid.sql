-- SLOTTY — платежи через bePaid (checkout + webhook)

create type public.payment_provider as enum ('bepaid');

create type public.payment_type as enum (
  'master_pro_plan',
  'appointment_prepayment'
);

create type public.payment_status as enum (
  'pending',
  'success',
  'failed',
  'expired',
  'cancelled',
  'refunded'
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete restrict,
  provider public.payment_provider not null default 'bepaid',
  payment_type public.payment_type not null,
  status public.payment_status not null default 'pending',
  amount_minor integer not null check (amount_minor > 0),
  currency text not null default 'BYN',
  master_id uuid references public.master_profiles (master_id) on delete set null,
  appointment_id uuid references public.appointments (id) on delete set null,
  plan_id uuid references public.subscription_plans (id) on delete set null,
  billing_period public.billing_period,
  tracking_id text not null,
  bepaid_checkout_token text,
  bepaid_transaction_uid text,
  bepaid_redirect_url text,
  payment_method_brand text,
  payment_method_type text,
  error_message text,
  provider_payload jsonb,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint payments_tracking_id_key unique (tracking_id),
  constraint payments_bepaid_checkout_token_key unique (bepaid_checkout_token),
  constraint payments_bepaid_transaction_uid_key unique (bepaid_transaction_uid)
);

create index idx_payments_profile_created on public.payments (profile_id, created_at desc);
create index idx_payments_status_created on public.payments (status, created_at desc);
create index idx_payments_type_created on public.payments (payment_type, created_at desc);
create index idx_payments_master_id on public.payments (master_id) where master_id is not null;

create table public.payment_status_events (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid not null references public.payments (id) on delete cascade,
  from_status public.payment_status,
  to_status public.payment_status not null,
  source text not null,
  note text,
  payload jsonb,
  created_at timestamptz not null default now()
);

create index idx_payment_status_events_payment on public.payment_status_events (payment_id, created_at asc);

create trigger trg_payments_updated
before update on public.payments
for each row execute function public.set_updated_at();

comment on table public.payments is 'Платежи SLOTTY через bePaid (и другие провайдеры в будущем)';
comment on column public.payments.amount_minor is 'Сумма в минимальных единицах валюты (копейки для BYN)';
comment on column public.payments.tracking_id is 'Идентификатор заказа в bePaid (обычно UUID платежа SLOTTY)';

alter table public.payments enable row level security;
alter table public.payment_status_events enable row level security;

-- Доступ только через service role / backend (RLS без политик для anon/authenticated)
