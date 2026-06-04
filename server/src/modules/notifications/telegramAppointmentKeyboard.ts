import type { AppointmentNotifyContext } from '../appointments/appointmentNotifyContext.js';
import {
  clientAppointmentsUrl,
  clientBookingDeepLink,
  masterBookingDeepLink,
  masterPendingAppointmentsUrl,
  masterScheduleUrl,
} from './appointmentNotifyLinks.js';

export type TelegramReplyMarkup = {
  inline_keyboard: Array<Array<{ text: string; web_app?: { url: string }; url?: string }>>;
};

function bookingCode(ctx: AppointmentNotifyContext): string | null {
  const code = ctx.voucherNumber?.trim();
  return code && /^SL-[A-Z0-9]{12}$/i.test(code) ? code.toUpperCase() : null;
}

function openBookingRow(
  label: string,
  role: 'client' | 'master',
  ctx: AppointmentNotifyContext,
): Array<{ text: string; web_app: { url: string } }> | null {
  const code = bookingCode(ctx);
  if (!code) return null;
  const url = role === 'client' ? clientBookingDeepLink(code) : masterBookingDeepLink(code);
  return [{ text: label, web_app: { url } }];
}

/** Клиент: deep link на конкретную запись. */
export function clientBookingTelegramKeyboard(
  ctx: AppointmentNotifyContext,
  opts?: { allowCancel?: boolean; mapsUrl?: string | null },
): TelegramReplyMarkup {
  const rows: TelegramReplyMarkup['inline_keyboard'] = [];
  const open = openBookingRow('Открыть запись', 'client', ctx);
  const code = bookingCode(ctx);
  if (open) {
    rows.push(open);
    if (opts?.allowCancel && code) {
      rows.push([{ text: 'Отменить запись', web_app: { url: clientBookingDeepLink(code) } }]);
    }
    if (opts?.mapsUrl) {
      rows.push([{ text: 'Открыть адрес', url: opts.mapsUrl }]);
    }
  } else {
    rows.push([{ text: 'Мои записи', web_app: { url: clientAppointmentsUrl() } }]);
  }
  return { inline_keyboard: rows };
}

/** Мастер: запись, расписание, звонок клиенту. */
export function masterBookingTelegramKeyboard(ctx: AppointmentNotifyContext): TelegramReplyMarkup {
  const rows: TelegramReplyMarkup['inline_keyboard'] = [];
  const open = openBookingRow('Открыть запись', 'master', ctx);
  if (open) rows.push(open);
  else rows.push([{ text: 'Открыть заявки', web_app: { url: masterPendingAppointmentsUrl() } }]);
  rows.push([{ text: 'Расписание', web_app: { url: masterScheduleUrl() } }]);
  const phone = ctx.clientPhone?.trim();
  if (phone) {
    rows.push([{ text: 'Связаться с клиентом', url: `tel:${phone.replace(/\s/g, '')}` }]);
  }
  return { inline_keyboard: rows };
}

/** @deprecated Используйте masterBookingTelegramKeyboard(ctx) */
export function masterNewBookingTelegramKeyboard(ctx?: AppointmentNotifyContext): TelegramReplyMarkup {
  if (ctx) return masterBookingTelegramKeyboard(ctx);
  return {
    inline_keyboard: [[{ text: 'Открыть заявки в кабинете', web_app: { url: masterPendingAppointmentsUrl() } }]],
  };
}
