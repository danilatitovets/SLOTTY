-- Явный флаг активности профиля мастера (синхронизируется с publication_status)

alter table public.master_profiles
  add column if not exists is_profile_active boolean not null default false;

comment on column public.master_profiles.is_profile_active is
  'true = профиль виден в каталоге и доступен для записи (publication_status = published)';

update public.master_profiles
   set is_profile_active = (publication_status = 'published'::public.master_publication_status)
 where is_profile_active is distinct from (publication_status = 'published'::public.master_publication_status);
