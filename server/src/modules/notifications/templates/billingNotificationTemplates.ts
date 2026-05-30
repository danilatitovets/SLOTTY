import { escapeTelegramHtml } from '../../telegram/telegram.service.js';
import { formatAppointmentDateTime } from '../../telegram/formatAppointmentDateTime.js';
import type { NotificationType } from '../notificationsInsert.js';

export type BillingNotificationPayload = {
  type: NotificationType;
  title: string;
  body: string;
  telegramHtml?: string;
};

export function proPaymentSubmittedForMaster(): BillingNotificationPayload {
  return {
    type: 'billing',
    title: 'Заявка на Pro',
    body: 'Заявка на Pro отправлена на проверку. Мы активируем тариф после подтверждения оплаты.',
    telegramHtml:
      `<b>Заявка на Pro</b>\n` +
      'Заявка отправлена на проверку. Мы активируем тариф после подтверждения оплаты.',
  };
}

export function proPaymentSubmittedForAdmin(masterName: string): BillingNotificationPayload {
  const name = escapeTelegramHtml(masterName.trim() || 'мастер');
  return {
    type: 'billing',
    title: 'Новая заявка на Pro',
    body: `Новая заявка на Pro от мастера ${masterName.trim() || 'мастер'}. Проверьте оплату в админке.`,
    telegramHtml:
      `<b>Новая заявка на Pro</b>\n` + `Мастер: ${name}\n` + 'Проверьте оплату в разделе биллинга админки.',
  };
}

export function proPaymentApprovedForMaster(proExpiresAt: Date | string): BillingNotificationPayload {
  const { date } = formatAppointmentDateTime(proExpiresAt);
  return {
    type: 'billing',
    title: 'Pro активирован',
    body: `Pro активирован до ${date}. Теперь доступны расширенные возможности тарифа.`,
    telegramHtml:
      `<b>Pro активирован</b>\n` +
      `Тариф действует до ${escapeTelegramHtml(date)}.\n` +
      'Расширенные возможности уже доступны в кабинете.',
  };
}

export function proPaymentRejectedForMaster(reason: string): BillingNotificationPayload {
  const r = reason.trim();
  return {
    type: 'billing',
    title: 'Заявка на Pro отклонена',
    body: `Заявка на Pro отклонена. Причина: ${r}`,
    telegramHtml:
      `<b>Заявка на Pro отклонена</b>\n` + `Причина: ${escapeTelegramHtml(r)}`,
  };
}
