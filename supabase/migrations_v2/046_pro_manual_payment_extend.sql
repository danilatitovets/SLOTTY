alter table public.pro_manual_payment_requests
  add column if not exists profile_id uuid references public.profiles (id) on delete cascade,
  add column if not exists plan_code text not null default 'pro',
  add column if not exists receipt_file_path text;

update public.pro_manual_payment_requests
   set profile_id = master_id
 where profile_id is null;

alter table public.pro_manual_payment_requests
  alter column profile_id set not null;

alter table public.pro_manual_payment_requests
  drop constraint if exists pro_manual_payment_requests_tariff_amount_check;

alter table public.pro_manual_payment_requests
  add constraint pro_manual_payment_requests_tariff_amount_check check (tariff_amount > 0),
  add constraint pro_manual_payment_requests_declared_paid_check check (declared_paid_amount > 0),
  add constraint pro_manual_payment_requests_received_amount_check
    check (received_amount is null or received_amount >= 0),
  add constraint pro_manual_payment_requests_bank_fee_check
    check (bank_fee_amount is null or bank_fee_amount >= 0),
  add constraint pro_manual_payment_requests_currency_byn_check check (currency = 'BYN'),
  add constraint pro_manual_payment_requests_fee_slotty_check check (fee_covered_by = 'slotty');

create index if not exists idx_pro_manual_payment_requests_profile
  on public.pro_manual_payment_requests (profile_id, created_at desc);

create index if not exists idx_pro_manual_payment_requests_created
  on public.pro_manual_payment_requests (created_at desc);

comment on column public.pro_manual_payment_requests.profile_id is
  'Профиль мастера (совпадает с master_id в текущей модели SLOTTY).';
comment on column public.pro_manual_payment_requests.receipt_file_path is
  'Путь к скрину/чеку в Supabase Storage (bucket master media).';
