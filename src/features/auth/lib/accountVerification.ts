import type { AuthIdentityDto, AuthProvider } from '../types';

/** Способы входа в настройках профиля (LoginMethodsPanel). */
export const ACCOUNT_VERIFICATION_METHOD_COUNT = 3;

function hasProvider(identities: AuthIdentityDto[], provider: AuthProvider): boolean {
  return identities.some((i) => i.provider === provider);
}

export function countAccountVerifications(identities: AuthIdentityDto[]): number {
  const emailIdentity = identities.find((i) => i.provider === 'email');
  let n = 0;
  if (hasProvider(identities, 'telegram')) n += 1;
  if (hasProvider(identities, 'google')) n += 1;
  if (emailIdentity?.emailVerified) n += 1;
  return n;
}

/** Все три способа входа подключены — показываем галочку «проверенный мастер». */
export function isAccountFullyVerified(identities: AuthIdentityDto[]): boolean {
  return countAccountVerifications(identities) >= ACCOUNT_VERIFICATION_METHOD_COUNT;
}

export type AccountVerificationPendingStep = {
  label: string;
  hint: string;
};

export const DEFAULT_ACCOUNT_VERIFICATION_STEPS: AccountVerificationPendingStep[] = [
  { label: 'Подключить Telegram', hint: 'Вход через Mini App и уведомления' },
  { label: 'Подключить Google', hint: 'Вход с телефона и компьютера' },
  { label: 'Подтвердить email', hint: 'Резервный вход — ссылка из письма' },
];

/** Что осталось для статуса «проверенный мастер». */
export function listAccountVerificationPendingSteps(
  identities: AuthIdentityDto[],
): AccountVerificationPendingStep[] {
  const steps: AccountVerificationPendingStep[] = [];
  if (!hasProvider(identities, 'telegram')) {
    steps.push(DEFAULT_ACCOUNT_VERIFICATION_STEPS[0]);
  }
  if (!hasProvider(identities, 'google')) {
    steps.push(DEFAULT_ACCOUNT_VERIFICATION_STEPS[1]);
  }
  const emailIdentity = identities.find((i) => i.provider === 'email');
  if (!emailIdentity) {
    steps.push({ label: 'Привязать email', hint: 'Резервный вход, если нет Telegram' });
  } else if (!emailIdentity.emailVerified) {
    steps.push(DEFAULT_ACCOUNT_VERIFICATION_STEPS[2]);
  }
  return steps;
}
