type Props = {
  className?: string;
};

const baseClass =
  'rounded-2xl bg-[#F3F4F6] px-4 py-3 text-[13px] leading-relaxed text-[#6B7280]';

/** Подсказка: не создавать второй аккаунт через Google после Telegram. */
export function LoginAccountHint({ className }: Props) {
  return (
    <p className={className ? `${baseClass} ${className}` : baseClass}>
      Уже создавали аккаунт через Telegram? Войдите через Telegram и подключите Google в настройках, чтобы
      сохранить тот же кабинет.
    </p>
  );
}
