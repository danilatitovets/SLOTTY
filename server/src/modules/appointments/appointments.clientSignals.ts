import { ApiError } from '../../utils/ApiError.js';
import { normalizeDbStatus } from '../../lib/appointmentStatus.js';
import { insertBookingEvent } from './bookingEvents.service.js';
import { requireAppointmentForClient } from './appointments.access.js';
import { notifyMasterByAppointmentId } from './appointments.masterNotifications.js';

export type ClientSignalKind = 'on_the_way' | 'running_late' | 'reported_arrived';

const EVENT_MAP: Record<ClientSignalKind, string> = {
  on_the_way: 'booking.client_on_the_way',
  running_late: 'booking.client_running_late',
  reported_arrived: 'booking.client_reported_arrived',
};

const NOTIFY_MAP: Record<ClientSignalKind, 'client_on_the_way' | 'client_running_late' | 'client_reported_arrived'> = {
  on_the_way: 'client_on_the_way',
  running_late: 'client_running_late',
  reported_arrived: 'client_reported_arrived',
};

export async function clientBookingSignal(
  clientId: string,
  appointmentId: string,
  kind: ClientSignalKind,
  options?: { comment?: string | null; lateMinutes?: number | null },
): Promise<void> {
  const access = await requireAppointmentForClient(clientId, appointmentId);
  const s = normalizeDbStatus(access.status);
  if (s !== 'confirmed') {
    throw ApiError.conflict('Сообщение доступно только для подтверждённой записи', 'BAD_STATUS');
  }

  let lateMinutes: number | undefined;
  if (kind === 'running_late') {
    const n = options?.lateMinutes;
    if (n == null || !Number.isFinite(n) || n < 1 || n > 240) {
      throw ApiError.badRequest('Укажите, на сколько минут вы опаздываете', 'LATE_MINUTES_REQUIRED');
    }
    lateMinutes = Math.round(n);
  }

  await insertBookingEvent({
    appointmentId,
    eventType: EVENT_MAP[kind],
    oldStatus: s,
    newStatus: s,
    actorUserId: clientId,
    actorRole: 'client',
    comment: options?.comment?.trim() || null,
    metadata: lateMinutes != null ? { lateMinutes } : null,
  });

  void notifyMasterByAppointmentId(appointmentId, NOTIFY_MAP[kind], {
    lateMinutes: lateMinutes ?? null,
    comment: options?.comment?.trim() || null,
  });
}
