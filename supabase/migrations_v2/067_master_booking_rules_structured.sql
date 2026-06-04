-- Структурированные правила записи мастера (SaaS-настройки).

alter table public.master_booking_rules
  add column if not exists min_booking_notice_minutes int not null default 1440
    check (min_booking_notice_minutes >= 0),
  add column if not exists requires_master_confirmation boolean not null default true,
  add column if not exists free_cancel_before_minutes int not null default 720
    check (free_cancel_before_minutes >= 0),
  add column if not exists late_cancel_policy text not null default 'mark_late'
    check (late_cancel_policy in ('mark_late', 'require_agreement', 'warning_only')),
  add column if not exists allowed_lateness_minutes int not null default 15
    check (allowed_lateness_minutes >= 0),
  add column if not exists late_arrival_policy text not null default 'master_can_cancel'
    check (late_arrival_policy in ('master_can_cancel', 'shorten_visit', 'reschedule_by_agreement')),
  add column if not exists no_show_after_minutes int not null default 15
    check (no_show_after_minutes >= 0),
  add column if not exists no_show_policy text not null default 'mark_no_show'
    check (no_show_policy in ('mark_no_show', 'client_can_dispute')),
  add column if not exists reschedule_enabled boolean not null default true,
  add column if not exists reschedule_before_minutes int not null default 720
    check (reschedule_before_minutes >= 0),
  add column if not exists reschedule_limit int
    check (reschedule_limit is null or reschedule_limit >= 0),
  add column if not exists prepayment_required boolean not null default false,
  add column if not exists refund_policy_enabled boolean not null default false,
  add column if not exists refund_policy_text text,
  add column if not exists visit_preparation_text text,
  add column if not exists contraindications_text text,
  add column if not exists completion_score smallint not null default 0
    check (completion_score >= 0 and completion_score <= 100);

comment on column public.master_booking_rules.min_booking_notice_minutes is 'Минимальный интервал до начала слота для новой записи';
comment on column public.master_booking_rules.completion_score is 'Заполненность правил 0–100 для кабинета мастера';

-- Дефолты для существующих строк
update public.master_booking_rules
   set reschedule_limit = coalesce(reschedule_limit, 2),
       completion_score = case when completion_score = 0 then 60 else completion_score end
 where reschedule_limit is null;
