/** Подсказка в шторке «Способы входа». */
export function LoginMethodsHint() {
  return (
    <div className="rounded-[18px] bg-[#FFF1F4] px-4 py-3.5 ring-1 ring-[#FDE8ED]">
      <p className="text-[13px] font-semibold leading-snug text-[#111827]">Один кабинет на все способы входа</p>
      <p className="mt-1.5 text-[12px] leading-relaxed text-[#6B7280]">
        Уже заходили через Telegram? Откройте SLOTTY в Telegram и подключите здесь Google или email — услуги и записи
        останутся в том же профиле мастера.
      </p>
    </div>
  );
}
