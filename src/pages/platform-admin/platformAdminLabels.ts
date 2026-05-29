import { EMPTY_FIELD } from '../../shared/lib/emptyDisplayText';

const ADMIN_AUDIT_ACTION_LABELS: Record<string, string> = {
  category_request_approved: 'Заявка на смену категории одобрена',
  category_request_rejected: 'Заявка на смену категории отклонена',
  user_blocked: 'Пользователь заблокирован',
  user_unblocked: 'Пользователь разблокирован',
  user_restricted: 'Доступ пользователя ограничен',
  user_unrestricted: 'Ограничение с пользователя снято',
  master_hidden: 'Профиль мастера скрыт из каталога',
  master_unhidden: 'Профиль мастера снова в каталоге',
  master_paused: 'Профиль мастера на паузе',
  master_unpaused: 'Пауза профиля снята',
  service_hidden: 'Услуга скрыта',
  service_unhidden: 'Услуга снова видима',
  master_pro_granted: 'Выдан бесплатный тариф Pro',
  promo_code_created: 'Создан промокод',
  promo_code_activated: 'Промокод включён',
  promo_code_deactivated: 'Промокод отключён',
  sponsor_request_pending: 'Заявка спонсорства: новая',
  sponsor_request_in_review: 'Заявка спонсорства: в работе',
  sponsor_request_closed: 'Заявка спонсорства: закрыта с ответом',
  sponsor_request_rejected: 'Заявка спонсорства: отклонена',
};

const ADMIN_AUDIT_ENTITY_LABELS: Record<string, string> = {
  profile: 'Пользователь',
  master_profile: 'Мастер',
  master_service: 'Услуга',
  category_change_request: 'Смена категории',
  sponsor_request: 'Спонсорство',
};

const SPONSOR_AUDIT_SUFFIX: Record<string, string> = {
  pending: 'новая заявка',
  in_review: 'взята в работу',
  closed: 'закрыта с ответом мастеру',
  rejected: 'отклонена',
};

export function labelAdminAuditAction(action: string): string {
  if (ADMIN_AUDIT_ACTION_LABELS[action]) return ADMIN_AUDIT_ACTION_LABELS[action];
  if (action.startsWith('sponsor_request_')) {
    const status = action.slice('sponsor_request_'.length);
    const tail = SPONSOR_AUDIT_SUFFIX[status];
    if (tail) return `Заявка «Спонсор SLOTTY»: ${tail}`;
  }
  return action.replaceAll('_', ' ');
}

export function labelAdminAuditEntity(entityType: string): string {
  return ADMIN_AUDIT_ENTITY_LABELS[entityType] ?? entityType;
}

export const BILLING_EVENT_LABELS: Record<string, string> = {
  checkout_started: 'Начал оформление Pro',
  checkout_cancelled: 'Отменил оформление',
  plan_changed: 'Смена тарифа',
  pro_interest: 'Интерес к Pro (онбординг)',
  payment_failed: 'Ошибка оплаты',
  complimentary_granted: 'Бесплатный Pro от администрации',
  subscription_purchased: 'Покупка подписки Pro',
};

export function labelBillingEventType(eventType: string): string {
  return BILLING_EVENT_LABELS[eventType] ?? eventType.replaceAll('_', ' ');
}

export function labelBillingSource(source: string): string {
  const map: Record<string, string> = {
    mock: 'тест',
    system: 'система',
    platform_admin: 'админка',
    payment: 'оплата',
  };
  return map[source] ?? source;
}

export function labelBillingPeriod(period: string | null | undefined): string {
  if (period === 'year') return 'год';
  if (period === 'month') return 'месяц';
  return period ?? '';
}

export function labelSubscriptionStatus(status: string): string {
  const map: Record<string, string> = {
    active: 'Активна',
    cancelled: 'Отменена',
    past_due: 'Просрочена',
    trialing: 'Пробный период',
  };
  return map[status] ?? status;
}

export function labelProStatus(status: string | null): string {
  if (!status) return EMPTY_FIELD;
  const map: Record<string, string> = {
    active: 'Активен',
    inactive: 'Неактивен',
    expired: 'Истёк',
    pending: 'Ожидание',
  };
  return map[status] ?? status;
}

export function labelMasterPlan(plan: string): string {
  if (plan === 'pro') return 'Pro';
  if (plan === 'basic' || plan === 'free') return 'Базовый (Free)';
  return plan;
}
