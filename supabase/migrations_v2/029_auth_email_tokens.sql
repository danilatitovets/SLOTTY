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
