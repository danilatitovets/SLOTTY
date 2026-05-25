-- SLOTTY — журнал попыток и смен тарифа (Pro / подписка) для админки платформы

create table public.subscription_billing_events (
  id uuid primary key default gen_random_uuid(),
  master_id uuid not null references public.master_profiles (master_id) on delete cascade,
  event_type text not null,
  plan_code text,
  billing_period text,
  amount numeric(12, 2),
  currency text not null default 'BYN',
  status text not null default 'recorded',
  source text not null default 'system',
  error_message text,
  metadata jsonb,
  created_at timestamptz not null default now()
);

comment on table public.subscription_billing_events is 'События биллинга: попытки оплаты Pro, смена тарифа, интерес к Pro';
comment on column public.subscription_billing_events.event_type is 'checkout_started | checkout_cancelled | plan_changed | pro_interest | payment_failed';
comment on column public.subscription_billing_events.source is 'mock | onboarding | admin | payment_gateway (будущее)';

create index idx_subscription_billing_events_master_created
  on public.subscription_billing_events (master_id, created_at desc);

create index idx_subscription_billing_events_type
  on public.subscription_billing_events (event_type, created_at desc);
