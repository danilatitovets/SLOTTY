import { insertBookingEvent } from './bookingEvents.service.js';

export async function logBookingNotificationEvent(
  appointmentId: string,
  kind: 'sent' | 'failed' | 'reminder',
  meta?: { channel?: string; jobType?: string; error?: string; providerMessageId?: string | null },
): Promise<void> {
  const eventType =
    kind === 'reminder'
      ? 'booking.reminder_sent'
      : kind === 'failed'
        ? 'booking.notification_failed'
        : 'booking.notification_sent';

  await insertBookingEvent({
    appointmentId,
    eventType,
    actorRole: 'system',
    comment: meta?.error?.slice(0, 500) ?? null,
    metadata: meta ? { ...meta } : null,
  });
}
