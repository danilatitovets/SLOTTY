-- Наборы услуг и акции мастера (кабинет → Услуги).

create table public.master_service_bundles (
  id uuid primary key default gen_random_uuid(),
  master_id uuid not null references public.master_profiles (master_id) on delete cascade,
  title text not null,
  description text not null default '',
  service_ids uuid[] not null default '{}',
  original_price numeric(12, 2) not null default 0,
  bundle_price numeric(12, 2) not null,
  discount_percent smallint not null default 0,
  discount_amount numeric(12, 2) not null default 0,
  duration_minutes integer not null default 0,
  image_url text,
  image_source text not null default 'placeholder',
  status text not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint master_service_bundles_status_check check (status in ('visible', 'hidden', 'draft')),
  constraint master_service_bundles_bundle_price_nonneg check (bundle_price >= 0::numeric)
);

create index idx_master_service_bundles_master on public.master_service_bundles (master_id, updated_at desc);

create table public.master_service_promotions (
  id uuid primary key default gen_random_uuid(),
  master_id uuid not null references public.master_profiles (master_id) on delete cascade,
  template text not null,
  title text not null,
  description text not null default '',
  service_id uuid not null references public.master_services (id) on delete cascade,
  discount_type text not null,
  discount_value numeric(12, 2) not null default 0,
  discount_label text not null default '',
  starts_at date not null,
  ends_at date not null,
  status text not null default 'draft',
  background_image text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint master_service_promotions_status_check check (
    status in ('active', 'scheduled', 'finished', 'draft')
  ),
  constraint master_service_promotions_discount_type_check check (
    discount_type in ('percent', 'money', 'gift')
  ),
  constraint master_service_promotions_dates_order check (ends_at >= starts_at)
);

create index idx_master_service_promotions_master on public.master_service_promotions (master_id, created_at desc);

create index idx_master_service_promotions_service on public.master_service_promotions (service_id);

alter table public.master_service_bundles enable row level security;

alter table public.master_service_promotions enable row level security;
