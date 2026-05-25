-- Фото желаемого дизайна / причёски при записи (маникюр, барбер, и т.д.)
alter table public.appointments
  add column if not exists client_reference_photo_url text;

comment on column public.appointments.client_reference_photo_url is
  'Публичный URL фото-референса от клиента (дизайн ногтей, стрижка и т.п.)';
