import { env } from '../../config/env.js';

export type ManualPaymentConfigDto = {
  configured: boolean;
  recipientFullName: string;
  bankName: string;
  iban: string | null;
  bic: string;
  currency: string;
  proAmount: number;
  paymentPurposeTemplate: string;
  feeCoveredBy: 'slotty';
  configMessage: string | null;
};

const PAYMENT_PURPOSE_TEMPLATE = 'Оплата Pro SLOTTY, {masterName}, {masterPhone}';

function parseProAmount(): number {
  const raw = env.MANUAL_PAYMENT_PRO_AMOUNT?.trim();
  if (raw) {
    const n = Number(raw);
    if (Number.isFinite(n) && n > 0) return n;
  }
  return 30;
}

/** Маскирует IBAN для логов (первые 4 + последние 4). */
export function maskIban(iban: string | null | undefined): string {
  const v = iban?.replace(/\s+/g, '').trim();
  if (!v) return '(empty)';
  if (v.length <= 8) return '****';
  return `${v.slice(0, 4)}…${v.slice(-4)}`;
}

export function isManualPaymentConfigured(): boolean {
  const iban = env.MANUAL_PAYMENT_IBAN?.replace(/\s+/g, '').trim();
  if (env.NODE_ENV === 'production') {
    return Boolean(iban && iban.length >= 8);
  }
  return true;
}

export function getManualPaymentConfigBase(): ManualPaymentConfigDto {
  const ibanRaw = env.MANUAL_PAYMENT_IBAN?.replace(/\s+/g, ' ').trim() || null;
  const configured = isManualPaymentConfigured();
  const configMessage = configured
    ? null
    : env.NODE_ENV === 'production'
      ? 'Реквизиты временно недоступны. Обратитесь в поддержку SLOTTY.'
      : 'Для локальной разработки задайте MANUAL_PAYMENT_IBAN в env сервера.';

  return {
    configured,
    recipientFullName:
      env.MANUAL_PAYMENT_RECIPIENT_FULL_NAME?.trim() || 'Титовец Данила Игоревич',
    bankName: env.MANUAL_PAYMENT_BANK_NAME?.trim() || 'ОАО «АСБ Беларусбанк»',
    iban: configured ? ibanRaw : null,
    bic: env.MANUAL_PAYMENT_BIC?.trim() || 'AKBBBY2X',
    currency: env.MANUAL_PAYMENT_CURRENCY?.trim() || 'BYN',
    proAmount: parseProAmount(),
    paymentPurposeTemplate: PAYMENT_PURPOSE_TEMPLATE,
    feeCoveredBy: 'slotty',
    configMessage,
  };
}

export function buildPaymentPurpose(
  template: string,
  masterName: string,
  masterPhone: string | null,
): string {
  const name = masterName.trim() || 'мастер SLOTTY';
  const phone = masterPhone?.trim() || 'телефон не указан';
  return template.replace('{masterName}', name).replace('{masterPhone}', phone);
}

export function getManualProTariffAmount(_billingPeriod: 'month' | 'year' = 'month'): number {
  return parseProAmount();
}
