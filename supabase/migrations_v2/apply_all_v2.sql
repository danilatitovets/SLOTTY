/*
  SLOTTY DB v2 — ОДИН ФАЙЛ для ручного применения в Supabase SQL Editor.

  Сгенерировано: scripts/build-apply-all-v2.mjs
  НЕ редактировать вручную — пересоберите: npm run db:v2:build-all

  ВНИМАНИЕ
  - Применять ТОЛЬКО на чистой ТЕСТОВОЙ базе Supabase (новый проект или пустая public).
  - НЕ применять на production с уже применёнными миграциями.
  - Старая схема v1 (supabase/schema.sql) КОНФЛИКТУЕТ с v2.
  - Для существующей БД используйте npm run db:v2:migrate (инкрементально).

  Содержимое = миграции 001 … 043 по порядку.
  После успешного выполнения: npm run db:v2:smoke
*/


-- ======================================================================
-- FILE: 001_extensions_and_enums.sql
-- ======================================================================

-- SLOTTY DB v2 — extensions and enum types
-- Apply to an EMPTY project or after removing legacy v1 objects from public schema.

create extension if not exists pgcrypto;

-- --------------------------------------------------------------------------- enums

create type public.user_role as enum ('client', 'master', 'platform_admin');

create type public.master_publication_status as enum ('draft', 'published', 'hidden', 'blocked');

create type public.visit_type as enum ('studio', 'at_home');

create type public.price_type as enum ('fixed', 'from');

create type public.slot_status as enum ('available', 'booked', 'blocked', 'expired');

create type public.slot_source as enum ('manual', 'generated');

create type public.appointment_status as enum (
  'pending',
  'confirmed',
  'completed',
  'cancelled_by_client',
  'cancelled_by_master',
  'no_show'
);

create type public.review_status as enum ('published', 'hidden');

create type public.career_item_type as enum ('education', 'course', 'practice', 'work');

create type public.subscription_status as enum (
  'active',
  'trialing',
  'past_due',
  'cancelled',
  'incomplete'
);

create type public.billing_period as enum ('month', 'year');

create type public.notification_type as enum (
  'appointment_new',
  'appointment_confirmed',
  'appointment_reminder',
  'appointment_cancelled',
  'review_request',
  'billing',
  'system'
);

-- ======================================================================
-- FILE: 002_profiles.sql
-- ======================================================================

-- SLOTTY DB v2 — profiles + optional telegram_identities

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  telegram_user_id bigint,
  telegram_username text,
  full_name text not null,
  avatar_url text,
  role public.user_role not null default 'client',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_telegram_user_id_key unique (telegram_user_id)
);

comment on table public.profiles is 'One row per auth user; id = auth.users.id';
comment on column public.profiles.telegram_user_id is 'Telegram numeric user id; optional unique handle';

create table public.telegram_identities (
  profile_id uuid primary key references public.profiles (id) on delete cascade,
  telegram_user_id bigint not null,
  telegram_username text,
  last_init_validated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint telegram_identities_telegram_user_id_key unique (telegram_user_id)
);

comment on table public.telegram_identities is 'Optional 1:1 audit layer for Telegram linkage; profiles still cache telegram_user_id for convenience';

create index idx_profiles_role on public.profiles (role);

-- ======================================================================
-- FILE: 003_masters_and_categories.sql
-- ======================================================================

-- SLOTTY DB v2 — service categories + master_profiles (PK = master_id)

create table public.service_categories (
  id uuid primary key default gen_random_uuid (),
  code text not null,
  name text not null,
  sort_order smallint not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint service_categories_code_key unique (code)
);

comment on column public.service_categories.code is 'Stable machine code, e.g. manicure, barbers';

create table public.master_profiles (
  master_id uuid primary key references public.profiles (id) on delete cascade,
  display_name text not null,
  slug text,
  primary_category_id uuid references public.service_categories (id) on delete set null,
  bio text not null default '',
  phone text,
  contact text,
  photo_url text,
  publication_status public.master_publication_status not null default 'draft',
  rating_avg numeric(3, 2) not null default 0,
  constraint master_profiles_rating_avg_range check (
    rating_avg >= 0::numeric
    and rating_avg <= 5::numeric
  ),
  reviews_count integer not null default 0,
  constraint master_profiles_reviews_count_nonneg check (reviews_count >= 0),
  global_buffer_minutes smallint not null default 15,
  constraint master_profiles_global_buffer_range check (
    global_buffer_minutes >= 0
    and global_buffer_minutes <= 240
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint master_profiles_slug_key unique (slug)
);

create index idx_master_profiles_publication on public.master_profiles (publication_status);

create index idx_master_profiles_primary_category on public.master_profiles (primary_category_id);

-- ======================================================================
-- FILE: 004_services_locations_rules.sql
-- ======================================================================

-- SLOTTY DB v2 — services, locations, weekly rules, booking rules text

create table public.master_services (
  id uuid primary key default gen_random_uuid (),
  master_id uuid not null references public.master_profiles (master_id) on delete cascade,
  category_id uuid not null references public.service_categories (id) on delete restrict,
  title text not null,
  description text not null default '',
  duration_minutes smallint not null,
  constraint master_services_duration_positive check (duration_minutes > 0),
  price_amount numeric(12, 2) not null,
  constraint master_services_price_nonneg check (price_amount >= 0::numeric),
  price_type public.price_type not null default 'fixed',
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_master_services_master on public.master_services (master_id);

create index idx_master_services_master_active on public.master_services (master_id, is_active, sort_order);

create index idx_master_services_category on public.master_services (category_id);

create table public.master_locations (
  id uuid primary key default gen_random_uuid (),
  master_id uuid not null references public.master_profiles (master_id) on delete cascade,
  visit_type public.visit_type not null,
  city text not null,
  street text not null,
  building text not null,
  building_detail text,
  entrance text,
  floor text,
  room text,
  intercom text,
  landmark text,
  directions text,
  client_note text,
  lat double precision,
  lng double precision,
  public_address text not null,
  is_primary boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index master_locations_one_primary_per_master on public.master_locations (master_id)
where
  is_primary = true;

create index idx_master_locations_master on public.master_locations (master_id);

create table public.master_schedule_rules (
  id uuid primary key default gen_random_uuid (),
  master_id uuid not null references public.master_profiles (master_id) on delete cascade,
  weekday smallint not null,
  constraint master_schedule_rules_weekday_range check (
    weekday >= 0
    and weekday <= 6
  ),
  start_time time not null,
  end_time time not null,
  constraint master_schedule_rules_time_order check (end_time > start_time),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint master_schedule_rules_master_weekday_window unique (master_id, weekday, start_time, end_time)
);

comment on column public.master_schedule_rules.weekday is '0 = Sunday … 6 = Saturday (same as JS Date.getDay())';

create index idx_master_schedule_rules_master_day on public.master_schedule_rules (master_id, weekday)
where
  is_active = true;

create table public.master_booking_rules (
  master_id uuid primary key references public.master_profiles (master_id) on delete cascade,
  booking_rules text,
  cancellation_policy text,
  payment_note text,
  updated_at timestamptz not null default now()
);

-- ======================================================================
-- FILE: 005_schedule_and_slots.sql
-- ======================================================================

-- SLOTTY DB v2 — concrete availability slots

create table public.master_availability_slots (
  id uuid primary key default gen_random_uuid (),
  master_id uuid not null references public.master_profiles (master_id) on delete cascade,
  service_id uuid references public.master_services (id) on delete set null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  constraint master_availability_slots_time_order check (ends_at > starts_at),
  status public.slot_status not null default 'available',
  source public.slot_source not null default 'manual',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_master_availability_slots_master_starts on public.master_availability_slots (master_id, starts_at);

create index idx_master_availability_slots_master_status_starts on public.master_availability_slots (master_id, status, starts_at);

create index idx_master_availability_slots_available_only on public.master_availability_slots (master_id, starts_at)
where
  status = 'available';

-- ======================================================================
-- FILE: 006_appointments.sql
-- ======================================================================

-- SLOTTY DB v2 — appointments (snapshots + unique slot)

create table public.appointments (
  id uuid primary key default gen_random_uuid (),
  client_id uuid not null references public.profiles (id) on delete restrict,
  master_id uuid not null references public.master_profiles (master_id) on delete restrict,
  service_id uuid not null references public.master_services (id) on delete restrict,
  slot_id uuid not null unique references public.master_availability_slots (id) on delete restrict,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  constraint appointments_time_order check (ends_at > starts_at),
  status public.appointment_status not null default 'pending',
  price_snapshot numeric(12, 2) not null,
  price_type_snapshot public.price_type not null,
  service_title_snapshot text not null,
  service_duration_snapshot smallint not null,
  constraint appointments_service_duration_positive check (service_duration_snapshot > 0),
  client_note text,
  cancel_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint appointments_no_self_booking check (client_id <> master_id)
);

create index idx_appointments_client_starts on public.appointments (client_id, starts_at desc);

create index idx_appointments_master_starts on public.appointments (master_id, starts_at desc);

create index idx_appointments_master_status_starts on public.appointments (master_id, status, starts_at);

-- ======================================================================
-- FILE: 007_favorites_reviews_notifications.sql
-- ======================================================================

-- SLOTTY DB v2 — favorites, reviews, notifications

create table public.favorite_masters (
  client_id uuid not null references public.profiles (id) on delete cascade,
  master_id uuid not null references public.master_profiles (master_id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (client_id, master_id)
);

create index idx_favorite_masters_master on public.favorite_masters (master_id);

create table public.reviews (
  id uuid primary key default gen_random_uuid (),
  appointment_id uuid not null unique references public.appointments (id) on delete cascade,
  client_id uuid not null references public.profiles (id) on delete cascade,
  master_id uuid not null references public.master_profiles (master_id) on delete cascade,
  rating smallint not null,
  constraint reviews_rating_range check (
    rating >= 1
    and rating <= 5
  ),
  body text not null,
  status public.review_status not null default 'published',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_reviews_master_status_created on public.reviews (master_id, status, created_at desc);

create table public.notifications (
  id uuid primary key default gen_random_uuid (),
  user_id uuid not null references public.profiles (id) on delete cascade,
  type public.notification_type not null,
  title text not null,
  body text not null,
  related_entity_type text,
  related_entity_id uuid,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_notifications_user_created on public.notifications (user_id, created_at desc);

create index idx_notifications_user_unread on public.notifications (user_id)
where
  read_at is null;

-- ======================================================================
-- FILE: 008_trust_profile.sql
-- ======================================================================

-- SLOTTY DB v2 — portfolio, certificates, career

create table public.master_portfolio_items (
  id uuid primary key default gen_random_uuid (),
  master_id uuid not null references public.master_profiles (master_id) on delete cascade,
  image_url text not null,
  title text,
  description text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_master_portfolio_master on public.master_portfolio_items (master_id, sort_order);

create table public.master_certificates (
  id uuid primary key default gen_random_uuid (),
  master_id uuid not null references public.master_profiles (master_id) on delete cascade,
  title text not null,
  issuer text not null,
  year smallint,
  image_url text,
  description text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_master_certificates_master on public.master_certificates (master_id, sort_order);

create table public.master_career_items (
  id uuid primary key default gen_random_uuid (),
  master_id uuid not null references public.master_profiles (master_id) on delete cascade,
  type public.career_item_type not null,
  title text not null,
  place text not null,
  start_year smallint,
  end_year smallint,
  description text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_master_career_master on public.master_career_items (master_id, sort_order);

-- ======================================================================
-- FILE: 009_billing_and_vouchers.sql
-- ======================================================================

-- SLOTTY DB v2 — payment methods, subscriptions, vouchers

create table public.payment_methods (
  id uuid primary key default gen_random_uuid (),
  code text not null,
  name text not null,
  sort_order smallint not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint payment_methods_code_key unique (code)
);

create table public.master_payment_methods (
  master_id uuid not null references public.master_profiles (master_id) on delete cascade,
  payment_method_id uuid not null references public.payment_methods (id) on delete restrict,
  created_at timestamptz not null default now(),
  primary key (master_id, payment_method_id)
);

create table public.subscription_plans (
  id uuid primary key default gen_random_uuid (),
  code text not null,
  name text not null,
  price_month numeric(12, 2) not null,
  price_year numeric(12, 2) not null,
  max_services integer,
  max_monthly_appointments integer,
  max_schedule_days_ahead integer not null,
  can_use_analytics boolean not null default false,
  can_use_pdf boolean not null default false,
  can_use_priority_listing boolean not null default false,
  is_active boolean not null default true,
  sort_order smallint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint subscription_plans_code_key unique (code),
  constraint subscription_plans_max_services_nonneg check (
    max_services is null
    or max_services >= 0
  ),
  constraint subscription_plans_max_monthly_nonneg check (
    max_monthly_appointments is null
    or max_monthly_appointments >= 0
  ),
  constraint subscription_plans_max_schedule_days_pos check (max_schedule_days_ahead > 0)
);

create table public.master_subscriptions (
  id uuid primary key default gen_random_uuid (),
  master_id uuid not null unique references public.master_profiles (master_id) on delete cascade,
  plan_id uuid not null references public.subscription_plans (id) on delete restrict,
  status public.subscription_status not null default 'active',
  billing_period public.billing_period not null default 'month',
  current_period_start timestamptz not null,
  current_period_end timestamptz not null,
  constraint master_subscriptions_period_order check (current_period_end > current_period_start),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_master_subscriptions_plan on public.master_subscriptions (plan_id);

create table public.booking_vouchers (
  id uuid primary key default gen_random_uuid (),
  appointment_id uuid not null unique references public.appointments (id) on delete cascade,
  voucher_number text not null,
  constraint booking_vouchers_voucher_number_key unique (voucher_number),
  pdf_url text,
  created_at timestamptz not null default now()
);

-- ======================================================================
-- FILE: 010_triggers_and_indexes.sql
-- ======================================================================

-- SLOTTY DB v2 — updated_at triggers, auth bootstrap, review aggregates

-- --------------------------------------------------------------------------- updated_at

create or replace function public.set_updated_at ()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger trg_profiles_updated
before update on public.profiles for each row
execute procedure public.set_updated_at ();

create trigger trg_telegram_identities_updated
before update on public.telegram_identities for each row
execute procedure public.set_updated_at ();

create trigger trg_service_categories_updated
before update on public.service_categories for each row
execute procedure public.set_updated_at ();

create trigger trg_master_profiles_updated
before update on public.master_profiles for each row
execute procedure public.set_updated_at ();

create trigger trg_master_services_updated
before update on public.master_services for each row
execute procedure public.set_updated_at ();

create trigger trg_master_locations_updated
before update on public.master_locations for each row
execute procedure public.set_updated_at ();

create trigger trg_master_schedule_rules_updated
before update on public.master_schedule_rules for each row
execute procedure public.set_updated_at ();

create trigger trg_master_availability_slots_updated
before update on public.master_availability_slots for each row
execute procedure public.set_updated_at ();

create trigger trg_appointments_updated
before update on public.appointments for each row
execute procedure public.set_updated_at ();

create trigger trg_reviews_updated
before update on public.reviews for each row
execute procedure public.set_updated_at ();

create trigger trg_notifications_updated
before update on public.notifications for each row
execute procedure public.set_updated_at ();

create trigger trg_master_portfolio_items_updated
before update on public.master_portfolio_items for each row
execute procedure public.set_updated_at ();

create trigger trg_master_certificates_updated
before update on public.master_certificates for each row
execute procedure public.set_updated_at ();

create trigger trg_master_career_items_updated
before update on public.master_career_items for each row
execute procedure public.set_updated_at ();

create trigger trg_subscription_plans_updated
before update on public.subscription_plans for each row
execute procedure public.set_updated_at ();

create trigger trg_master_subscriptions_updated
before update on public.master_subscriptions for each row
execute procedure public.set_updated_at ();

-- master_booking_rules: only updated_at column, still bump on any update
create trigger trg_master_booking_rules_updated
before update on public.master_booking_rules for each row
execute procedure public.set_updated_at ();

-- --------------------------------------------------------------------------- auth.users → profiles

create or replace function public.handle_new_user ()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tg bigint;
  v_full text;
  v_avatar text;
  v_username text;
  v_role public.user_role;
begin
  v_tg := coalesce(
    nullif(new.raw_user_meta_data ->> 'tg_id', '')::bigint,
    nullif(new.raw_user_meta_data ->> 'provider_id', '')::bigint,
    nullif(new.raw_user_meta_data ->> 'sub', '')::bigint
  );

  v_full := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
    nullif(
      trim(
        concat_ws(
          ' ',
          nullif(trim(new.raw_user_meta_data ->> 'first_name'), ''),
          nullif(trim(new.raw_user_meta_data ->> 'last_name'), '')
        )
      ),
      ''
    ),
    nullif(trim(new.raw_user_meta_data ->> 'name'), ''),
    'Пользователь'
  );

  v_avatar := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'avatar_url'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'picture'), '')
  );

  v_username := nullif(trim(new.raw_user_meta_data ->> 'username'), '');

  begin
    v_role := (new.raw_user_meta_data ->> 'role')::public.user_role;
  exception
    when invalid_text_representation then
      v_role := 'client';
  end;

  insert into public.profiles(id, telegram_user_id, telegram_username, full_name, avatar_url, role)
    values (
      new.id,
      v_tg,
      v_username,
      coalesce(v_full, 'Пользователь'),
      nullif(v_avatar, ''),
      coalesce(v_role, 'client')
    )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users for each row
execute procedure public.handle_new_user ();

-- --------------------------------------------------------------------------- review aggregates → master_profiles

create or replace function public.refresh_master_review_stats (p_master_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_avg numeric(3, 2);
  v_cnt integer;
begin
  select
    coalesce(avg(r.rating::numeric), 0::numeric),
    count(*)::integer into v_avg,
    v_cnt
  from
    public.reviews r
  where
    r.master_id = p_master_id
    and r.status = 'published';

  update public.master_profiles mp
  set
    rating_avg = round(v_avg, 2),
    reviews_count = v_cnt
  where
    mp.master_id = p_master_id;
end;
$$;

create or replace function public.trg_reviews_refresh_master_stats ()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_mid uuid;
begin
  if tg_op = 'DELETE' then
    v_mid := old.master_id;
  else
    v_mid := new.master_id;
  end if;

  perform public.refresh_master_review_stats (v_mid);

  if tg_op = 'UPDATE' and old.master_id is distinct from new.master_id then
    perform public.refresh_master_review_stats (old.master_id);
  end if;

  return coalesce(new, old);
end;
$$;

create trigger trg_reviews_master_stats
after insert
or
update of rating,
status,
master_id
or delete on public.reviews for each row
execute procedure public.trg_reviews_refresh_master_stats ();

-- ======================================================================
-- FILE: 011_rls_policies.sql
-- ======================================================================

-- SLOTTY DB v2 — Row Level Security policies
-- Assumes Supabase roles: anon, authenticated, service_role (service_role bypasses RLS).

-- --------------------------------------------------------------------------- enable RLS

alter table public.profiles enable row level security;

alter table public.telegram_identities enable row level security;

alter table public.service_categories enable row level security;

alter table public.master_profiles enable row level security;

alter table public.master_services enable row level security;

alter table public.master_locations enable row level security;

alter table public.master_schedule_rules enable row level security;

alter table public.master_availability_slots enable row level security;

alter table public.appointments enable row level security;

alter table public.favorite_masters enable row level security;

alter table public.reviews enable row level security;

alter table public.notifications enable row level security;

alter table public.master_portfolio_items enable row level security;

alter table public.master_certificates enable row level security;

alter table public.master_career_items enable row level security;

alter table public.master_booking_rules enable row level security;

alter table public.payment_methods enable row level security;

alter table public.master_payment_methods enable row level security;

alter table public.subscription_plans enable row level security;

alter table public.master_subscriptions enable row level security;

alter table public.booking_vouchers enable row level security;

-- --------------------------------------------------------------------------- profiles

create policy profiles_select_own on public.profiles for
select
  to authenticated using (id = (select auth.uid()));

create policy profiles_update_own on public.profiles for
update
  to authenticated using (id = (select auth.uid()))
with
  check (id = (select auth.uid()));

-- --------------------------------------------------------------------------- telegram_identities

create policy telegram_identities_select_own on public.telegram_identities for
select
  to authenticated using (profile_id = (select auth.uid()));

create policy telegram_identities_insert_own on public.telegram_identities for insert to authenticated
with
  check (profile_id = (select auth.uid()));

create policy telegram_identities_update_own on public.telegram_identities for
update
  to authenticated using (profile_id = (select auth.uid()))
with
  check (profile_id = (select auth.uid()));

create policy telegram_identities_delete_own on public.telegram_identities for delete to authenticated using (profile_id = (select auth.uid()));

-- --------------------------------------------------------------------------- service_categories (read-only catalog)

create policy service_categories_select_all on public.service_categories for
select
  using (true);

-- --------------------------------------------------------------------------- master_profiles

create policy master_profiles_select_public_or_own on public.master_profiles for
select
  using (
    publication_status = 'published'
    or master_id = (select auth.uid())
  );

create policy master_profiles_insert_self on public.master_profiles for insert to authenticated
with
  check (master_id = (select auth.uid()));

create policy master_profiles_update_own on public.master_profiles for
update
  to authenticated using (master_id = (select auth.uid()))
with
  check (master_id = (select auth.uid()));

create policy master_profiles_delete_own on public.master_profiles for delete to authenticated using (master_id = (select auth.uid()));

-- --------------------------------------------------------------------------- master_services

create policy master_services_select_catalog_or_own on public.master_services for
select
  using (
    master_id = (select auth.uid())
    or (
      is_active = true
      and exists (
        select
          1
        from
          public.master_profiles mp
        where
          mp.master_id = master_services.master_id
          and mp.publication_status = 'published'
      )
    )
  );

create policy master_services_write_own on public.master_services for all to authenticated using (master_id = (select auth.uid()))
with
  check (master_id = (select auth.uid()));

-- --------------------------------------------------------------------------- master_locations

create policy master_locations_select_public_or_own on public.master_locations for
select
  using (
    master_id = (select auth.uid())
    or (
      is_primary = true
      and exists (
        select
          1
        from
          public.master_profiles mp
        where
          mp.master_id = master_locations.master_id
          and mp.publication_status = 'published'
      )
    )
  );

create policy master_locations_write_own on public.master_locations for all to authenticated using (master_id = (select auth.uid()))
with
  check (master_id = (select auth.uid()));

-- --------------------------------------------------------------------------- master_schedule_rules

create policy master_schedule_rules_select_public_or_own on public.master_schedule_rules for
select
  using (
    master_id = (select auth.uid())
    or exists (
      select
        1
      from
        public.master_profiles mp
      where
        mp.master_id = master_schedule_rules.master_id
        and mp.publication_status = 'published'
    )
  );

create policy master_schedule_rules_write_own on public.master_schedule_rules for all to authenticated using (master_id = (select auth.uid()))
with
  check (master_id = (select auth.uid()));

-- --------------------------------------------------------------------------- master_availability_slots

create policy master_slots_select_public_or_own on public.master_availability_slots for
select
  using (
    master_id = (select auth.uid())
    or (
      status = 'available'
      and exists (
        select
          1
        from
          public.master_profiles mp
        where
          mp.master_id = master_availability_slots.master_id
          and mp.publication_status = 'published'
      )
    )
  );

create policy master_slots_write_own on public.master_availability_slots for all to authenticated using (master_id = (select auth.uid()))
with
  check (master_id = (select auth.uid()));

-- --------------------------------------------------------------------------- appointments (no direct insert from clients)

create policy appointments_select_party on public.appointments for
select
  to authenticated using (
    client_id = (select auth.uid())
    or master_id = (select auth.uid())
  );

create policy appointments_insert_blocked on public.appointments for insert to authenticated
with
  check (false);

create policy appointments_update_party on public.appointments for
update
  to authenticated using (
    client_id = (select auth.uid())
    or master_id = (select auth.uid())
  )
with
  check (
    client_id = (select auth.uid())
    or master_id = (select auth.uid())
  );

-- --------------------------------------------------------------------------- favorite_masters

create policy favorite_masters_all_own on public.favorite_masters for all to authenticated using (client_id = (select auth.uid()))
with
  check (client_id = (select auth.uid()));

-- --------------------------------------------------------------------------- reviews

create policy reviews_select_public_or_party on public.reviews for
select
  using (
    status = 'published'
    or client_id = (select auth.uid())
    or master_id = (select auth.uid())
  );

create policy reviews_insert_completed on public.reviews for insert to authenticated
with
  check (
    client_id = (select auth.uid())
    and master_id = (
      select
        a.master_id
      from
        public.appointments a
      where
        a.id = appointment_id
    )
    and exists (
      select
        1
      from
        public.appointments a
      where
        a.id = appointment_id
        and a.client_id = (select auth.uid())
        and a.status = 'completed'
    )
  );

create policy reviews_update_own_client on public.reviews for
update
  to authenticated using (client_id = (select auth.uid()))
with
  check (client_id = (select auth.uid()));

create policy reviews_delete_own_client on public.reviews for delete to authenticated using (client_id = (select auth.uid()));

-- --------------------------------------------------------------------------- notifications

create policy notifications_select_own on public.notifications for
select
  to authenticated using (user_id = (select auth.uid()));

create policy notifications_update_read_own on public.notifications for
update
  to authenticated using (user_id = (select auth.uid()))
with
  check (user_id = (select auth.uid()));

-- --------------------------------------------------------------------------- trust: portfolio / certificates / career

create policy master_portfolio_select_public_or_own on public.master_portfolio_items for
select
  using (
    master_id = (select auth.uid())
    or exists (
      select
        1
      from
        public.master_profiles mp
      where
        mp.master_id = master_portfolio_items.master_id
        and mp.publication_status = 'published'
    )
  );

create policy master_portfolio_write_own on public.master_portfolio_items for all to authenticated using (master_id = (select auth.uid()))
with
  check (master_id = (select auth.uid()));

create policy master_certificates_select_public_or_own on public.master_certificates for
select
  using (
    master_id = (select auth.uid())
    or exists (
      select
        1
      from
        public.master_profiles mp
      where
        mp.master_id = master_certificates.master_id
        and mp.publication_status = 'published'
    )
  );

create policy master_certificates_write_own on public.master_certificates for all to authenticated using (master_id = (select auth.uid()))
with
  check (master_id = (select auth.uid()));

create policy master_career_select_public_or_own on public.master_career_items for
select
  using (
    master_id = (select auth.uid())
    or exists (
      select
        1
      from
        public.master_profiles mp
      where
        mp.master_id = master_career_items.master_id
        and mp.publication_status = 'published'
    )
  );

create policy master_career_write_own on public.master_career_items for all to authenticated using (master_id = (select auth.uid()))
with
  check (master_id = (select auth.uid()));

-- --------------------------------------------------------------------------- master_booking_rules

create policy master_booking_rules_select_public_or_own on public.master_booking_rules for
select
  using (
    master_id = (select auth.uid())
    or exists (
      select
        1
      from
        public.master_profiles mp
      where
        mp.master_id = master_booking_rules.master_id
        and mp.publication_status = 'published'
    )
  );

create policy master_booking_rules_write_own on public.master_booking_rules for all to authenticated using (master_id = (select auth.uid()))
with
  check (master_id = (select auth.uid()));

-- --------------------------------------------------------------------------- payment_methods (read-only reference)

create policy payment_methods_select_all on public.payment_methods for
select
  using (true);

-- --------------------------------------------------------------------------- master_payment_methods

create policy master_payment_methods_select_public_or_own on public.master_payment_methods for
select
  using (
    master_id = (select auth.uid())
    or exists (
      select
        1
      from
        public.master_profiles mp
      where
        mp.master_id = master_payment_methods.master_id
        and mp.publication_status = 'published'
    )
  );

create policy master_payment_methods_write_own on public.master_payment_methods for all to authenticated using (master_id = (select auth.uid()))
with
  check (master_id = (select auth.uid()));

-- --------------------------------------------------------------------------- subscription_plans

create policy subscription_plans_select_all on public.subscription_plans for
select
  using (true);

-- --------------------------------------------------------------------------- master_subscriptions

create policy master_subscriptions_select_own on public.master_subscriptions for
select
  to authenticated using (master_id = (select auth.uid()));

create policy master_subscriptions_write_own on public.master_subscriptions for all to authenticated using (master_id = (select auth.uid()))
with
  check (master_id = (select auth.uid()));

-- --------------------------------------------------------------------------- booking_vouchers

create policy booking_vouchers_select_party on public.booking_vouchers for
select
  to authenticated using (
    exists (
      select
        1
      from
        public.appointments a
      where
        a.id = booking_vouchers.appointment_id
        and (
          a.client_id = (select auth.uid())
          or a.master_id = (select auth.uid())
        )
    )
  );

create policy booking_vouchers_insert_blocked on public.booking_vouchers for insert to authenticated
with
  check (false);

-- ======================================================================
-- FILE: 012_seed.sql
-- ======================================================================

-- SLOTTY DB v2 — reference seed (categories, payment methods, subscription plans)
-- Deterministic UUIDs for stable references in fixtures / tests.

insert into public.service_categories (id, code, name, sort_order)
values
  ('11111111-1111-4111-8111-111111110001', 'manicure', 'Маникюр', 10),
  ('11111111-1111-4111-8111-111111110002', 'barbers', 'Барберы', 20),
  ('11111111-1111-4111-8111-111111110003', 'brows-lashes', 'Брови и ресницы', 30),
  ('11111111-1111-4111-8111-111111110004', 'massage', 'Массаж', 40),
  ('11111111-1111-4111-8111-111111110005', 'fitness', 'Фитнес', 50),
  ('11111111-1111-4111-8111-111111110006', 'tattoo', 'Тату', 60)
on conflict (code) do nothing;

insert into public.payment_methods (id, code, name, sort_order)
values
  ('33333333-3333-4333-8333-333333330001', 'cash', 'Наличные', 10),
  ('33333333-3333-4333-8333-333333330002', 'card', 'Карта', 20),
  ('33333333-3333-4333-8333-333333330003', 'transfer', 'Перевод', 30),
  ('33333333-3333-4333-8333-333333330004', 'online_later', 'Онлайн позже', 40)
on conflict (code) do nothing;

insert into public.subscription_plans (
  id,
  code,
  name,
  price_month,
  price_year,
  max_services,
  max_monthly_appointments,
  max_schedule_days_ahead,
  can_use_analytics,
  can_use_pdf,
  can_use_priority_listing,
  sort_order
)
values
  (
    '22222222-2222-4222-8222-222222220001',
    'free',
    'Free',
    0,
    0,
    3,
    20,
    14,
    false,
    false,
    false,
    10
  ),
  (
    '22222222-2222-4222-8222-222222220002',
    'pro',
    'Pro',
    29,
    290,
    null,
    null,
    90,
    true,
    true,
    true,
    20
  )
on conflict (code) do nothing;

-- ======================================================================
-- FILE: 013_rpc_create_appointment_atomic.sql
-- ======================================================================

-- SLOTTY DB v2 — atomic booking RPC (SECURITY DEFINER)
-- Run after RLS: bypasses RLS for inserts/updates performed inside the function body.

create or replace function public.create_appointment_atomic (
  p_slot_id uuid,
  p_service_id uuid,
  p_client_note text default null
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
  v_slot public.master_availability_slots%rowtype;
  v_service public.master_services%rowtype;
  v_master uuid;
  v_starts timestamptz;
  v_ends timestamptz;
  v_appt_id uuid;
  v_voucher_num text;
begin
  v_uid := auth.uid();

  if v_uid is null then
    raise exception 'not_authenticated';
  end if;

  select
    * into strict v_slot
  from
    public.master_availability_slots
  where
    id = p_slot_id
  for update;

  if v_slot.status is distinct from 'available'::public.slot_status then
    raise exception 'slot_unavailable';
  end if;

  if v_slot.starts_at <= now() then
    raise exception 'slot_in_past';
  end if;

  select
    * into strict v_service
  from
    public.master_services
  where
    id = p_service_id;

  if v_service.is_active is not true then
    raise exception 'service_inactive';
  end if;

  if v_service.master_id <> v_slot.master_id then
    raise exception 'service_master_mismatch';
  end if;

  if v_slot.service_id is not null and v_slot.service_id <> p_service_id then
    raise exception 'service_slot_mismatch';
  end if;

  if v_slot.starts_at + (v_service.duration_minutes * interval '1 minute') > v_slot.ends_at then
    raise exception 'service_does_not_fit_slot';
  end if;

  if exists (
    select
      1
    from
      public.appointments a
    where
      a.slot_id = p_slot_id
      and a.status in (
        'pending'::public.appointment_status,
        'confirmed'::public.appointment_status
      )
  ) then
    raise exception 'slot_already_booked';
  end if;

  v_master := v_slot.master_id;
  v_starts := v_slot.starts_at;
  v_ends := v_slot.starts_at + (v_service.duration_minutes * interval '1 minute');

  if exists (
    select
      1
    from
      public.appointments a
    where
      a.master_id = v_master
      and a.status in (
        'pending'::public.appointment_status,
        'confirmed'::public.appointment_status
      )
      and tstzrange (a.starts_at, a.ends_at, '[)') && tstzrange (v_starts, v_ends, '[)')
  ) then
    raise exception 'master_has_overlapping_appointment';
  end if;

  insert into public.appointments (
    client_id,
    master_id,
    service_id,
    slot_id,
    starts_at,
    ends_at,
    status,
    price_snapshot,
    price_type_snapshot,
    service_title_snapshot,
    service_duration_snapshot,
    client_note
  )
  values (
    v_uid,
    v_master,
    p_service_id,
    p_slot_id,
    v_starts,
    v_ends,
    'pending'::public.appointment_status,
    v_service.price_amount,
    v_service.price_type,
    v_service.title,
    v_service.duration_minutes,
    p_client_note
  )
returning
  id into v_appt_id;

  update public.master_availability_slots s
  set
    status = 'booked'::public.slot_status,
    updated_at = now()
  where
    s.id = p_slot_id;

  insert into public.notifications (user_id, type, title, body, related_entity_type, related_entity_id)
  values (
    v_master,
    'appointment_new'::public.notification_type,
    'Новая запись',
    'У вас новая запись от клиента',
    'appointment',
    v_appt_id
  );

  insert into public.notifications (user_id, type, title, body, related_entity_type, related_entity_id)
  values (
    v_uid,
    'appointment_confirmed'::public.notification_type,
    'Запись создана',
    'Вы записались к мастеру',
    'appointment',
    v_appt_id
  );

  v_voucher_num := 'SLO-' || upper(substring(replace(gen_random_uuid()::text, '-', ''), 1, 12));

  insert into public.booking_vouchers (appointment_id, voucher_number)
  values (v_appt_id, v_voucher_num);

  return jsonb_build_object(
    'appointment_id',
    v_appt_id,
    'master_id',
    v_master,
    'service_title',
    v_service.title,
    'starts_at',
    v_starts,
    'ends_at',
    v_ends,
    'price',
    v_service.price_amount,
    'voucher_number',
    v_voucher_num
  );
exception
  when no_data_found then
    raise exception 'slot_or_service_not_found';
end;
$$;

comment on function public.create_appointment_atomic (uuid, uuid, text) is 'Atomically books a slot, creates appointment + voucher + notifications in one transaction.';

revoke all on function public.create_appointment_atomic (uuid, uuid, text) from public;

grant execute on function public.create_appointment_atomic (uuid, uuid, text) to authenticated;

-- ======================================================================
-- FILE: 014_standalone_profiles.sql
-- ======================================================================

-- SLOTTY DB v2 — standalone backend auth: public.profiles без FK на auth.users
-- После этой миграции профили создаёт Node.js backend (Telegram initData + JWT), не Supabase Auth.

-- 1) Удалить внешний ключ public.profiles → auth.users (если есть)
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT c.conname::text AS conname
    FROM pg_constraint c
    JOIN pg_class rel ON rel.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = rel.relnamespace
    JOIN pg_class frel ON frel.oid = c.confrelid
    JOIN pg_namespace fn ON fn.oid = frel.relnamespace
    WHERE n.nspname = 'public'
      AND rel.relname = 'profiles'
      AND c.contype = 'f'
      AND fn.nspname = 'auth'
      AND frel.relname = 'users'
  LOOP
    EXECUTE format('ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS %I', r.conname);
  END LOOP;
END $$;

-- 2) Default для id (если уже задан — команда идемпотентна по смыслу)
ALTER TABLE public.profiles
  ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- 3) Триггер Supabase Auth → profiles (больше не используется)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 4) Функция bootstrap профиля из auth.users (больше не используется)
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 5) Данные в public.profiles не удаляем

COMMENT ON TABLE public.profiles IS 'Standalone user profiles: managed by SLOTTY Node.js backend (Telegram Web App + JWT). Not tied to auth.users.';

COMMENT ON COLUMN public.profiles.id IS 'Primary key; default gen_random_uuid() in DB or explicit UUID from backend.';

COMMENT ON COLUMN public.profiles.telegram_user_id IS 'Telegram user id (bigint); unique when set; primary handle for Telegram Web App login after initData verification.';

-- ======================================================================
-- FILE: 015_storage_profile_bucket.sql
-- ======================================================================

-- SLOTTY — публичный bucket для аватаров клиентов (загрузка с бэкенда через service role).
-- Если bucket уже создан в Dashboard с именем `profile`, миграция только синхронизирует флаги.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('profile', 'profile', true, 52428800, null)
on conflict (id) do update set
  public = excluded.public,
  name = excluded.name;

-- ======================================================================
-- FILE: 016_master_locations_coordinates.sql
-- ======================================================================

-- SLOTTY DB v2 — координаты основной точки приёма (карты для клиентов).
-- Идемпотентно: безопасно для БД, где колонки уже созданы в 004_services_locations_rules.sql.

alter table public.master_locations
  add column if not exists lat double precision;

alter table public.master_locations
  add column if not exists lng double precision;

comment on column public.master_locations.lat is 'Широта WGS84 для метки на карте (клиенты / каталог)';
comment on column public.master_locations.lng is 'Долгота WGS84 для метки на карте (клиенты / каталог)';

-- ======================================================================
-- FILE: 017_master_catalog_filters.sql
-- ======================================================================

-- SLOTTY DB v2 — доп. поля для каталога (фильтры: проверенный мастер, акции).
-- Только ADD COLUMN IF NOT EXISTS, без удаления данных и таблиц.

alter table public.master_profiles
  add column if not exists is_verified boolean not null default false;

comment on column public.master_profiles.is_verified is 'Проверенный мастер (модерация / доверие)';

alter table public.master_services
  add column if not exists old_price_amount numeric(12, 2);

alter table public.master_services
  add column if not exists has_promotion boolean not null default false;

comment on column public.master_services.old_price_amount is 'Старая цена до скидки (если есть акция)';
comment on column public.master_services.has_promotion is 'Явная метка акции для фильтра каталога';

alter table public.master_services
  add constraint master_services_old_price_nonneg check (old_price_amount is null or old_price_amount >= 0::numeric);

-- ======================================================================
-- FILE: 018_client_profile_phone_address.sql
-- ======================================================================

-- SLOTTY DB v2 — optional client contact fields + consent timestamps (nullable, non-destructive)

alter table public.profiles
  add column if not exists phone text,
  add column if not exists address text,
  add column if not exists privacy_consent_accepted_at timestamptz,
  add column if not exists terms_accepted_at timestamptz;

comment on column public.profiles.phone is 'Optional Belarus mobile; store normalized compact form +375XXXXXXXXX';
comment on column public.profiles.address is 'Optional client address hint for nearby search';
comment on column public.profiles.privacy_consent_accepted_at is 'When user accepted privacy policy in app (optional)';
comment on column public.profiles.terms_accepted_at is 'When user accepted terms of use in app (optional)';

-- ======================================================================
-- FILE: 019_master_profiles_contacts_jsonb.sql
-- ======================================================================

-- SLOTTY DB v2 — структурированные контакты мастера (не деструктивно: колонка nullable).

alter table public.master_profiles
  add column if not exists contacts jsonb;

comment on column public.master_profiles.contacts is
  'Массив контактов для клиентов: [{ "type": "telegram"|..., "value": "..." }]. Поле contact остаётся для обратной совместимости (краткая строка).';

-- ======================================================================
-- FILE: 020_master_locations_privacy_and_salon.sql
-- ======================================================================

-- Расширение адреса мастера: салон, район/метро, приватность «на дому» (без удаления данных).

alter table public.master_locations
  add column if not exists salon_name text,
  add column if not exists district text,
  add column if not exists show_exact_address_after_booking boolean not null default true;

comment on column public.master_locations.salon_name is 'Название салона/студии (visit_type = studio), опционально';
comment on column public.master_locations.district is 'Район или метро (visit_type = at_home), для показа до записи';
comment on column public.master_locations.show_exact_address_after_booking is
  'Для at_home: если false — в каталоге публичный адрес скрыт до записи (точные street/building хранятся)';

-- ======================================================================
-- FILE: 021_master_profiles_plan_pro_fields.sql
-- ======================================================================

-- SLOTTY DB v2 — тариф онбординга и интерес к Pro (без деструктива).

alter table public.master_profiles
  add column if not exists master_plan text not null default 'basic',
  add column if not exists pro_interested boolean not null default false,
  add column if not exists pro_status text,
  add column if not exists pro_started_at timestamptz,
  add column if not exists pro_expires_at timestamptz,
  add column if not exists published_at timestamptz;

comment on column public.master_profiles.master_plan is 'Тариф профиля: basic | pro (pro — после реальной оплаты / биллинга).';
comment on column public.master_profiles.pro_interested is 'Мастер оставил интерес к Pro при онбординге (без обязательства).';
comment on column public.master_profiles.pro_status is 'Статус Pro: inactive | interested | active | expired (текст для гибкости).';
comment on column public.master_profiles.pro_started_at is 'Начало оплаченного периода Pro.';
comment on column public.master_profiles.pro_expires_at is 'Окончание оплаченного периода Pro.';
comment on column public.master_profiles.published_at is 'Первое или последнее успешное опубликование профиля.';

do $$
begin
  alter table public.master_profiles
    add constraint master_profiles_master_plan_chk check (master_plan in ('basic', 'pro'));
exception
  when duplicate_object then null;
end $$;

-- ======================================================================
-- FILE: 022_review_master_reply.sql
-- ======================================================================

-- Ответ мастера на отзыв (один раз)

alter table public.reviews
  add column if not exists master_reply text,
  add column if not exists master_reply_at timestamptz;

drop policy if exists reviews_update_master_reply on public.reviews;

create policy reviews_update_master_reply on public.reviews
for update
  to authenticated
  using (master_id = (select auth.uid()))
with
  check (master_id = (select auth.uid()));

-- ======================================================================
-- FILE: 023_master_payment_methods_backfill.sql
-- ======================================================================

-- Перенос способов оплаты из legacy JSON в master_payment_methods (payment_note остаётся только текстом).

create or replace function public._slotty_parse_legacy_payment_methods(payment_note text)
returns text[]
language plpgsql
immutable
as $$
declare
  marker constant text := '__SLOTTY_PAYMENT_METHODS_JSON__';
  pos int;
  json_part text;
  parsed jsonb;
begin
  if payment_note is null or length(trim(payment_note)) = 0 then
    return array[]::text[];
  end if;
  pos := position(marker in payment_note);
  if pos = 0 then
    return array[]::text[];
  end if;
  json_part := trim(substring(payment_note from pos + length(marker)));
  if json_part = '' then
    return array[]::text[];
  end if;
  begin
    parsed := json_part::jsonb;
  exception when others then
    return array[]::text[];
  end;
  if jsonb_typeof(parsed) <> 'array' then
    return array[]::text[];
  end if;
  return coalesce(
    (
      select array_agg(elem #>> '{}')
      from jsonb_array_elements(parsed) elem
      where jsonb_typeof(elem) = 'string'
    ),
    array[]::text[]
  );
end;
$$;

-- Связи master ↔ payment_methods по имени или коду из seed.
insert into public.master_payment_methods (master_id, payment_method_id)
select distinct br.master_id, pm.id
  from public.master_booking_rules br
 cross join lateral unnest(public._slotty_parse_legacy_payment_methods(br.payment_note)) as method_name
  join public.payment_methods pm
    on pm.is_active
   and (pm.name = method_name or pm.code = lower(replace(method_name, ' ', '_')))
 where method_name is not null
   and length(trim(method_name)) > 0
 on conflict (master_id, payment_method_id) do nothing;

-- Очистить payment_note от legacy JSON.
update public.master_booking_rules br
   set payment_note = nullif(
         trim(
           case
             when position('__SLOTTY_PAYMENT_METHODS_JSON__' in coalesce(br.payment_note, '')) > 0 then
               substring(
                 br.payment_note
                 from 1
                 for position('__SLOTTY_PAYMENT_METHODS_JSON__' in br.payment_note) - 1
               )
             else br.payment_note
           end
         ),
         ''
       ),
       updated_at = now()
 where br.payment_note is not null
   and position('__SLOTTY_PAYMENT_METHODS_JSON__' in br.payment_note) > 0;

drop function if exists public._slotty_parse_legacy_payment_methods(text);

-- ======================================================================
-- FILE: 024_master_service_bundles_promotions.sql
-- ======================================================================

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

-- ======================================================================
-- FILE: 025_slot_lifecycle_guards.sql
-- ======================================================================

-- Защита окон записи: нельзя менять/удалять занятое окно или окно с активной записью.

create or replace function public.guard_master_availability_slot_change()
returns trigger
language plpgsql
as $$
declare
  v_active_appt boolean;
begin
  if TG_OP = 'DELETE' then
    if exists (select 1 from public.appointments a where a.slot_id = OLD.id) then
      raise exception 'SLOT_HAS_HISTORY'
        using errcode = 'P0001',
          message = 'Нельзя удалить окно: по нему есть запись в истории';
    end if;
    return OLD;
  end if;

  if TG_OP = 'UPDATE' then
    if OLD.status is distinct from 'available'::public.slot_status then
      if NEW.starts_at is distinct from OLD.starts_at
        or NEW.ends_at is distinct from OLD.ends_at
        or NEW.service_id is distinct from OLD.service_id
        or NEW.status is distinct from OLD.status and NEW.status is distinct from 'available'::public.slot_status
      then
        raise exception 'SLOT_NOT_EDITABLE'
          using errcode = 'P0001',
            message = 'Окно занято или недоступно для изменения';
      end if;
    end if;

    select exists (
      select 1
        from public.appointments a
       where a.slot_id = OLD.id
         and a.status in ('pending'::public.appointment_status, 'confirmed'::public.appointment_status)
    ) into v_active_appt;

    if v_active_appt then
      if NEW.starts_at is distinct from OLD.starts_at
        or NEW.ends_at is distinct from OLD.ends_at
        or NEW.service_id is distinct from OLD.service_id
      then
        raise exception 'SLOT_HAS_APPOINTMENT'
          using errcode = 'P0001',
            message = 'На окно есть активная запись';
      end if;
    end if;
  end if;

  return NEW;
end;
$$;

drop trigger if exists trg_guard_master_availability_slots on public.master_availability_slots;

create trigger trg_guard_master_availability_slots
before update or delete on public.master_availability_slots
for each row
execute function public.guard_master_availability_slot_change();

comment on function public.guard_master_availability_slot_change () is
  'Блокирует удаление окна с историей записей и изменение времени/услуги при брони';

-- ======================================================================
-- FILE: 026_appointment_reminder_deliveries.sql
-- ======================================================================

-- SLOTTY DB v2 — доставка напоминаний о записи (за сутки и за час)

create table public.appointment_reminder_deliveries (
  appointment_id uuid not null references public.appointments (id) on delete cascade,
  reminder_kind text not null,
  sent_at timestamptz not null default now(),
  primary key (appointment_id, reminder_kind),
  constraint appointment_reminder_deliveries_kind_check check (reminder_kind in ('24h', '1h'))
);

create index idx_appointment_reminder_deliveries_sent on public.appointment_reminder_deliveries (sent_at desc);

comment on table public.appointment_reminder_deliveries is 'Факт отправки напоминания (Telegram + in-app) за 24ч и за 1ч до starts_at';

-- ======================================================================
-- FILE: 027_master_service_promotion_slots.sql
-- ======================================================================

-- Привязка акций к конкретным окнам (умные акции на свободные слоты).

create table public.master_service_promotion_slots (
  id uuid primary key default gen_random_uuid(),
  promotion_id uuid not null references public.master_service_promotions (id) on delete cascade,
  slot_id uuid not null references public.master_availability_slots (id) on delete cascade,
  master_id uuid not null references public.master_profiles (master_id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint master_service_promotion_slots_promotion_slot_key unique (promotion_id, slot_id)
);

-- Не более одной активной акции на окно — проверяется в POST /api/masters/me/promotions (template free_slots).

create index idx_master_service_promotion_slots_promotion
  on public.master_service_promotion_slots (promotion_id);

create index idx_master_service_promotion_slots_master
  on public.master_service_promotion_slots (master_id, slot_id);

comment on table public.master_service_promotion_slots is
  'Точная привязка акции к окнам; используется для template free_slots (умные акции).';

alter table public.master_service_promotion_slots enable row level security;

-- ======================================================================
-- FILE: 028_auth_identities.sql
-- ======================================================================

-- SLOTTY — unified login providers (Telegram, Google, Email) per profile

create type public.auth_provider as enum ('telegram', 'google', 'email');

create table public.auth_identities (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  provider public.auth_provider not null,
  provider_user_id text not null,
  email text,
  credential_hash text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint auth_identities_provider_user_key unique (provider, provider_user_id)
);

comment on table public.auth_identities is 'Login methods linked to one profiles row';
comment on column public.auth_identities.provider_user_id is 'Telegram user id, Google sub, or normalized email';
comment on column public.auth_identities.credential_hash is 'bcrypt hash; only for provider=email';

create index idx_auth_identities_profile_id on public.auth_identities (profile_id);

-- Backfill existing Telegram logins from profiles.telegram_user_id
insert into public.auth_identities (profile_id, provider, provider_user_id, email)
select p.id, 'telegram'::public.auth_provider, p.telegram_user_id::text, null
from public.profiles p
where p.telegram_user_id is not null
on conflict (provider, provider_user_id) do nothing;

-- ======================================================================
-- FILE: 029_auth_email_tokens.sql
-- ======================================================================

-- Email verification and password reset tokens (Resend)

alter table public.auth_identities
  add column if not exists email_verified_at timestamptz;

comment on column public.auth_identities.email_verified_at is 'Set when email provider identity is confirmed; null = pending';

create type public.auth_email_token_purpose as enum ('verify_email', 'reset_password');

create table public.auth_email_tokens (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  email text not null,
  token_hash text not null,
  purpose public.auth_email_token_purpose not null,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create index idx_auth_email_tokens_token_hash on public.auth_email_tokens (token_hash)
  where used_at is null;

create index idx_auth_email_tokens_profile_purpose on public.auth_email_tokens (profile_id, purpose)
  where used_at is null;

comment on table public.auth_email_tokens is 'One-time tokens for email verify and password reset';

-- ======================================================================
-- FILE: 030_overview_performance_indexes.sql
-- ======================================================================

-- Индексы для сводки мастера: записи по master + дата, отзывы по master + статус + дата.

create index if not exists idx_appointments_master_starts_covering
  on public.appointments (master_id, starts_at desc)
  include (status, price_snapshot, service_title_snapshot, client_id);

create index if not exists idx_reviews_master_published_created
  on public.reviews (master_id, created_at desc)
  where status = 'published';

-- ======================================================================
-- FILE: 031_appointment_reference_photo.sql
-- ======================================================================

-- Фото желаемого дизайна / причёски при записи (маникюр, барбер, и т.д.)
alter table public.appointments
  add column if not exists client_reference_photo_url text;

comment on column public.appointments.client_reference_photo_url is
  'Публичный URL фото-референса от клиента (дизайн ногтей, стрижка и т.п.)';

-- ======================================================================
-- FILE: 032_category_change_requests.sql
-- ======================================================================

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

-- ======================================================================
-- FILE: 033_platform_admin.sql
-- ======================================================================

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

-- ======================================================================
-- FILE: 034_master_profile_active_flag.sql
-- ======================================================================

-- Явный флаг активности профиля мастера (синхронизируется с publication_status)

alter table public.master_profiles
  add column if not exists is_profile_active boolean not null default false;

comment on column public.master_profiles.is_profile_active is
  'true = профиль виден в каталоге и доступен для записи (publication_status = published)';

update public.master_profiles
   set is_profile_active = (publication_status = 'published'::public.master_publication_status)
 where is_profile_active is distinct from (publication_status = 'published'::public.master_publication_status);

-- ======================================================================
-- FILE: 035_subscription_billing_events.sql
-- ======================================================================

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

-- ======================================================================
-- FILE: 036_admin_profile_performance_indexes.sql
-- ======================================================================

-- Кабинет мастера (/admin → Профиль, Портфолио, Адрес, Правила):
-- быстрее GET /api/masters/me и refresh после сохранения фото/портфолио/сертификатов.

-- Портфолио: ORDER BY sort_order, created_at + недавние загрузки
create index if not exists idx_master_portfolio_master_created
  on public.master_portfolio_items (master_id, created_at desc);

create index if not exists idx_master_portfolio_master_list_covering
  on public.master_portfolio_items (master_id, sort_order asc, created_at asc)
  include (image_url, title, description);

-- Сертификаты
create index if not exists idx_master_certificates_master_created
  on public.master_certificates (master_id, created_at desc);

create index if not exists idx_master_certificates_master_list_covering
  on public.master_certificates (master_id, sort_order asc, created_at asc)
  include (title, issuer, year, image_url, description);

-- Образование и опыт
create index if not exists idx_master_career_master_created
  on public.master_career_items (master_id, created_at desc);

create index if not exists idx_master_career_master_list_covering
  on public.master_career_items (master_id, sort_order asc, created_at asc)
  include (type, title, place, start_year, end_year, description);

-- PATCH/DELETE по паре master_id + id (кабинет, синхронизация листов)
create index if not exists idx_master_portfolio_master_item
  on public.master_portfolio_items (master_id, id);

create index if not exists idx_master_certificates_master_item
  on public.master_certificates (master_id, id);

create index if not exists idx_master_career_master_item
  on public.master_career_items (master_id, id);

-- Первичный адрес (GET/PUT primary-location)
create index if not exists idx_master_locations_primary_covering
  on public.master_locations (master_id)
  include (
    visit_type,
    city,
    street,
    building,
    building_detail,
    salon_name,
    district,
    entrance,
    floor,
    room,
    intercom,
    landmark,
    directions,
    client_note,
    public_address,
    lat,
    lng,
    show_exact_address_after_booking
  )
  where is_primary = true;

-- ======================================================================
-- FILE: 037_appointments_list_indexes.sql
-- ======================================================================

-- Быстрые списки записей: заявки, предстоящие, история, активные для расписания, месячный лимит.

create index if not exists idx_appointments_master_pending_starts
  on public.appointments (master_id, starts_at desc)
  where status = 'pending';

create index if not exists idx_appointments_master_upcoming_starts
  on public.appointments (master_id, starts_at asc)
  where status = 'confirmed';

create index if not exists idx_appointments_master_active_starts
  on public.appointments (master_id, starts_at asc)
  where status in ('pending', 'confirmed');

create index if not exists idx_appointments_master_history_starts
  on public.appointments (master_id, starts_at desc)
  where status in ('completed', 'no_show', 'cancelled_by_client', 'cancelled_by_master');

create index if not exists idx_appointments_master_monthly_usage
  on public.appointments (master_id, starts_at)
  where status not in ('cancelled_by_client', 'cancelled_by_master');

create index if not exists idx_appointments_client_starts_covering
  on public.appointments (client_id, starts_at desc)
  include (status, master_id, service_title_snapshot, price_snapshot);

-- ======================================================================
-- FILE: 038_catalog_search_rpc.sql
-- ======================================================================

-- Каталог /services: индексы + RPC для фильтрации (один round-trip, стабильный план).

create extension if not exists pg_trgm;

-- --------------------------------------------------------------------------- helpers

create or replace function public.catalog_safe_ilike_fragment(p_raw text)
returns text
language sql
immutable
as $$
  select nullif(
    left(regexp_replace(trim(coalesce(p_raw, '')), '[%_\\]', ' ', 'g'), 160),
    ''
  );
$$;

create or replace function public.catalog_master_account_ok(p_master_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.profiles pr
    where pr.id = p_master_id
      and pr.account_status not in ('blocked', 'deleted')
      and (
        pr.account_status = 'active'
        or (
          pr.account_status = 'restricted'
          and pr.access_restricted_until is not null
          and pr.access_restricted_until <= now()
        )
      )
  );
$$;

create or replace function public.catalog_slot_matches(
  p_master_id uuid,
  p_date_range text,
  p_time_of_day text
)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.master_availability_slots s
    where s.master_id = p_master_id
      and s.status = 'available'
      and s.starts_at > now()
      and (
        coalesce(p_date_range, 'any') = 'any'
        or (
          (p_date_range = 'today'
            and ((s.starts_at at time zone 'Europe/Minsk'))::date
              = (timezone('Europe/Minsk', now()))::date)
          or (p_date_range = 'tomorrow'
            and ((s.starts_at at time zone 'Europe/Minsk'))::date
              = ((timezone('Europe/Minsk', now()) + interval '1 day'))::date)
          or (p_date_range = 'week'
            and ((s.starts_at at time zone 'Europe/Minsk'))::date
              >= (timezone('Europe/Minsk', now()))::date
            and ((s.starts_at at time zone 'Europe/Minsk'))::date
              <= ((timezone('Europe/Minsk', now()) + interval '7 day'))::date)
          or (p_date_range = 'weekend'
            and extract(dow from (s.starts_at at time zone 'Europe/Minsk')) in (0, 6)
            and ((s.starts_at at time zone 'Europe/Minsk'))::date
              >= (timezone('Europe/Minsk', now()))::date
            and ((s.starts_at at time zone 'Europe/Minsk'))::date
              <= ((timezone('Europe/Minsk', now()) + interval '14 day'))::date)
        )
      )
      and (
        coalesce(p_time_of_day, 'any') = 'any'
        or (
          (p_time_of_day = 'morning'
            and extract(hour from (s.starts_at at time zone 'Europe/Minsk')) >= 8
            and extract(hour from (s.starts_at at time zone 'Europe/Minsk')) < 12)
          or (p_time_of_day = 'afternoon'
            and extract(hour from (s.starts_at at time zone 'Europe/Minsk')) >= 12
            and extract(hour from (s.starts_at at time zone 'Europe/Minsk')) < 17)
          or (p_time_of_day = 'evening'
            and extract(hour from (s.starts_at at time zone 'Europe/Minsk')) >= 17
            and extract(hour from (s.starts_at at time zone 'Europe/Minsk')) < 22)
        )
      )
  );
$$;

create or replace function public.catalog_duration_matches(
  p_master_id uuid,
  p_preset text
)
returns boolean
language sql
stable
as $$
  select case coalesce(p_preset, 'any')
    when 'any' then true
    when 'under30' then exists (
      select 1 from public.master_services ms
      where ms.master_id = p_master_id
        and ms.is_active = true
        and ms.admin_hidden_at is null
        and ms.duration_minutes > 0
        and ms.duration_minutes < 30
    )
    when '30_60' then exists (
      select 1 from public.master_services ms
      where ms.master_id = p_master_id
        and ms.is_active = true
        and ms.admin_hidden_at is null
        and ms.duration_minutes >= 30
        and ms.duration_minutes <= 60
    )
    when '60_120' then exists (
      select 1 from public.master_services ms
      where ms.master_id = p_master_id
        and ms.is_active = true
        and ms.admin_hidden_at is null
        and ms.duration_minutes > 60
        and ms.duration_minutes <= 120
    )
    else exists (
      select 1 from public.master_services ms
      where ms.master_id = p_master_id
        and ms.is_active = true
        and ms.admin_hidden_at is null
        and ms.duration_minutes > 120
    )
  end;
$$;

-- --------------------------------------------------------------------------- indexes

create index if not exists idx_master_profiles_catalog_published
  on public.master_profiles (rating_avg desc, reviews_count desc, display_name)
  where publication_status = 'published';

create index if not exists idx_master_profiles_catalog_verified
  on public.master_profiles (rating_avg desc, reviews_count desc)
  where publication_status = 'published' and is_verified = true;

create index if not exists idx_master_profiles_display_name_trgm
  on public.master_profiles using gin (lower(display_name) gin_trgm_ops);

create index if not exists idx_master_services_catalog_list
  on public.master_services (master_id, sort_order, price_amount, title)
  where is_active = true and admin_hidden_at is null;

create index if not exists idx_master_services_catalog_category
  on public.master_services (category_id, master_id)
  where is_active = true and admin_hidden_at is null;

create index if not exists idx_master_services_catalog_price
  on public.master_services (master_id, price_amount)
  where is_active = true and admin_hidden_at is null;

create index if not exists idx_master_services_title_trgm
  on public.master_services using gin (lower(title) gin_trgm_ops)
  where is_active = true and admin_hidden_at is null;

create index if not exists idx_master_locations_primary_address_trgm
  on public.master_locations using gin (lower(public_address) gin_trgm_ops)
  where is_primary = true;

create index if not exists idx_master_locations_primary_street_trgm
  on public.master_locations using gin (lower(street) gin_trgm_ops)
  where is_primary = true;

create index if not exists idx_master_service_promotions_active_master
  on public.master_service_promotions (master_id, starts_at, ends_at)
  where status = 'active';

-- --------------------------------------------------------------------------- listings RPC

create or replace function public.catalog_search_listings(
  p_search text default null,
  p_category_code text default null,
  p_location_id uuid default null,
  p_address_text text default null,
  p_date_range text default 'any',
  p_time_of_day text default 'any',
  p_min_price numeric default null,
  p_max_price numeric default null,
  p_min_rating numeric default null,
  p_min_reviews int default null,
  p_visit_type text default 'any',
  p_verified_only boolean default false,
  p_promotion_only boolean default false,
  p_duration_preset text default 'any',
  p_sort_by text default 'recommended',
  p_page int default 1,
  p_limit int default 24
)
returns jsonb
language plpgsql
stable
set search_path = public
as $$
declare
  v_search text;
  v_search_pat text;
  v_addr text;
  v_addr_pat text;
  v_page int;
  v_limit int;
  v_offset int;
  v_total int;
  v_items jsonb;
  v_cat text;
begin
  v_search := catalog_safe_ilike_fragment(p_search);
  v_search_pat := case when v_search is not null then '%' || v_search || '%' else null end;
  v_addr := catalog_safe_ilike_fragment(p_address_text);
  v_addr_pat := case when v_addr is not null then '%' || v_addr || '%' else null end;
  v_cat := nullif(trim(coalesce(p_category_code, '')), '');
  v_page := greatest(1, least(coalesce(p_page, 1), 500));
  v_limit := greatest(1, least(coalesce(p_limit, 24), 80));
  v_offset := (v_page - 1) * v_limit;

  with filtered as (
    select
      mp.master_id,
      mp.display_name,
      mp.bio,
      mp.photo_url,
      mp.slug,
      mp.rating_avg,
      mp.reviews_count,
      mp.is_verified,
      sc.code as category_code,
      sc.name as category_name,
      ml.public_address,
      ml.city,
      ml.lat::double precision as location_lat,
      ml.lng::double precision as location_lng,
      ps.id as primary_service_id,
      ps.title as primary_service_title,
      ps.price_amount as primary_service_price,
      ns.starts_at as next_slot_starts_at,
      ns.id as next_slot_id
    from public.master_profiles mp
    left join public.service_categories sc on sc.id = mp.primary_category_id
    left join public.master_locations ml on ml.master_id = mp.master_id and ml.is_primary = true
    left join lateral (
      select ms.id, ms.title, ms.price_amount
      from public.master_services ms
      where ms.master_id = mp.master_id
        and ms.is_active = true
        and ms.admin_hidden_at is null
      order by ms.sort_order asc, ms.price_amount asc nulls last, ms.title asc
      limit 1
    ) ps on true
    left join lateral (
      select s.id, s.starts_at
      from public.master_availability_slots s
      where s.master_id = mp.master_id
        and s.status = 'available'
        and s.starts_at > now()
      order by s.starts_at asc
      limit 1
    ) ns on true
    where mp.publication_status = 'published'
      and public.catalog_master_account_ok(mp.master_id)
      and (
        v_search_pat is null
        or mp.display_name ilike v_search_pat
        or coalesce(ml.public_address, '') ilike v_search_pat
        or exists (
          select 1
          from public.master_services ms
          join public.service_categories scs on scs.id = ms.category_id
          where ms.master_id = mp.master_id
            and ms.is_active = true
            and ms.admin_hidden_at is null
            and (
              ms.title ilike v_search_pat
              or scs.name ilike v_search_pat
              or scs.code ilike v_search_pat
            )
        )
      )
      and (
        v_cat is null
        or sc.code = v_cat
        or exists (
          select 1
          from public.master_services ms2
          join public.service_categories sc2 on sc2.id = ms2.category_id
          where ms2.master_id = mp.master_id
            and ms2.is_active = true
            and ms2.admin_hidden_at is null
            and sc2.code = v_cat
        )
      )
      and (p_location_id is null or ml.id = p_location_id)
      and (
        v_addr_pat is null
        or p_location_id is not null
        or coalesce(ml.public_address, '') ilike v_addr_pat
        or coalesce(ml.street, '') ilike v_addr_pat
        or coalesce(ml.building, '') ilike v_addr_pat
      )
      and (p_min_rating is null or mp.rating_avg >= p_min_rating)
      and (p_min_reviews is null or p_min_reviews <= 0 or mp.reviews_count >= p_min_reviews)
      and (
        coalesce(p_visit_type, 'any') = 'any'
        or ml.visit_type = p_visit_type::public.visit_type
      )
      and (not coalesce(p_verified_only, false) or mp.is_verified = true)
      and (
        not coalesce(p_promotion_only, false)
        or exists (
          select 1 from public.master_services msp
          where msp.master_id = mp.master_id
            and msp.is_active = true
            and msp.admin_hidden_at is null
            and (
              msp.has_promotion = true
              or (msp.old_price_amount is not null and msp.old_price_amount > msp.price_amount)
            )
        )
        or exists (
          select 1 from public.master_service_promotions pr
          where pr.master_id = mp.master_id
            and pr.status = 'active'
            and pr.starts_at <= now()
            and pr.ends_at >= now()
        )
      )
      and public.catalog_duration_matches(mp.master_id, p_duration_preset)
      and (
        (coalesce(p_date_range, 'any') = 'any' and coalesce(p_time_of_day, 'any') = 'any')
        or public.catalog_slot_matches(mp.master_id, p_date_range, p_time_of_day)
      )
      and (
        p_min_price is null
        or exists (
          select 1 from public.master_services msp
          where msp.master_id = mp.master_id
            and msp.is_active = true
            and msp.admin_hidden_at is null
            and msp.price_amount >= p_min_price
        )
      )
      and (
        p_max_price is null
        or exists (
          select 1 from public.master_services msp
          where msp.master_id = mp.master_id
            and msp.is_active = true
            and msp.admin_hidden_at is null
            and msp.price_amount <= p_max_price
        )
      )
  ),
  counted as (
    select count(*)::int as c from filtered
  ),
  sorted as (
    select *
    from filtered f
    order by
      case when coalesce(p_sort_by, 'recommended') in ('recommended', 'soonest') then
        case when f.next_slot_starts_at is null then 1 else 0 end
      end asc nulls last,
      case when coalesce(p_sort_by, 'recommended') in ('recommended', 'soonest') then
        f.next_slot_starts_at
      end asc nulls last,
      case when coalesce(p_sort_by, 'recommended') = 'rating' then f.rating_avg end desc nulls last,
      case when p_sort_by = 'price_asc' then f.primary_service_price end asc nulls last,
      case when p_sort_by = 'price_desc' then f.primary_service_price end desc nulls last,
      case when p_sort_by = 'reviews' then f.reviews_count end desc nulls last,
      case when coalesce(p_sort_by, 'recommended') in ('recommended', 'soonest') then f.rating_avg end desc nulls last,
      case when coalesce(p_sort_by, 'recommended') in ('recommended', 'soonest') then f.reviews_count end desc nulls last,
      f.display_name asc
    limit v_limit
    offset v_offset
  )
  select
    (select c from counted),
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'masterId', s.master_id,
            'displayName', s.display_name,
            'bio', s.bio,
            'photoUrl', s.photo_url,
            'slug', s.slug,
            'rating', coalesce(s.rating_avg, 0),
            'reviewsCount', s.reviews_count,
            'isVerified', s.is_verified,
            'category', case
              when s.category_code is not null then jsonb_build_object(
                'code', s.category_code,
                'name', coalesce(s.category_name, s.category_code)
              )
              else null
            end,
            'location', case
              when s.public_address is not null then jsonb_build_object(
                'publicAddress', s.public_address,
                'city', s.city,
                'lat', s.location_lat,
                'lng', s.location_lng
              )
              when s.city is not null then jsonb_build_object(
                'publicAddress', s.city,
                'city', s.city,
                'lat', s.location_lat,
                'lng', s.location_lng
              )
              when s.location_lat is not null and s.location_lng is not null then jsonb_build_object(
                'publicAddress', 'Точка на карте',
                'city', s.city,
                'lat', s.location_lat,
                'lng', s.location_lng
              )
              else null
            end,
            'minServicePrice', s.primary_service_price,
            'primaryServiceId', s.primary_service_id,
            'primaryServiceName', s.primary_service_title,
            'nextSlotStartsAt', s.next_slot_starts_at,
            'nextSlotId', s.next_slot_id
          )
        )
        from sorted s
      ),
      '[]'::jsonb
    )
  into v_total, v_items;

  return jsonb_build_object(
    'items', v_items,
    'total', coalesce(v_total, 0),
    'page', v_page,
    'limit', v_limit,
    'hasMore', (v_offset + jsonb_array_length(v_items)) < coalesce(v_total, 0)
  );
end;
$$;

comment on function public.catalog_search_listings is
  'Каталог мастеров: фильтры, сортировка, пагинация (GET /api/catalog/listings).';

-- --------------------------------------------------------------------------- location suggestions RPC

create or replace function public.catalog_suggest_locations(
  p_query text default '',
  p_limit int default 12
)
returns jsonb
language plpgsql
stable
set search_path = public
as $$
declare
  v_frag text;
  v_pat text;
  v_lim int;
  v_out jsonb;
begin
  v_frag := catalog_safe_ilike_fragment(p_query);
  if v_frag is null then
    return '[]'::jsonb;
  end if;
  v_pat := '%' || v_frag || '%';
  v_lim := greatest(1, least(coalesce(p_limit, 12), 30));

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', a.id,
        'type', 'address',
        'title', a.title,
        'subtitle',
          case
            when a.master_count = 1 then '1 мастер'
            else a.master_count::text || ' мастеров'
          end
          || ' · '
          || case
            when a.slot_count = 0 then 'нет окон'
            when a.slot_count = 1 then '1 окно'
            else a.slot_count::text || ' окон'
          end
      )
      order by a.master_count desc, a.title asc
    ),
    '[]'::jsonb
  )
  into v_out
  from (
    select
      min(b.id) as id,
      b.public_address as title,
      count(distinct b.master_id)::int as master_count,
      sum(b.slot_count)::int as slot_count
    from (
      select
        ml.id,
        ml.public_address,
        ml.master_id,
        (
          select count(*)::int
          from public.master_availability_slots s
          where s.master_id = ml.master_id
            and s.status = 'available'
            and s.starts_at > now()
        ) as slot_count
      from public.master_locations ml
      join public.master_profiles mp on mp.master_id = ml.master_id
      where mp.publication_status = 'published'
        and public.catalog_master_account_ok(mp.master_id)
        and ml.is_primary = true
        and (
          ml.public_address ilike v_pat
          or coalesce(ml.street, '') ilike v_pat
          or coalesce(ml.building, '') ilike v_pat
          or coalesce(ml.landmark, '') ilike v_pat
        )
    ) b
    group by lower(trim(b.public_address)), b.public_address
    order by count(distinct b.master_id) desc, b.public_address asc
    limit v_lim
  ) a;

  return v_out;
end;
$$;

grant execute on function public.catalog_safe_ilike_fragment(text) to postgres, service_role;
grant execute on function public.catalog_master_account_ok(uuid) to postgres, service_role;
grant execute on function public.catalog_slot_matches(uuid, text, text) to postgres, service_role;
grant execute on function public.catalog_duration_matches(uuid, text) to postgres, service_role;
grant execute on function public.catalog_search_listings(
  text, text, uuid, text, text, text, numeric, numeric, numeric, int, text, boolean, boolean, text, text, int, int
) to postgres, service_role;
grant execute on function public.catalog_suggest_locations(text, int) to postgres, service_role;

-- ======================================================================
-- FILE: 039_sponsor_requests.sql
-- ======================================================================

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

-- ======================================================================
-- FILE: 040_promo_codes.sql
-- ======================================================================

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

-- ======================================================================
-- FILE: 041_master_portfolio_cover.sql
-- ======================================================================

-- Обложка профиля мастера: ссылка на элемент портфолио (фон шапки кабинета).
alter table public.master_profiles
  add column if not exists portfolio_cover_item_id uuid references public.master_portfolio_items (id) on delete set null;

create index if not exists master_profiles_portfolio_cover_item_id_idx
  on public.master_profiles (portfolio_cover_item_id)
  where portfolio_cover_item_id is not null;

comment on column public.master_profiles.portfolio_cover_item_id is
  'Элемент портфолио, используемый как фоновая обложка в кабинете и публичном профиле.';

-- ======================================================================
-- FILE: 042_master_profile_reports.sql
-- ======================================================================

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

-- ======================================================================
-- FILE: 043_appointments_active_slot_unique.sql
-- ======================================================================

-- Allow rebooking a slot after cancel/complete: unique only for active appointments.

alter table public.appointments
  drop constraint if exists appointments_slot_id_key;

drop index if exists public.appointments_slot_id_key;

create unique index if not exists appointments_active_slot_id_idx
  on public.appointments (slot_id)
  where status in (
    'pending'::public.appointment_status,
    'confirmed'::public.appointment_status
  );
