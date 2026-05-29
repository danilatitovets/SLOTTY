-- Кабинет мастера (/admin → Профиль, Портфолио, Адрес, Правила):
-- быстрее GET /api/masters/me и refresh после сохранения фото/портфолио/сертификатов.

-- Портфолио: ORDER BY sort_order, created_at + недавние загрузки
create index if not exists idx_master_portfolio_master_created
  on public.master_portfolio_items (master_id, created_at desc);

create index if not exists idx_master_portfolio_master_list_covering
  on public.master_portfolio_items (master_id, sort_order asc, created_at asc)
  include (image_url, title, description);

-- Сертификаты
create index if not exists idx_master_certificates_master_created
  on public.master_certificates (master_id, created_at desc);

create index if not exists idx_master_certificates_master_list_covering
  on public.master_certificates (master_id, sort_order asc, created_at asc)
  include (title, issuer, year, image_url, description);

-- Образование и опыт
create index if not exists idx_master_career_master_created
  on public.master_career_items (master_id, created_at desc);

create index if not exists idx_master_career_master_list_covering
  on public.master_career_items (master_id, sort_order asc, created_at asc)
  include (type, title, place, start_year, end_year, description);

-- PATCH/DELETE по паре master_id + id (кабинет, синхронизация листов)
create index if not exists idx_master_portfolio_master_item
  on public.master_portfolio_items (master_id, id);

create index if not exists idx_master_certificates_master_item
  on public.master_certificates (master_id, id);

create index if not exists idx_master_career_master_item
  on public.master_career_items (master_id, id);

-- Первичный адрес (GET/PUT primary-location)
create index if not exists idx_master_locations_primary_covering
  on public.master_locations (master_id)
  include (
    visit_type,
    city,
    street,
    building,
    building_detail,
    salon_name,
    district,
    entrance,
    floor,
    room,
    intercom,
    landmark,
    directions,
    client_note,
    public_address,
    lat,
    lng,
    show_exact_address_after_booking
  )
  where is_primary = true;
