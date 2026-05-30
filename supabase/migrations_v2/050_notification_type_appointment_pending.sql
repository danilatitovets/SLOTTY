-- Тип in-app для заявки на запись (статус pending)

do $$
begin
  alter type public.notification_type add value 'appointment_pending';
exception
  when duplicate_object then null;
end
$$;
