import { notifyUser } from '../notifications/notifyUser.js';
import { masterClientCancelledBooking } from '../notifications/templates/appointmentNotificationTemplates.js';
import { notifyClientBookingCreated } from './appointments.clientNotifications.js';
import { notifyMasterBookingCreated } from './appointments.masterNotifications.js';
import { sendAppointmentCreatedEmails } from './appointmentNotifyEmail.js';
import { fetchAppointmentNotifyContext } from './appointmentNotifyContext.js';
import type { AppointmentNotifyContext } from './appointmentNotifyContext.js';

export type AppointmentCreatedPayload = {
  appointmentId: string;
  clientId: string;
  masterId: string;
  serviceTitle: string;
  startsAt: string;
  voucherNumber: string;
  clientDisplayName: string;
  clientPhone?: string | null;
  masterDisplayName: string;
};

function logNotifyError(context: string, err: unknown): void {
  console.warn(`[notify] ${context}:`, err instanceof Error ? err.message : err);
}

function toContext(payload: AppointmentCreatedPayload): AppointmentNotifyContext {
  return {
    appointmentId: payload.appointmentId,
    clientId: payload.clientId,
    masterId: payload.masterId,
    serviceTitle: payload.serviceTitle,
    startsAt: payload.startsAt,
    voucherNumber: payload.voucherNumber,
    clientName: payload.clientDisplayName,
    clientPhone: payload.clientPhone?.trim() || null,
    masterName: payload.masterDisplayName,
  };
}

/** После новой записи: клиенту и мастеру (in-app + Telegram). */
export async function notifyAppointmentCreated(payload: AppointmentCreatedPayload): Promise<void> {
  try {
    const ctx = toContext(payload);
    await Promise.all([
      notifyClientBookingCreated(ctx),
      notifyMasterBookingCreated(ctx),
      sendAppointmentCreatedEmails(ctx),
    ]);
  } catch (e) {
    logNotifyError('notifyAppointmentCreated', e);
  }
}

/** Мастеру: клиент отменил запись (in-app + Telegram). */
export async function notifyMasterClientCancelledBooking(
  masterId: string,
  appointmentId: string,
): Promise<void> {
  try {
    const ctx = await fetchAppointmentNotifyContext(appointmentId);
    if (!ctx) return;

    const payload = masterClientCancelledBooking(ctx);
    await notifyUser({
      userId: masterId,
      ...payload,
      relatedEntityType: 'appointment',
      relatedEntityId: appointmentId,
    });
  } catch (e) {
    logNotifyError('notifyMasterClientCancelledBooking', e);
  }
}
