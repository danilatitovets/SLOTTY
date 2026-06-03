import { notifyUser } from '../notifications/notifyUser.js';
import { masterBookingRequestCreated } from '../notifications/templates/appointmentNotificationTemplates.js';
import { masterNewBookingTelegramKeyboard } from '../notifications/telegramAppointmentKeyboard.js';
import type { AppointmentNotifyContext } from './appointmentNotifyContext.js';

const related = (ctx: AppointmentNotifyContext) => ({
  relatedEntityType: 'appointment' as const,
  relatedEntityId: ctx.appointmentId,
});

/** Мастеру: новая заявка от клиента. */
export async function notifyMasterBookingCreated(ctx: AppointmentNotifyContext): Promise<void> {
  const payload = masterBookingRequestCreated(ctx);
  await notifyUser({
    userId: ctx.masterId,
    ...payload,
    ...related(ctx),
    telegramReplyMarkup: masterNewBookingTelegramKeyboard() as unknown as Record<string, unknown>,
  });
}
