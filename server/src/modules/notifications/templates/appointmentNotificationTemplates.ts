import { escapeTelegramHtml } from '../../telegram/telegram.service.js';
import { formatAppointmentDateTime } from '../../telegram/formatAppointmentDateTime.js';
import type { AppointmentNotifyContext } from '../../appointments/appointmentNotifyContext.js';
import type { NotificationType } from '../notificationsInsert.js';

export type AppointmentNotificationPayload = {
  type: NotificationType;
  title: string;
  body: string;
  telegramHtml?: string;
};

function formatWhen(ctx: AppointmentNotifyContext): { date: string; time: string; plain: string } {
  const { date, time } = formatAppointmentDateTime(ctx.startsAt);
  return { date, time, plain: `${date}, ${time}` };
}

function voucherLine(ctx: AppointmentNotifyContext, html: boolean): string {
  if (!ctx.voucherNumber) return '';
  const v = html ? escapeTelegramHtml(ctx.voucherNumber) : ctx.voucherNumber;
  return html ? `\nНомер записи: <code>${v}</code>` : `\nНомер: ${v}`;
}

/** Клиент отправил заявку (pending). */
export function clientBookingRequestCreated(ctx: AppointmentNotifyContext): AppointmentNotificationPayload {
  const { date, time } = formatWhen(ctx);
  const svc = ctx.serviceTitle;
  const master = ctx.masterName;

  return {
    type: 'appointment_pending',
    title: 'Заявка отправлена',
    body: 'Заявка на запись отправлена мастеру. Мы сообщим, когда мастер подтвердит время.',
    telegramHtml:
      `<b>Заявка на запись отправлена</b>\n` +
      `Услуга: ${escapeTelegramHtml(svc)}\n` +
      `Дата: ${escapeTelegramHtml(date)}\n` +
      `Время: ${escapeTelegramHtml(time)}\n` +
      `Мастер: ${escapeTelegramHtml(master)}` +
      voucherLine(ctx, true),
  };
}

/** Мастеру: новая заявка. */
export function masterBookingRequestCreated(ctx: AppointmentNotifyContext): AppointmentNotificationPayload {
  const { date, time, plain } = formatWhen(ctx);

  return {
    type: 'appointment_new',
    title: 'Новая заявка на запись',
    body: `Новая заявка на запись: ${ctx.serviceTitle}, ${plain}. Проверьте заявку в кабинете.`,
    telegramHtml:
      `<b>Новая заявка на запись</b>\n` +
      `Клиент: ${escapeTelegramHtml(ctx.clientName)}\n` +
      `Услуга: ${escapeTelegramHtml(ctx.serviceTitle)}\n` +
      `Дата: ${escapeTelegramHtml(date)}\n` +
      `Время: ${escapeTelegramHtml(time)}` +
      voucherLine(ctx, true),
  };
}

export function clientBookingConfirmed(ctx: AppointmentNotifyContext): AppointmentNotificationPayload {
  const { date, time, plain } = formatWhen(ctx);

  return {
    type: 'appointment_confirmed',
    title: 'Запись подтверждена',
    body: `Запись подтверждена: ${plain}. Ждём вас!`,
    telegramHtml:
      `<b>Запись подтверждена</b>\n` +
      `Мастер ${escapeTelegramHtml(ctx.masterName)} подтвердил вашу запись.\n` +
      `Услуга: ${escapeTelegramHtml(ctx.serviceTitle)}\n` +
      `Дата: ${escapeTelegramHtml(date)}\n` +
      `Время: ${escapeTelegramHtml(time)}` +
      voucherLine(ctx, true),
  };
}

export function clientBookingCancelledByMaster(ctx: AppointmentNotifyContext): AppointmentNotificationPayload {
  const { plain } = formatWhen(ctx);

  return {
    type: 'appointment_cancelled',
    title: 'Запись отменена мастером',
    body: `Мастер ${ctx.masterName} отменил запись: ${ctx.serviceTitle} (${plain}). Выберите другое время или мастера.`,
    telegramHtml:
      `<b>Запись отменена</b>\n` +
      `Мастер ${escapeTelegramHtml(ctx.masterName)} отменил запись.\n` +
      `Услуга: ${escapeTelegramHtml(ctx.serviceTitle)}\n` +
      `Было: ${escapeTelegramHtml(plain)}`,
  };
}

export function clientBookingCompleted(ctx: AppointmentNotifyContext): AppointmentNotificationPayload {
  const { plain } = formatWhen(ctx);

  return {
    type: 'review_request',
    title: 'Визит завершён',
    body: `Спасибо за визит к ${ctx.masterName} (${ctx.serviceTitle}, ${plain}). Оставьте отзыв в профиле — это поможет другим клиентам.`,
    telegramHtml:
      `<b>Визит завершён</b>\n` +
      `Услуга: ${escapeTelegramHtml(ctx.serviceTitle)}\n` +
      `Мастер: ${escapeTelegramHtml(ctx.masterName)}\n` +
      `Когда: ${escapeTelegramHtml(plain)}\n\n` +
      `Оставьте отзыв в приложении SLOTTY — это займёт пару минут.`,
  };
}

export function clientBookingCancelledBySelf(ctx: AppointmentNotifyContext): AppointmentNotificationPayload {
  const { plain } = formatWhen(ctx);

  return {
    type: 'appointment_cancelled',
    title: 'Вы отменили запись',
    body: `Отменена запись: ${ctx.serviceTitle} — ${plain}, мастер ${ctx.masterName}.`,
    telegramHtml:
      `<b>Запись отменена</b>\n` +
      `Вы отменили запись.\n` +
      `Услуга: ${escapeTelegramHtml(ctx.serviceTitle)}\n` +
      `Мастер: ${escapeTelegramHtml(ctx.masterName)}\n` +
      `Было: ${escapeTelegramHtml(plain)}`,
  };
}

export function masterClientCancelledBooking(
  ctx: AppointmentNotifyContext,
): AppointmentNotificationPayload {
  const { plain } = formatWhen(ctx);

  return {
    type: 'appointment_cancelled',
    title: 'Клиент отменил запись',
    body: `${ctx.clientName} отменил запись: ${ctx.serviceTitle} (${plain}).`,
    telegramHtml:
      `<b>Клиент отменил запись</b>\n` +
      `Клиент: ${escapeTelegramHtml(ctx.clientName)}\n` +
      `Услуга: ${escapeTelegramHtml(ctx.serviceTitle)}\n` +
      `Было: ${escapeTelegramHtml(plain)}`,
  };
}
