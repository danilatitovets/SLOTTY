import { formatRestrictionUntil } from '../lib/accountAccess';
import type { AccountAccessState } from '../lib/accountAccess';

type Props = {
  access: AccountAccessState;
  variant?: 'master' | 'client';
};

export function AccountAccessRestrictedBanner({ access, variant = 'client' }: Props) {
  if (!access.showRestrictedBanner) return null;

  const untilLabel = formatRestrictionUntil(access.accessRestrictedUntil);

  return (
    <div
      className="rounded-2xl border border-amber-200/80 bg-amber-50 px-4 py-4 shadow-[0_8px_24px_rgba(17,17,17,0.04)]"
      role="status"
    >
      <p className="text-[15px] font-bold text-amber-950">Доступ ограничен</p>
      <p className="mt-1.5 text-[14px] leading-relaxed text-amber-900/90">
        {variant === 'master'
          ? 'Вы можете просматривать кабинет, но временно не можете создавать услуги, окна, акции и публиковать профиль.'
          : 'Вы можете просматривать данные, но временно не можете выполнять действия на платформе.'}
      </p>
      {access.restrictionReason ? (
        <p className="mt-2 text-[14px] font-medium text-amber-950">
          Причина: {access.restrictionReason}
        </p>
      ) : null}
      {untilLabel ? (
        <p className="mt-1 text-[13px] text-amber-800/90">Ограничение действует до: {untilLabel}</p>
      ) : null}
    </div>
  );
}
