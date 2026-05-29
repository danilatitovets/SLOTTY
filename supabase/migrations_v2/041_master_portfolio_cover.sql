-- Обложка профиля мастера: ссылка на элемент портфолио (фон шапки кабинета).
alter table public.master_profiles
  add column if not exists portfolio_cover_item_id uuid references public.master_portfolio_items (id) on delete set null;

create index if not exists master_profiles_portfolio_cover_item_id_idx
  on public.master_profiles (portfolio_cover_item_id)
  where portfolio_cover_item_id is not null;

comment on column public.master_profiles.portfolio_cover_item_id is
  'Элемент портфолио, используемый как фоновая обложка в кабинете и публичном профиле.';
