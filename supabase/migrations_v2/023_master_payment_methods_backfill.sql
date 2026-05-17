-- Перенос способов оплаты из legacy JSON в master_payment_methods (payment_note остаётся только текстом).

create or replace function public._slotty_parse_legacy_payment_methods(payment_note text)
returns text[]
language plpgsql
immutable
as $$
declare
  marker constant text := '__SLOTTY_PAYMENT_METHODS_JSON__';
  pos int;
  json_part text;
  parsed jsonb;
begin
  if payment_note is null or length(trim(payment_note)) = 0 then
    return array[]::text[];
  end if;
  pos := position(marker in payment_note);
  if pos = 0 then
    return array[]::text[];
  end if;
  json_part := trim(substring(payment_note from pos + length(marker)));
  if json_part = '' then
    return array[]::text[];
  end if;
  begin
    parsed := json_part::jsonb;
  exception when others then
    return array[]::text[];
  end;
  if jsonb_typeof(parsed) <> 'array' then
    return array[]::text[];
  end if;
  return coalesce(
    (
      select array_agg(elem #>> '{}')
      from jsonb_array_elements(parsed) elem
      where jsonb_typeof(elem) = 'string'
    ),
    array[]::text[]
  );
end;
$$;

-- Связи master ↔ payment_methods по имени или коду из seed.
insert into public.master_payment_methods (master_id, payment_method_id)
select distinct br.master_id, pm.id
  from public.master_booking_rules br
 cross join lateral unnest(public._slotty_parse_legacy_payment_methods(br.payment_note)) as method_name
  join public.payment_methods pm
    on pm.is_active
   and (pm.name = method_name or pm.code = lower(replace(method_name, ' ', '_')))
 where method_name is not null
   and length(trim(method_name)) > 0
 on conflict (master_id, payment_method_id) do nothing;

-- Очистить payment_note от legacy JSON.
update public.master_booking_rules br
   set payment_note = nullif(
         trim(
           case
             when position('__SLOTTY_PAYMENT_METHODS_JSON__' in coalesce(br.payment_note, '')) > 0 then
               substring(
                 br.payment_note
                 from 1
                 for position('__SLOTTY_PAYMENT_METHODS_JSON__' in br.payment_note) - 1
               )
             else br.payment_note
           end
         ),
         ''
       ),
       updated_at = now()
 where br.payment_note is not null
   and position('__SLOTTY_PAYMENT_METHODS_JSON__' in br.payment_note) > 0;

drop function if exists public._slotty_parse_legacy_payment_methods(text);
