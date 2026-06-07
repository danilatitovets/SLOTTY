import type { DemoMasterAppointment } from '../../../features/master/model/demoMasterAppointments';
import type { ManagedService } from './servicesFormat';

const UPCOMING_STATUSES = new Set<DemoMasterAppointment['status']>(['pending', 'confirmed']);

export const SERVICE_DELETE_BLOCKED_TITLE = 'Нельзя удалить';

export const SERVICE_DELETE_BLOCKED_BODY =
  'На услугу есть будущие записи. Отмените их в разделе «Записи» или скройте услугу в каталоге.';

export const SERVICE_DELETE_BLOCKED_HINT =
  'Вместо удаления можно скрыть услугу — кнопка выше.';

export const SERVICE_DELETE_BLOCKED_MESSAGE = `${SERVICE_DELETE_BLOCKED_TITLE}: ${SERVICE_DELETE_BLOCKED_BODY}`;

function appointmentEndMs(a: DemoMasterAppointment): number {
  if (a.endsAt) return new Date(a.endsAt).getTime();
  const [y, m, d] = a.date.split('-').map(Number);
  const [hh, mm] = (a.time || '00:00').split(':').map(Number);
  return new Date(y, m - 1, d, hh, mm).getTime();
}

function appointmentMatchesService(a: DemoMasterAppointment, service: ManagedService): boolean {
  if (a.serviceId && a.serviceId === service.id) return true;
  return a.serviceTitle.trim() === service.title.trim();
}

/** Есть ли у услуги будущие записи (pending / confirmed). */
export function serviceHasUpcomingAppointments(
  appointments: DemoMasterAppointment[],
  service: ManagedService,
): boolean {
  const now = Date.now();
  return appointments.some((a) => {
    if (!UPCOMING_STATUSES.has(a.status)) return false;
    if (!appointmentMatchesService(a, service)) return false;
    return appointmentEndMs(a) > now;
  });
}
