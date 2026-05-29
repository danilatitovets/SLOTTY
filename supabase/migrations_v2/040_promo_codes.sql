-- Промокоды на подписку Pro и учёт применений

create table if not exists public.promo_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  title text,
  discount_percent smallint not null,
  applies_to_plan text not null default 'pro',
  billing_period public.billing_period,
  max_redemptions integer,
  redemption_count integer not null default 0,
  valid_from timestamptz,
  valid_until timestamptz,
  is_active boolean not null default true,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint promo_codes_code_key unique (code),
  constraint promo_codes_discount_percent_range check (
    discount_percent >= 1 and discount_percent <= 100
  ),
  constraint promo_codes_max_redemptions_nonneg check (
    max_redemptions is null or max_redemptions >= 1
  )
);

create unique index if not exists idx_promo_codes_code_upper on public.promo_codes (upper(trim(code)));

create table if not exists public.promo_code_redemptions (
  id uuid primary key default gen_random_uuid(),
  promo_code_id uuid not null references public.promo_codes (id) on delete restrict,
  master_id uuid not null references public.master_profiles (master_id) on delete cascade,
  billing_period public.billing_period not null,
  base_amount numeric(12, 2) not null,
  discount_amount numeric(12, 2) not null,
  final_amount numeric(12, 2) not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_promo_code_redemptions_promo
  on public.promo_code_redemptions (promo_code_id, created_at desc);

create index if not exists idx_promo_code_redemptions_master
  on public.promo_code_redemptions (master_id, created_at desc);

comment on table public.promo_codes is 'Промокоды на скидку при покупке тарифа';
comment on column public.promo_codes.billing_period is 'null = месяц и год; иначе только выбранный период';
comment on table public.promo_code_redemptions is 'Факт применения промокода при оплате подписки';
