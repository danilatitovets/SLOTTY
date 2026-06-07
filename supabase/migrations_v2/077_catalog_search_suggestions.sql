-- Подсказки поиска каталога (WB-style): популярные запросы + совпадения по категориям/услугам/мастерам.

create table if not exists public.catalog_search_queries (
  id uuid primary key default gen_random_uuid(),
  query_normalized text not null,
  query_display text not null,
  hit_count int not null default 1,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint catalog_search_queries_norm_unique unique (query_normalized)
);

create index if not exists idx_catalog_search_queries_norm_trgm
  on public.catalog_search_queries using gin (query_normalized gin_trgm_ops);

create index if not exists idx_catalog_search_queries_hits
  on public.catalog_search_queries (hit_count desc, last_seen_at desc);

create or replace function public.catalog_normalize_search_query(p_raw text)
returns text
language sql
immutable
as $$
  select nullif(
    lower(trim(regexp_replace(coalesce(p_raw, ''), '\s+', ' ', 'g'))),
    ''
  );
$$;

create or replace function public.catalog_record_search_query(p_raw text)
returns void
language plpgsql
volatile
set search_path = public
as $$
declare
  v_disp text;
  v_norm text;
begin
  v_disp := catalog_safe_ilike_fragment(p_raw);
  if v_disp is null then
    return;
  end if;
  v_norm := catalog_normalize_search_query(v_disp);
  if v_norm is null then
    return;
  end if;

  insert into public.catalog_search_queries (query_normalized, query_display, hit_count, last_seen_at)
  values (v_norm, v_disp, 1, now())
  on conflict (query_normalized) do update
  set
    hit_count = public.catalog_search_queries.hit_count + 1,
    last_seen_at = now(),
    query_display = excluded.query_display;
end;
$$;

create or replace function public.catalog_suggest_search(
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
  v_prefix text;
  v_lim int;
  v_popular jsonb;
  v_items jsonb;
begin
  v_frag := catalog_safe_ilike_fragment(p_query);
  v_lim := greatest(1, least(coalesce(p_limit, 12), 20));

  if v_frag is null then
    select coalesce(
      jsonb_agg(
        jsonb_build_object(
          'type', 'query',
          'id', 'q:' || q.query_normalized,
          'title', q.query_display,
          'subtitle', 'Часто ищут',
          'group', 'popular'
        )
        order by q.hit_count desc, q.last_seen_at desc
      ),
      '[]'::jsonb
    )
    into v_popular
    from (
      select query_normalized, query_display, hit_count, last_seen_at
      from public.catalog_search_queries
      order by hit_count desc, last_seen_at desc
      limit 8
    ) q;

    if jsonb_array_length(v_popular) = 0 then
      select coalesce(
        jsonb_agg(
          jsonb_build_object(
            'type', 'query',
            'id', 'svc:' || s.title_key,
            'title', s.title,
            'subtitle', 'Часто ищут',
            'group', 'popular'
          )
          order by s.cnt desc, s.title asc
        ),
        '[]'::jsonb
      )
      into v_popular
      from (
        select lower(trim(ms.title)) as title_key, min(ms.title) as title, count(*)::int as cnt
        from public.master_services ms
        join public.master_profiles mp on mp.master_id = ms.master_id
        where ms.is_active = true
          and ms.admin_hidden_at is null
          and mp.publication_status = 'published'
          and public.catalog_master_account_ok(mp.master_id)
          and trim(coalesce(ms.title, '')) <> ''
        group by lower(trim(ms.title))
        order by count(*) desc, min(ms.title) asc
        limit 8
      ) s;
    end if;

    return jsonb_build_object('popular', v_popular, 'items', '[]'::jsonb);
  end if;

  v_pat := '%' || v_frag || '%';
  v_prefix := lower(v_frag) || '%';

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'type', 'query',
        'id', 'q:' || q.query_normalized,
        'title', q.query_display,
        'subtitle', 'Часто ищут',
        'group', 'popular'
      )
      order by q.hit_count desc
    ),
    '[]'::jsonb
  )
  into v_popular
  from (
    select query_normalized, query_display, hit_count
    from public.catalog_search_queries
    where query_normalized like v_prefix or query_display ilike v_pat
    order by hit_count desc, last_seen_at desc
    limit 5
  ) q;

  select coalesce(
    jsonb_agg(item order by item->>'sortKey'),
    '[]'::jsonb
  )
  into v_items
  from (
    select jsonb_build_object(
      'type', 'category',
      'id', 'cat:' || c.code,
      'title', c.name,
      'subtitle', case
        when c.master_count = 1 then '1 мастер'
        else c.master_count::text || ' мастеров'
      end,
      'categoryCode', c.code,
      'group', 'match',
      'sortKey', '1-' || lpad(c.rank::text, 4, '0')
    ) as item
    from (
      select
        sc.code,
        sc.name,
        count(distinct mp.master_id)::int as master_count,
        row_number() over (order by count(distinct mp.master_id) desc, sc.name asc) as rank
      from public.service_categories sc
      join public.master_profiles mp on mp.primary_category_id = sc.id
      where sc.is_active = true
        and mp.publication_status = 'published'
        and public.catalog_master_account_ok(mp.master_id)
        and (sc.name ilike v_pat or sc.code ilike v_pat)
      group by sc.code, sc.name
      limit 3
    ) c

    union all

    select jsonb_build_object(
      'type', 'service',
      'id', 'svc:' || s.service_id::text,
      'title', s.title,
      'subtitle', coalesce(s.category_name, 'Услуга')
        || case when s.price_amount is not null then ' · от ' || s.price_amount::text || ' BYN' else '' end,
      'masterId', s.master_id,
      'serviceId', s.service_id,
      'categoryCode', s.category_code,
      'group', 'match',
      'sortKey', '2-' || lpad(s.rank::text, 4, '0')
    )
    from (
      select
        ms.id as service_id,
        ms.title,
        ms.price_amount,
        ms.master_id,
        sc.name as category_name,
        sc.code as category_code,
        row_number() over (
          order by
            case when lower(ms.title) like v_prefix then 0 else 1 end,
            similarity(lower(ms.title), lower(v_frag)) desc,
            mp.reviews_count desc nulls last
        ) as rank
      from public.master_services ms
      join public.master_profiles mp on mp.master_id = ms.master_id
      left join public.service_categories sc on sc.id = ms.category_id
      where ms.is_active = true
        and ms.admin_hidden_at is null
        and mp.publication_status = 'published'
        and public.catalog_master_account_ok(mp.master_id)
        and ms.title ilike v_pat
      limit 5
    ) s

    union all

    select jsonb_build_object(
      'type', 'master',
      'id', 'm:' || m.master_id::text,
      'title', m.display_name,
      'subtitle', coalesce(m.category_name, 'Мастер')
        || case when m.rating_avg > 0 then ' · ' || round(m.rating_avg, 1)::text else '' end,
      'masterId', m.master_id,
      'slug', m.slug,
      'categoryCode', m.category_code,
      'group', 'match',
      'sortKey', '3-' || lpad(m.rank::text, 4, '0')
    )
    from (
      select
        mp.master_id,
        mp.display_name,
        mp.slug,
        mp.rating_avg,
        sc.name as category_name,
        sc.code as category_code,
        row_number() over (
          order by
            case when lower(mp.display_name) like v_prefix then 0 else 1 end,
            similarity(lower(mp.display_name), lower(v_frag)) desc,
            mp.reviews_count desc nulls last
        ) as rank
      from public.master_profiles mp
      left join public.service_categories sc on sc.id = mp.primary_category_id
      where mp.publication_status = 'published'
        and public.catalog_master_account_ok(mp.master_id)
        and mp.display_name ilike v_pat
      limit 4
    ) m
  ) combined;

  return jsonb_build_object(
    'popular', coalesce(v_popular, '[]'::jsonb),
    'items', coalesce(v_items, '[]'::jsonb)
  );
end;
$$;

-- Стартовые популярные запросы из активных услуг
insert into public.catalog_search_queries (query_normalized, query_display, hit_count)
select lower(trim(ms.title)), trim(ms.title), greatest(count(*)::int, 1)
from public.master_services ms
join public.master_profiles mp on mp.master_id = ms.master_id
where ms.is_active = true
  and ms.admin_hidden_at is null
  and mp.publication_status = 'published'
  and trim(coalesce(ms.title, '')) <> ''
group by lower(trim(ms.title)), trim(ms.title)
on conflict (query_normalized) do nothing;

grant execute on function public.catalog_normalize_search_query(text) to postgres, service_role;
grant execute on function public.catalog_record_search_query(text) to postgres, service_role;
grant execute on function public.catalog_suggest_search(text, int) to postgres, service_role;
