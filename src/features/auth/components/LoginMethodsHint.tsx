/** Подсказка на странице «Способы входа» для мастеров с Telegram-аккаунтом. */
export function LoginMethodsHint() {
  return (
    <p className="rounded-[18px] border border-[#FDE68A] bg-[#FFFBEB] px-4 py-3 text-[13px] leading-relaxed text-[#92400E]">
      Если вы уже создавали аккаунт через Telegram, сначала войдите через Telegram и подключите Google здесь.
      Так вы сохраните тот же кабинет мастера.
    </p>
  );
}
