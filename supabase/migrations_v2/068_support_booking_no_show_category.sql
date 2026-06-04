-- Категория support-тикета «Клиент не пришёл» (отчёт мастера, без авто-блокировки).
alter table public.support_tickets drop constraint if exists support_tickets_category_check;

alter table public.support_tickets add constraint support_tickets_category_check check (
  category in (
    'account_login',
    'master_profile',
    'services',
    'schedule',
    'appointments',
    'booking_no_show',
    'notifications',
    'billing_plan',
    'payment_bepaid',
    'integrations',
    'map_address',
    'ui_bug',
    'other'
  )
);
