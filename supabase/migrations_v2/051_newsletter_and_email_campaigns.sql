-- Newsletter subscribers and admin email campaigns

create table public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  normalized_email text not null,
  status text not null default 'subscribed',
  source text not null default 'footer',
  profile_id uuid references public.profiles (id) on delete set null,
  consent_accepted boolean not null default true,
  consent_text_version text,
  subscribed_at timestamptz not null default now(),
  unsubscribed_at timestamptz,
  unsubscribe_token text not null,
  ip_address text,
  user_agent text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint newsletter_subscribers_normalized_email_key unique (normalized_email),
  constraint newsletter_subscribers_status_check check (
    status in ('subscribed', 'unsubscribed', 'bounced', 'complained', 'blocked')
  )
);

create unique index idx_newsletter_subscribers_unsubscribe_token on public.newsletter_subscribers (unsubscribe_token);

create index idx_newsletter_subscribers_status on public.newsletter_subscribers (status);

comment on table public.newsletter_subscribers is 'Marketing newsletter opt-in subscribers (footer and other sources)';

create table public.email_campaigns (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subject text not null,
  preview_text text,
  body_html text not null,
  body_text text,
  cta_text text,
  cta_url text,
  audience text not null,
  status text not null default 'draft',
  created_by_profile_id uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  scheduled_at timestamptz,
  sent_at timestamptz,
  cancelled_at timestamptz,
  constraint email_campaigns_audience_check check (
    audience in ('newsletter_subscribers', 'masters', 'clients', 'all_profiles', 'test_only')
  ),
  constraint email_campaigns_status_check check (
    status in ('draft', 'scheduled', 'sending', 'sent', 'cancelled', 'failed')
  )
);

create index idx_email_campaigns_status on public.email_campaigns (status, created_at desc);

comment on table public.email_campaigns is 'Platform admin email campaigns (marketing / service announcements)';

create table public.email_campaign_recipients (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.email_campaigns (id) on delete cascade,
  email text not null,
  profile_id uuid references public.profiles (id) on delete set null,
  subscriber_id uuid references public.newsletter_subscribers (id) on delete set null,
  status text not null default 'pending',
  sent_at timestamptz,
  failed_at timestamptz,
  error_message text,
  resend_message_id text,
  created_at timestamptz not null default now(),
  constraint email_campaign_recipients_status_check check (
    status in ('pending', 'sent', 'failed', 'skipped', 'unsubscribed')
  ),
  constraint email_campaign_recipients_campaign_email_key unique (campaign_id, email)
);

create index idx_email_campaign_recipients_campaign on public.email_campaign_recipients (campaign_id);

create index idx_email_campaign_recipients_campaign_status on public.email_campaign_recipients (campaign_id, status);

comment on table public.email_campaign_recipients is 'Per-recipient delivery log for email campaigns';
