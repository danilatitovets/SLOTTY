import { env } from '../../config/env.js';
import { resolvePublicApiBaseUrl } from '../telegram/telegram.webhookConfig.js';

export function isBePaidEnabled(): boolean {
  return env.BEPAID_ENABLED === true;
}

export function assertBePaidConfigured(): void {
  if (!isBePaidEnabled()) {
    throw new Error('BEPAID_DISABLED');
  }
  if (!env.BEPAID_SECRET_KEY?.trim()) {
    throw new Error('BEPAID_SECRET_MISSING');
  }
  if (!env.BEPAID_SHOP_ID?.trim()) {
    throw new Error('BEPAID_SHOP_ID_MISSING');
  }
}

export function getBePaidCheckoutApiUrl(): string {
  const base = env.BEPAID_CHECKOUT_API_URL?.trim() || 'https://checkout.bepaid.by/ctp/api/checkouts';
  return base;
}

export function getBePaidNotificationUrl(): string | undefined {
  const explicit = env.BEPAID_NOTIFICATION_URL?.trim();
  if (explicit) return explicit;
  const publicApi = resolvePublicApiBaseUrl();
  if (publicApi) {
    return `${publicApi}/api/payments/bepaid/webhook`;
  }
  return undefined;
}

const DEFAULT_SUCCESS = 'https://slotty.of.by/payment/success';
const DEFAULT_FAIL = 'https://slotty.of.by/payment/fail';

export function getBePaidSuccessUrl(returnUrl?: string): string {
  if (returnUrl?.trim()) return returnUrl.trim();
  return env.BEPAID_SUCCESS_URL ?? DEFAULT_SUCCESS;
}

export function getBePaidFailUrl(): string {
  return env.BEPAID_FAIL_URL ?? DEFAULT_FAIL;
}

export function isBePaidTestMode(): boolean {
  return env.BEPAID_ENV !== 'production';
}
