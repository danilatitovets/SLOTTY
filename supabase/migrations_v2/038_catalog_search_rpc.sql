-- Каталог /services: индексы + RPC для фильтрации (один round-trip, стабильный план).

create extension if not exists pg_trgm;

-- --------------------------------------------------------------------------- helpers

create or replace function public.catalog_safe_ilike_fragment(p_raw text)
returns text
language sql
immutable
as $$
  select nullif(
    left(regexp_replace(trim(coalesce(p_raw, '')), '[%_\\]', ' ', 'g'), 160),
    ''
  );
$$;

create or replace function public.catalog_master_account_ok(p_master_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.profiles pr
    where pr.id = p_master_id
      and pr.account_status not in ('blocked', 'deleted')
      and (
        pr.account_status = 'active'
        or (
          pr.account_status = 'restricted'
          and pr.access_restricted_until is not null
          and pr.access_restricted_until <= now()
        )
      )
  );
$$;

create or replace function public.catalog_slot_matches(
  p_master_id uuid,
  p_date_range text,
  p_time_of_day text
)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.master_availability_slots s
    where s.master_id = p_master_id
      and s.status = 'available'
      and s.starts_at > now()
      and (
        coalesce(p_date_range, 'any') = 'any'
        or (
          (p_date_range = 'today'
            and ((s.starts_at at time zone 'Europe/Minsk'))::date
              = (timezone('Europe/Minsk', now()))::date)
          or (p_date_range = 'tomorrow'
            and ((s.starts_at at time zone 'Europe/Minsk'))::date
              = ((timezone('Europe/Minsk', now()) + interval '1 day'))::date)
          or (p_date_range = 'week'
            and ((s.starts_at at time zone 'Europe/Minsk'))::date
              >= (timezone('Europe/Minsk', now()))::date
            and ((s.starts_at at time zone 'Europe/Minsk'))::date
              <= ((timezone('Europe/Minsk', now()) + interval '7 day'))::date)
          or (p_date_range = 'weekend'
            and extract(dow from (s.starts_at at time zone 'Europe/Minsk')) in (0, 6)
            and ((s.starts_at at time zone 'Europe/Minsk'))::date
              >= (timezone('Europe/Minsk', now()))::date
            and ((s.starts_at at time zone 'Europe/Minsk'))::date
              <= ((timezone('Europe/Minsk', now()) + interval '14 day'))::date)
        )
      )
      and (
        coalesce(p_time_of_day, 'any') = 'any'
        or (
          (p_time_of_day = 'morning'
            and extract(hour from (s.starts_at at time zone 'Europe/Minsk')) >= 8
            and extract(hour from (s.starts_at at time zone 'Europe/Minsk')) < 12)
          or (p_time_of_day = 'afternoon'
            and extract(hour from (s.starts_at at time zone 'Europe/Minsk')) >= 12
            and extract(hour from (s.starts_at at time zone 'Europe/Minsk')) < 17)
          or (p_time_of_day = 'evening'
            and extract(hour from (s.starts_at at time zone 'Europe/Minsk')) >= 17
            and extract(hour from (s.starts_at at time zone 'Europe/Minsk')) < 22)
        )
      )
  );
$$;

create or replace function public.catalog_duration_matches(
  p_master_id uuid,
  p_preset text
)
returns boolean
language sql
stable
as $$
  select case coalesce(p_preset, 'any')
    when 'any' then true
    when 'under30' then exists (
      select 1 from public.master_services ms
      where ms.master_id = p_master_id
        and ms.is_active = true
        and ms.admin_hidden_at is null
        and ms.duration_minutes > 0
        and ms.duration_minutes < 30
    )
    when '30_60' then exists (
      select 1 from public.master_services ms
      where ms.master_id = p_master_id
        and ms.is_active = true
        and ms.admin_hidden_at is null
        and ms.duration_minutes >= 30
        and ms.duration_minutes <= 60
    )
    when '60_120' then exists (
      select 1 from public.master_services ms
      where ms.master_id = p_master_id
        and ms.is_active = true
        and ms.admin_hidden_at is null
        and ms.duration_minutes > 60
        and ms.duration_minutes <= 120
    )
    else exists (
      select 1 from public.master_services ms
      where ms.master_id = p_master_id
        and ms.is_active = true
        and ms.admin_hidden_at is null
        and ms.duration_minutes > 120
    )
  end;
$$;

-- --------------------------------------------------------------------------- indexes

create index if not exists idx_master_profiles_catalog_published
  on public.master_profiles (rating_avg desc, reviews_count desc, display_name)
  where publication_status = 'published';

create index if not exists idx_master_profiles_catalog_verified
  on public.master_profiles (rating_avg desc, reviews_count desc)
  where publication_status = 'published' and is_verified = true;

create index if not exists idx_master_profiles_display_name_trgm
  on public.master_profiles using gin (lower(display_name) gin_trgm_ops);

create index if not exists idx_master_services_catalog_list
  on public.master_services (master_id, sort_order, price_amount, title)
  where is_active = true and admin_hidden_at is null;

create index if not exists idx_master_services_catalog_category
  on public.master_services (category_id, master_id)
  where is_active = true and admin_hidden_at is null;

create index if not exists idx_master_services_catalog_price
  on public.master_services (master_id, price_amount)
  where is_active = true and admin_hidden_at is null;

create index if not exists idx_master_services_title_trgm
  on public.master_services using gin (lower(title) gin_trgm_ops)
  where is_active = true and admin_hidden_at is null;

create index if not exists idx_master_locations_primary_address_trgm
  on public.master_locations using gin (lower(public_address) gin_trgm_ops)
  where is_primary = true;

create index if not exists idx_master_locations_primary_street_trgm
  on public.master_locations using gin (lower(street) gin_trgm_ops)
  where is_primary = true;

create index if not exists idx_master_service_promotions_active_master
  on public.master_service_promotions (master_id, starts_at, ends_at)
  where status = 'active';

-- --------------------------------------------------------------------------- listings RPC

create or replace function public.catalog_search_listings(
  p_search text default null,
  p_category_code text default null,
  p_location_id uuid default null,
  p_address_text text default null,
  p_date_range text default 'any',
  p_time_of_day text default 'any',
  p_min_price numeric default null,
  p_max_price numeric default null,
  p_min_rating numeric default null,
  p_min_reviews int default null,
  p_visit_type text default 'any',
  p_verified_only boolean default false,
  p_promotion_only boolean default false,
  p_duration_preset text default 'any',
  p_sort_by text default 'recommended',
  p_page int default 1,
  p_limit int default 24
)
returns jsonb
language plpgsql
stable
set search_path = public
as $$
declare
  v_search text;
  v_search_pat text;
  v_addr text;
  v_addr_pat text;
  v_page int;
  v_limit int;
  v_offset int;
  v_total int;
  v_items jsonb;
  v_cat text;
begin
  v_search := catalog_safe_ilike_fragment(p_search);
  v_search_pat := case when v_search is not null then '%' || v_search || '%' else null end;
  v_addr := catalog_safe_ilike_fragment(p_address_text);
  v_addr_pat := case when v_addr is not null then '%' || v_addr || '%' else null end;
  v_cat := nullif(trim(coalesce(p_category_code, '')), '');
  v_page := greatest(1, least(coalesce(p_page, 1), 500));
  v_limit := greatest(1, least(coalesce(p_limit, 24), 80));
  v_offset := (v_page - 1) * v_limit;

  with filtered as (
    select
      mp.master_id,
      mp.display_name,
      mp.bio,
      mp.photo_url,
      mp.slug,
      mp.rating_avg,
      mp.reviews_count,
      mp.is_verified,
      sc.code as category_code,
      sc.name as category_name,
      ml.public_address,
      ml.city,
      ml.lat::double precision as location_lat,
      ml.lng::double precision as location_lng,
      ps.id as primary_service_id,
      ps.title as primary_service_title,
      ps.price_amount as primary_service_price,
      ns.starts_at as next_slot_starts_at,
      ns.id as next_slot_id
    from public.master_profiles mp
    left join public.service_categories sc on sc.id = mp.primary_category_id
    left join public.master_locations ml on ml.master_id = mp.master_id and ml.is_primary = true
    left join lateral (
      select ms.id, ms.title, ms.price_amount
      from public.master_services ms
      where ms.master_id = mp.master_id
        and ms.is_active = true
        and ms.admin_hidden_at is null
      order by ms.sort_order asc, ms.price_amount asc nulls last, ms.title asc
      limit 1
    ) ps on true
    left join lateral (
      select s.id, s.starts_at
      from public.master_availability_slots s
      where s.master_id = mp.master_id
        and s.status = 'available'
        and s.starts_at > now()
      order by s.starts_at asc
      limit 1
    ) ns on true
    where mp.publication_status = 'published'
      and public.catalog_master_account_ok(mp.master_id)
      and (
        v_search_pat is null
        or mp.display_name ilike v_search_pat
        or coalesce(ml.public_address, '') ilike v_search_pat
        or exists (
          select 1
          from public.master_services ms
          join public.service_categories scs on scs.id = ms.category_id
          where ms.master_id = mp.master_id
            and ms.is_active = true
            and ms.admin_hidden_at is null
            and (
              ms.title ilike v_search_pat
              or scs.name ilike v_search_pat
              or scs.code ilike v_search_pat
            )
        )
      )
      and (
        v_cat is null
        or sc.code = v_cat
        or exists (
          select 1
          from public.master_services ms2
          join public.service_categories sc2 on sc2.id = ms2.category_id
          where ms2.master_id = mp.master_id
            and ms2.is_active = true
            and ms2.admin_hidden_at is null
            and sc2.code = v_cat
        )
      )
      and (p_location_id is null or ml.id = p_location_id)
      and (
        v_addr_pat is null
        or p_location_id is not null
        or coalesce(ml.public_address, '') ilike v_addr_pat
        or coalesce(ml.street, '') ilike v_addr_pat
        or coalesce(ml.building, '') ilike v_addr_pat
      )
      and (p_min_rating is null or mp.rating_avg >= p_min_rating)
      and (p_min_reviews is null or p_min_reviews <= 0 or mp.reviews_count >= p_min_reviews)
      and (
        coalesce(p_visit_type, 'any') = 'any'
        or ml.visit_type = p_visit_type::public.visit_type
      )
      and (not coalesce(p_verified_only, false) or mp.is_verified = true)
      and (
        not coalesce(p_promotion_only, false)
        or exists (
          select 1 from public.master_services msp
          where msp.master_id = mp.master_id
            and msp.is_active = true
            and msp.admin_hidden_at is null
            and (
              msp.has_promotion = true
              or (msp.old_price_amount is not null and msp.old_price_amount > msp.price_amount)
            )
        )
        or exists (
          select 1 from public.master_service_promotions pr
          where pr.master_id = mp.master_id
            and pr.status = 'active'
            and pr.starts_at <= now()
            and pr.ends_at >= now()
        )
      )
      and public.catalog_duration_matches(mp.master_id, p_duration_preset)
      and (
        (coalesce(p_date_range, 'any') = 'any' and coalesce(p_time_of_day, 'any') = 'any')
        or public.catalog_slot_matches(mp.master_id, p_date_range, p_time_of_day)
      )
      and (
        p_min_price is null
        or exists (
          select 1 from public.master_services msp
          where msp.master_id = mp.master_id
            and msp.is_active = true
            and msp.admin_hidden_at is null
            and msp.price_amount >= p_min_price
        )
      )
      and (
        p_max_price is null
        or exists (
          select 1 from public.master_services msp
          where msp.master_id = mp.master_id
            and msp.is_active = true
            and msp.admin_hidden_at is null
            and msp.price_amount <= p_max_price
        )
      )
  ),
  counted as (
    select count(*)::int as c from filtered
  ),
  sorted as (
    select *
    from filtered f
    order by
      case when coalesce(p_sort_by, 'recommended') in ('recommended', 'soonest') then
        case when f.next_slot_starts_at is null then 1 else 0 end
      end asc nulls last,
      case when coalesce(p_sort_by, 'recommended') in ('recommended', 'soonest') then
        f.next_slot_starts_at
      end asc nulls last,
      case when coalesce(p_sort_by, 'recommended') = 'rating' then f.rating_avg end desc nulls last,
      case when p_sort_by = 'price_asc' then f.primary_service_price end asc nulls last,
      case when p_sort_by = 'price_desc' then f.primary_service_price end desc nulls last,
      case when p_sort_by = 'reviews' then f.reviews_count end desc nulls last,
      case when coalesce(p_sort_by, 'recommended') in ('recommended', 'soonest') then f.rating_avg end desc nulls last,
      case when coalesce(p_sort_by, 'recommended') in ('recommended', 'soonest') then f.reviews_count end desc nulls last,
      f.display_name asc
    limit v_limit
    offset v_offset
  )
  select
    (select c from counted),
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'masterId', s.master_id,
            'displayName', s.display_name,
            'bio', s.bio,
            'photoUrl', s.photo_url,
            'slug', s.slug,
            'rating', coalesce(s.rating_avg, 0),
            'reviewsCount', s.reviews_count,
            'isVerified', s.is_verified,
            'category', case
              when s.category_code is not null then jsonb_build_object(
                'code', s.category_code,
                'name', coalesce(s.category_name, s.category_code)
              )
              else null
            end,
            'location', case
              when s.public_address is not null then jsonb_build_object(
                'publicAddress', s.public_address,
                'city', s.city,
                'lat', s.location_lat,
                'lng', s.location_lng
              )
              when s.city is not null then jsonb_build_object(
                'publicAddress', s.city,
                'city', s.city,
                'lat', s.location_lat,
                'lng', s.location_lng
              )
              when s.location_lat is not null and s.location_lng is not null then jsonb_build_object(
                'publicAddress', 'Точка на карте',
                'city', s.city,
                'lat', s.location_lat,
                'lng', s.location_lng
              )
              else null
            end,
            'minServicePrice', s.primary_service_price,
            'primaryServiceId', s.primary_service_id,
            'primaryServiceName', s.primary_service_title,
            'nextSlotStartsAt', s.next_slot_starts_at,
            'nextSlotId', s.next_slot_id
          )
        )
        from sorted s
      ),
      '[]'::jsonb
    )
  into v_total, v_items;

  return jsonb_build_object(
    'items', v_items,
    'total', coalesce(v_total, 0),
    'page', v_page,
    'limit', v_limit,
    'hasMore', (v_offset + jsonb_array_length(v_items)) < coalesce(v_total, 0)
  );
end;
$$;

comment on function public.catalog_search_listings is
  'Каталог мастеров: фильтры, сортировка, пагинация (GET /api/catalog/listings).';

-- --------------------------------------------------------------------------- location suggestions RPC

create or replace function public.catalog_suggest_locations(
  p_query text default '',
  p_limit int default 12
)
returns jsonb
language plpgsql
stable
set search_path = public
as $$
declare
  v_frag text;
  v_pat text;
  v_lim int;
  v_out jsonb;
begin
  v_frag := catalog_safe_ilike_fragment(p_query);
  if v_frag is null then
    return '[]'::jsonb;
  end if;
  v_pat := '%' || v_frag || '%';
  v_lim := greatest(1, least(coalesce(p_limit, 12), 30));

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', a.id,
        'type', 'address',
        'title', a.title,
        'subtitle',
          case
            when a.master_count = 1 then '1 мастер'
            else a.master_count::text || ' мастеров'
          end
          || ' · '
          || case
            when a.slot_count = 0 then 'нет окон'
            when a.slot_count = 1 then '1 окно'
            else a.slot_count::text || ' окон'
          end
      )
      order by a.master_count desc, a.title asc
    ),
    '[]'::jsonb
  )
  into v_out
  from (
    select
      min(b.id) as id,
      b.public_address as title,
      count(distinct b.master_id)::int as master_count,
      sum(b.slot_count)::int as slot_count
    from (
      select
        ml.id,
        ml.public_address,
        ml.master_id,
        (
          select count(*)::int
          from public.master_availability_slots s
          where s.master_id = ml.master_id
            and s.status = 'available'
            and s.starts_at > now()
        ) as slot_count
      from public.master_locations ml
      join public.master_profiles mp on mp.master_id = ml.master_id
      where mp.publication_status = 'published'
        and public.catalog_master_account_ok(mp.master_id)
        and ml.is_primary = true
        and (
          ml.public_address ilike v_pat
          or coalesce(ml.street, '') ilike v_pat
          or coalesce(ml.building, '') ilike v_pat
          or coalesce(ml.landmark, '') ilike v_pat
        )
    ) b
    group by lower(trim(b.public_address)), b.public_address
    order by count(distinct b.master_id) desc, b.public_address asc
    limit v_lim
  ) a;

  return v_out;
end;
$$;

grant execute on function public.catalog_safe_ilike_fragment(text) to postgres, service_role;
grant execute on function public.catalog_master_account_ok(uuid) to postgres, service_role;
grant execute on function public.catalog_slot_matches(uuid, text, text) to postgres, service_role;
grant execute on function public.catalog_duration_matches(uuid, text) to postgres, service_role;
grant execute on function public.catalog_search_listings(
  text, text, uuid, text, text, text, numeric, numeric, numeric, int, text, boolean, boolean, text, text, int, int
) to postgres, service_role;
grant execute on function public.catalog_suggest_locations(text, int) to postgres, service_role;
