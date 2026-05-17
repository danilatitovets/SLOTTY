-- Защита окон записи: нельзя менять/удалять занятое окно или окно с активной записью.

create or replace function public.guard_master_availability_slot_change()
returns trigger
language plpgsql
as $$
declare
  v_active_appt boolean;
begin
  if TG_OP = 'DELETE' then
    if exists (select 1 from public.appointments a where a.slot_id = OLD.id) then
      raise exception 'SLOT_HAS_HISTORY'
        using errcode = 'P0001',
          message = 'Нельзя удалить окно: по нему есть запись в истории';
    end if;
    return OLD;
  end if;

  if TG_OP = 'UPDATE' then
    if OLD.status is distinct from 'available'::public.slot_status then
      if NEW.starts_at is distinct from OLD.starts_at
        or NEW.ends_at is distinct from OLD.ends_at
        or NEW.service_id is distinct from OLD.service_id
        or NEW.status is distinct from OLD.status and NEW.status is distinct from 'available'::public.slot_status
      then
        raise exception 'SLOT_NOT_EDITABLE'
          using errcode = 'P0001',
            message = 'Окно занято или недоступно для изменения';
      end if;
    end if;

    select exists (
      select 1
        from public.appointments a
       where a.slot_id = OLD.id
         and a.status in ('pending'::public.appointment_status, 'confirmed'::public.appointment_status)
    ) into v_active_appt;

    if v_active_appt then
      if NEW.starts_at is distinct from OLD.starts_at
        or NEW.ends_at is distinct from OLD.ends_at
        or NEW.service_id is distinct from OLD.service_id
      then
        raise exception 'SLOT_HAS_APPOINTMENT'
          using errcode = 'P0001',
            message = 'На окно есть активная запись';
      end if;
    end if;
  end if;

  return NEW;
end;
$$;

drop trigger if exists trg_guard_master_availability_slots on public.master_availability_slots;

create trigger trg_guard_master_availability_slots
before update or delete on public.master_availability_slots
for each row
execute function public.guard_master_availability_slot_change();

comment on function public.guard_master_availability_slot_change () is
  'Блокирует удаление окна с историей записей и изменение времени/услуги при брони';
