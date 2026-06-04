import { notifyUser } from '../notifications/notifyUser.js';
import {
  masterBookingClientConfirmed,
  masterBookingClientComment,
  masterBookingClientSignal,
  masterBookingCompleted,
  masterBookingDisputedByClient,
  masterBookingRequestCreated,
} from '../notifications/templates/appointmentNotificationTemplates.js';
import { masterBookingTelegramKeyboard } from '../notifications/telegramAppointmentKeyboard.js';
import { masterBookingCreatedEmail } from './appointmentNotifyEmail.js';
import type { AppointmentNotifyContext } from './appointmentNotifyContext.js';
import { fetchAppointmentNotifyContext } from './appointmentNotifyContext.js';

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
    telegramReplyMarkup: masterBookingTelegramKeyboard(ctx) as unknown as Record<string, unknown>,
    bookingCode: ctx.voucherNumber,
    email: masterBookingCreatedEmail(ctx),
  });
}

export type MasterNotifyExtras = {
  lateMinutes?: number | null;
  comment?: string | null;
};

export async function notifyMasterByAppointmentId(
  appointmentId: string,
  kind:
    | 'completed'
    | 'client_confirmed_completed'
    | 'client_on_the_way'
    | 'client_running_late'
    | 'client_reported_arrived'
    | 'disputed_by_client'
    | 'client_comment',
  extras?: MasterNotifyExtras,
): Promise<void> {
  const ctx = await fetchAppointmentNotifyContext(appointmentId);
  if (!ctx) return;

  const related = {
    relatedEntityType: 'appointment' as const,
    relatedEntityId: ctx.appointmentId,
  };
  const markup = masterBookingTelegramKeyboard(ctx) as unknown as Record<string, unknown>;

  switch (kind) {
    case 'completed': {
      const payload = masterBookingCompleted(ctx);
      await notifyUser({
        userId: ctx.masterId,
        ...payload,
        ...related,
        bookingCode: ctx.voucherNumber,
        telegramReplyMarkup: markup,
      });
      break;
    }
    case 'client_confirmed_completed': {
      const payload = masterBookingClientConfirmed(ctx);
      await notifyUser({
        userId: ctx.masterId,
        ...payload,
        ...related,
        bookingCode: ctx.voucherNumber,
        telegramReplyMarkup: markup,
      });
      break;
    }
    case 'client_on_the_way':
    case 'client_running_late':
    case 'client_reported_arrived': {
      const payload = masterBookingClientSignal(ctx, kind, extras);
      await notifyUser({
        userId: ctx.masterId,
        ...payload,
        ...related,
        bookingCode: ctx.voucherNumber,
        telegramReplyMarkup: markup,
      });
      break;
    }
    case 'client_comment': {
      const payload = masterBookingClientComment(ctx, extras?.comment);
      await notifyUser({
        userId: ctx.masterId,
        ...payload,
        ...related,
        bookingCode: ctx.voucherNumber,
        telegramReplyMarkup: markup,
      });
      break;
    }
    case 'disputed_by_client': {
      const payload = masterBookingDisputedByClient(ctx);
      await notifyUser({
        userId: ctx.masterId,
        ...payload,
        ...related,
        bookingCode: ctx.voucherNumber,
        telegramReplyMarkup: markup,
      });
      break;
    }
    default:
      break;
  }
}
