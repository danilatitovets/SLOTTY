import { env } from '../../config/env.js';
import { ApiError } from '../../utils/ApiError.js';

export function isResendConfigured(): boolean {
  return Boolean(env.RESEND_API_KEY?.trim());
}

/** Throws when bulk / campaign email cannot be sent (production requires Resend). */
export function assertResendConfiguredForCampaign(): void {
  if (isResendConfigured()) return;
  if (env.NODE_ENV === 'production') {
    throw ApiError.serviceUnavailable(
      'Отправка писем недоступна: настройте RESEND_API_KEY и RESEND_FROM',
      'EMAIL_NOT_CONFIGURED',
    );
  }
}

export function resolveResendFrom(): string {
  return env.RESEND_FROM?.trim() || 'SLOTTY <onboarding@resend.dev>';
}

/** Предупреждение при старте API в production без Resend. */
export function logResendConfigStatus(): void {
  if (isResendConfigured()) {
    console.info('[SLOTTY] Resend: включён, from=', resolveResendFrom());
    return;
  }
  if (env.NODE_ENV === 'production') {
    console.warn(
      '[SLOTTY] Resend: RESEND_API_KEY не задан — письма о записях не уйдут на email (только in-app / Telegram)',
    );
  }
}
