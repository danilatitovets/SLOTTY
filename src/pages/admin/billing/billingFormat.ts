export function formatBillingDate(iso: string | null | undefined): string | null {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return null;
  }
}

export function formatBillingDateShort(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '—';
  }
}

export function formatBillingMoney(amount: number, currency = 'BYN'): string {
  return `${amount.toLocaleString('ru-RU', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ${currency}`;
}

export function formatMaskedCard(brand: string | null, last4: string | null): string | null {
  if (!last4) return null;
  const b = brand?.trim() || 'Карта';
  return `${b} •••• ${last4}`;
}

export function billingPaymentStatusLabel(status: string): string {
  switch (status) {
    case 'paid':
      return 'Оплачен';
    case 'failed':
      return 'Ошибка';
    case 'refunded':
      return 'Возврат';
    case 'canceled':
      return 'Отменено';
    case 'pending':
    default:
      return 'Ожидает';
  }
}

export function billingPaymentKindLabel(kind: string): string {
  if (kind === 'renewal') return 'Продление Pro';
  if (kind === 'initial') return 'Подключение Pro';
  return 'Master Pro';
}

export function resolveRenewalDateIso(billing: {
  nextChargeAt: string | null;
  nextPaymentHint: string | null;
  currentPeriodEnd: string;
}): string | null {
  return billing.nextChargeAt ?? billing.nextPaymentHint ?? billing.currentPeriodEnd ?? null;
}

export function formatRenewalSchedule(
  billing: {
    nextChargeAt: string | null;
    nextPaymentHint: string | null;
    currentPeriodEnd: string;
    cancelAtPeriodEnd: boolean;
  },
  uiState: string,
): string | null {
  if (uiState === 'pro_canceled_at_period_end') {
    const end = formatBillingDate(billing.currentPeriodEnd);
    return end ? `Доступ сохранится до ${end}` : null;
  }
  if (uiState !== 'pro_active' || billing.cancelAtPeriodEnd) return null;

  const date = formatBillingDate(resolveRenewalDateIso(billing));
  if (!date) return null;

  const explicit = Boolean(billing.nextChargeAt ?? billing.nextPaymentHint);
  return explicit
    ? `Следующее списание ${date}`
    : `Продление подписки ${date}`;
}
