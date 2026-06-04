import { env } from '../../config/env.js';
import { query } from '../../config/db.js';
import { logNotification } from '../notifications/notificationLog.js';
import { fetchAppointmentNotifyContext } from './appointmentNotifyContext.js';

/** Уведомление админу в Telegram (если настроен TELEGRAM_ADMIN_CHAT_ID). */
export async function notifyAdminBookingDispute(
  appointmentId: string,
  disputeId: string,
  side: 'client' | 'master',
): Promise<void> {
  const chatId = env.TELEGRAM_ADMIN_CHAT_ID;
  const ctx = await fetchAppointmentNotifyContext(appointmentId);
  logNotification('booking.dispute.admin', {
    bookingId: appointmentId,
    bookingCode: ctx?.voucherNumber,
    disputeId,
    side,
    telegramAdminConfigured: Boolean(chatId),
  });
  if (!chatId || !ctx) return;
  try {
    const { sendTelegramMessage } = await import('../telegram/telegram.service.js');
    await sendTelegramMessage({
      telegramUserId: chatId,
      text: `<b>⚠️ Спор по записи</b>\n№ ${ctx.voucherNumber ?? appointmentId}\nСторона: ${side === 'client' ? 'клиент' : 'мастер'}\nУслуга: ${ctx.serviceTitle}`,
    });
  } catch (e) {
    logNotification('booking.dispute.admin_failed', {
      error: e instanceof Error ? e.message : String(e),
    });
  }

  const admins = await query<{ id: string }>(
    `select id from public.profiles where role = 'platform_admin'::public.user_role limit 20`,
  );
  for (const admin of admins.rows) {
    try {
      const { notifyUser } = await import('../notifications/notifyUser.js');
      await notifyUser({
        userId: admin.id,
        type: 'system',
        title: 'Спор по записи',
        body: `Новое обращение (${side}) по записи ${ctx.voucherNumber ?? ''}.`,
        relatedEntityType: 'appointment',
        relatedEntityId: appointmentId,
      });
    } catch {
      /* ignore per admin */
    }
  }
}
