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
