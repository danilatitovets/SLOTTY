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
