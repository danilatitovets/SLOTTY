-- Ответ мастера на отзыв (один раз)

alter table public.reviews
  add column if not exists master_reply text,
  add column if not exists master_reply_at timestamptz;

create policy reviews_update_master_reply on public.reviews
for update
  to authenticated
  using (master_id = (select auth.uid()))
with
  check (master_id = (select auth.uid()));
