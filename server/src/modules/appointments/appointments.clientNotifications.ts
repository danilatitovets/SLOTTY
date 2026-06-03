import { notifyUser } from '../notifications/notifyUser.js';
import { clientBookingTelegramKeyboard } from '../notifications/telegramAppointmentKeyboard.js';
import {
  clientBookingCancelledByMaster,
  clientBookingCancelledBySelf,
  clientBookingCompleted,
  clientBookingConfirmed,
  clientBookingRequestCreated,
} from '../notifications/templates/appointmentNotificationTemplates.js';
import type { AppointmentNotifyContext } from './appointmentNotifyContext.js';
import { fetchAppointmentNotifyContext } from './appointmentNotifyContext.js';

const related = (ctx: AppointmentNotifyContext) => ({
  relatedEntityType: 'appointment' as const,
  relatedEntityId: ctx.appointmentId,
});

/** Клиент отправил заявку на запись (pending). */
export async function notifyClientBookingCreated(ctx: AppointmentNotifyContext): Promise<void> {
  const payload = clientBookingRequestCreated(ctx);
  await notifyUser({
    userId: ctx.clientId,
    ...payload,
    ...related(ctx),
    telegramReplyMarkup: clientBookingTelegramKeyboard() as unknown as Record<string, unknown>,
  });
}

/** Мастер подтвердил запись. */
export async function notifyClientBookingConfirmed(ctx: AppointmentNotifyContext): Promise<void> {
  const payload = clientBookingConfirmed(ctx);
  await notifyUser({
    userId: ctx.clientId,
    ...payload,
    ...related(ctx),
  });
}

/** Мастер отменил запись. */
export async function notifyClientBookingCancelledByMaster(ctx: AppointmentNotifyContext): Promise<void> {
  const payload = clientBookingCancelledByMaster(ctx);
  await notifyUser({
    userId: ctx.clientId,
    ...payload,
    ...related(ctx),
  });
}

/** Визит завершён — предложение оставить отзыв. */
export async function notifyClientBookingCompleted(ctx: AppointmentNotifyContext): Promise<void> {
  const payload = clientBookingCompleted(ctx);
  await notifyUser({
    userId: ctx.clientId,
    ...payload,
    ...related(ctx),
  });
}

/** Клиент сам отменил запись. */
export async function notifyClientBookingCancelledBySelf(ctx: AppointmentNotifyContext): Promise<void> {
  const payload = clientBookingCancelledBySelf(ctx);
  await notifyUser({
    userId: ctx.clientId,
    ...payload,
    ...related(ctx),
  });
}

export async function notifyClientByAppointmentId(
  appointmentId: string,
  kind: 'confirmed' | 'cancelled_by_master' | 'completed' | 'cancelled_by_self',
): Promise<void> {
  const ctx = await fetchAppointmentNotifyContext(appointmentId);
  if (!ctx) return;

  switch (kind) {
    case 'confirmed':
      await notifyClientBookingConfirmed(ctx);
      break;
    case 'cancelled_by_master':
      await notifyClientBookingCancelledByMaster(ctx);
      break;
    case 'completed':
      await notifyClientBookingCompleted(ctx);
      break;
    case 'cancelled_by_self':
      await notifyClientBookingCancelledBySelf(ctx);
      break;
    default:
      break;
  }
}
