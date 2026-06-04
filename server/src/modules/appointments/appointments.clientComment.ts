import { ApiError } from '../../utils/ApiError.js';
import { normalizeDbStatus } from '../../lib/appointmentStatus.js';
import { insertBookingEvent } from './bookingEvents.service.js';
import { requireAppointmentForClient } from './appointments.access.js';
import { notifyMasterByAppointmentId } from './appointments.masterNotifications.js';

export async function addClientBookingComment(
  clientId: string,
  appointmentId: string,
  message: string,
): Promise<void> {
  const text = message.trim();
  if (!text) {
    throw ApiError.badRequest('Введите комментарий', 'COMMENT_REQUIRED');
  }
  if (text.length > 2000) {
    throw ApiError.badRequest('Комментарий слишком длинный', 'COMMENT_TOO_LONG');
  }

  const access = await requireAppointmentForClient(clientId, appointmentId);
  const s = normalizeDbStatus(access.status);
  if (s === 'cancelled_by_client' || s === 'cancelled_by_master' || s === 'cancelled_by_admin' || s === 'expired') {
    throw ApiError.conflict('Нельзя комментировать отменённую запись', 'BAD_STATUS');
  }
  if (s === 'completed' || s === 'no_show') {
    throw ApiError.conflict('Запись уже завершена', 'BAD_STATUS');
  }

  await insertBookingEvent({
    appointmentId,
    eventType: 'booking.client_comment',
    oldStatus: s,
    newStatus: s,
    actorUserId: clientId,
    actorRole: 'client',
    comment: text,
  });

  void notifyMasterByAppointmentId(appointmentId, 'client_comment', { comment: text });
}
