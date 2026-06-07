import type { MasterOnboardingService } from '../../../features/profile/lib/demoMasterStorage';
import { isUuid } from '../../../features/admin/lib/masterCabinetMapper';
import { buildWebBookingAbsoluteUrl, readPublicAppOrigin } from '../../../shared/lib/masterBookingLink';
import { openTelegramShareUrlPicker } from '../../../shared/lib/telegramWebApp';
import type { ScheduleWindowView } from './scheduleTypes';

export function resolveScheduleWindowShareServiceId(
  windowServiceId: string | null,
  services: MasterOnboardingService[],
): string | null {
  if (windowServiceId && isUuid(windowServiceId)) return windowServiceId;
  const first = services.find((s) => isUuid(s.id));
  return first?.id ?? null;
}

export function buildScheduleWindowShareUrl(params: {
  masterId: string | null | undefined;
  window: Pick<ScheduleWindowView, 'id' | 'serviceId'>;
  services: MasterOnboardingService[];
  origin?: string;
}): string | null {
  const masterId = params.masterId?.trim();
  const slotId = params.window.id?.trim();
  if (!masterId || !slotId || !isUuid(masterId) || !isUuid(slotId)) return null;

  const serviceId = resolveScheduleWindowShareServiceId(params.window.serviceId, params.services);
  if (!serviceId) return null;

  return buildWebBookingAbsoluteUrl(
    params.origin ?? readPublicAppOrigin(),
    masterId,
    serviceId,
    slotId,
  );
}

export async function shareScheduleWindowLink(href: string, title: string): Promise<'shared' | 'copied'> {
  if (openTelegramShareUrlPicker(href, title)) return 'shared';

  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      await navigator.share({ title, url: href });
      return 'shared';
    } catch {
      /* отмена или ошибка */
    }
  }

  await navigator.clipboard.writeText(href);
  return 'copied';
}
