/**
 * SQL-фрагмент: мастер доступен для публичной записи / слотов.
 * active ИЛИ restricted с истёкшим until; blocked/deleted исключены.
 */
export const PUBLIC_BOOKABLE_MASTER_ACCOUNT_SQL = `exists (
  select 1 from public.profiles pr
  where pr.id = mp.master_id
    and pr.account_status not in ('blocked', 'deleted')
    and (
      pr.account_status = 'active'
      or (
        pr.account_status = 'restricted'
        and pr.access_restricted_until is not null
        and pr.access_restricted_until <= now()
      )
    )
)`;
