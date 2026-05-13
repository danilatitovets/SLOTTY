-- SLOTTY DB v2 — координаты основной точки приёма (карты для клиентов).
-- Идемпотентно: безопасно для БД, где колонки уже созданы в 004_services_locations_rules.sql.

alter table public.master_locations
  add column if not exists lat double precision;

alter table public.master_locations
  add column if not exists lng double precision;

comment on column public.master_locations.lat is 'Широта WGS84 для метки на карте (клиенты / каталог)';
comment on column public.master_locations.lng is 'Долгота WGS84 для метки на карте (клиенты / каталог)';
