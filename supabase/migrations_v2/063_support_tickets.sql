create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  ticket_code text not null,
  user_id uuid not null references public.profiles (id) on delete cascade,
  master_profile_id uuid references public.master_profiles (master_id) on delete set null,
  plan text,
  category text not null,
  severity text not null,
  subject text not null,
  affected_services jsonb not null default '[]'::jsonb,
  related_booking_code text,
  related_payment_id text,
  message text not null,
  preferred_contact_channel text not null,
  contact_email text,
  contact_telegram text,
  status text not null default 'OPEN',
  source text not null default 'master_settings',
  assigned_to uuid references public.profiles (id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint support_tickets_code_unique unique (ticket_code),
  constraint support_tickets_category_check check (
    category in (
      'account_login',
      'master_profile',
      'services',
      'schedule',
      'appointments',
      'notifications',
      'billing_plan',
      'payment_bepaid',
      'integrations',
      'map_address',
      'ui_bug',
      'other'
    )
  ),
  constraint support_tickets_severity_check check (
    severity in ('low', 'medium', 'high', 'critical')
  ),
  constraint support_tickets_status_check check (
    status in ('OPEN', 'IN_PROGRESS', 'WAITING_USER', 'RESOLVED', 'CLOSED')
  ),
  constraint support_tickets_channel_check check (
    preferred_contact_channel in ('email', 'telegram', 'in_app')
  ),
  constraint support_tickets_source_check check (
    source in ('master_settings', 'client', 'system')
  )
);

create index if not exists idx_support_tickets_user_created
  on public.support_tickets (user_id, created_at desc);

create index if not exists idx_support_tickets_status_updated
  on public.support_tickets (status, updated_at desc);

create index if not exists idx_support_tickets_assigned
  on public.support_tickets (assigned_to)
  where assigned_to is not null;

create table if not exists public.support_ticket_attachments (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.support_tickets (id) on delete cascade,
  file_name text not null,
  storage_path text not null,
  mime_type text not null,
  size_bytes integer not null check (size_bytes > 0),
  created_at timestamptz not null default now()
);

create index if not exists idx_support_ticket_attachments_ticket
  on public.support_ticket_attachments (ticket_id);

create table if not exists public.support_ticket_events (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.support_tickets (id) on delete cascade,
  event_type text not null,
  actor_user_id uuid references public.profiles (id) on delete set null,
  actor_role text not null,
  message text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint support_ticket_events_type_check check (
    event_type in ('CREATED', 'STATUS_CHANGED', 'REPLY', 'ASSIGNED', 'ATTACHMENT_ADDED')
  ),
  constraint support_ticket_events_actor_role_check check (
    actor_role in ('user', 'admin', 'system')
  )
);

create index if not exists idx_support_ticket_events_ticket_created
  on public.support_ticket_events (ticket_id, created_at asc);

comment on table public.support_tickets is 'Обращения в поддержку SLOTTY (кабинет мастера и др.).';
