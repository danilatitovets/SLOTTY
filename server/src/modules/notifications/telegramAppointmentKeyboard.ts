import { clientAppointmentsUrl, masterPendingAppointmentsUrl } from './appointmentNotifyLinks.js';

export type TelegramReplyMarkup = {
  inline_keyboard: Array<Array<{ text: string; web_app?: { url: string }; url?: string }>>;
};

export function masterNewBookingTelegramKeyboard(): TelegramReplyMarkup {
  const url = masterPendingAppointmentsUrl();
  return {
    inline_keyboard: [[{ text: 'Открыть заявки в кабинете', web_app: { url } }]],
  };
}

export function clientBookingTelegramKeyboard(): TelegramReplyMarkup {
  const url = clientAppointmentsUrl();
  return {
    inline_keyboard: [[{ text: 'Мои записи', web_app: { url } }]],
  };
}
