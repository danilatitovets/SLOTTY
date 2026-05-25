import { useAuth } from '../AuthProvider';
import type { AccountAccessState } from '../lib/accountAccess';

type Props = {
  access: AccountAccessState;
};

export function AccountBlockedScreen({ access }: Props) {
  const { logout } = useAuth();
  const isDeleted = access.showDeletedScreen;

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center px-6 py-16 text-center">
      <div className="w-full max-w-md rounded-2xl border border-rose-100 bg-rose-50/90 px-6 py-8 shadow-[0_8px_32px_rgba(17,17,17,0.06)]">
        <h1 className="text-[22px] font-bold tracking-tight text-rose-950">
          {isDeleted ? 'Аккаунт недоступен' : 'Аккаунт заблокирован'}
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-rose-900/85">
          {isDeleted
            ? 'Этот аккаунт удалён. Войти в кабинет или пользоваться платформой нельзя.'
            : 'Вы не можете пользоваться платформой.'}
        </p>
        {!isDeleted && access.blockedReason ? (
          <p className="mt-3 text-[14px] font-medium text-rose-950">
            Причина: {access.blockedReason}
          </p>
        ) : null}
        <button
          type="button"
          onClick={() => logout()}
          className="mt-8 inline-flex min-h-11 items-center justify-center rounded-full bg-[#111827] px-6 text-[15px] font-semibold text-white transition hover:opacity-90 active:scale-[0.98]"
        >
          Выйти
        </button>
      </div>
    </div>
  );
}
