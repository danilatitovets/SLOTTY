import { ADMIN_SCHEDULE_PATH } from '../../../app/paths';

/** Открыть лист «Создать окно» с выбранной услугой. */
export function adminScheduleAddWindowUrl(serviceId: string): string {
  const q = new URLSearchParams();
  q.set('tab', 'create');
  q.set('addWindow', '1');
  q.set('serviceId', serviceId);
  return `${ADMIN_SCHEDULE_PATH}?${q.toString()}`;
}

/** Мастер «Создать окна на период» (без привязки к одной услуге). */
export function adminScheduleMonthWizardUrl(serviceId?: string | null): string {
  const q = new URLSearchParams();
  q.set('tab', 'create');
  q.set('wizard', 'month');
  if (serviceId) q.set('serviceId', serviceId);
  return `${ADMIN_SCHEDULE_PATH}?${q.toString()}`;
}
