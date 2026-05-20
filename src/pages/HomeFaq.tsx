import type { FC } from 'react';

const FAQ_ITEMS = [
  {
    key: 'what',
    q: 'Что такое SLOTTY?',
    a: 'SLOTTY — это сервис записи к мастерам внутри Telegram. Клиент выбирает услугу, свободное время и записывается без долгих переписок.',
  },
  {
    key: 'app',
    q: 'Нужно ли скачивать приложение?',
    a: 'Нет. Всё работает прямо в Telegram Web App: достаточно открыть ссылку мастера или перейти в сервис через Telegram.',
  },
  {
    key: 'client-price',
    q: 'Для клиента это бесплатно?',
    a: 'Да. Клиент бесплатно ищет мастера и записывается на услугу. Оплачивается только сама услуга у специалиста.',
  },
  {
    key: 'booking',
    q: 'Как проходит запись?',
    a: 'Вы выбираете категорию, мастера, услугу и удобное время. После подтверждения запись появляется в системе, а клиент получает напоминание.',
  },
  {
    key: 'master-start',
    q: 'Как мастеру начать работать?',
    a: 'Мастер создает профиль, добавляет услуги, цены и график работы. После этого клиенты смогут видеть свободные слоты и записываться самостоятельно.',
  },
  {
    key: 'reminders',
    q: 'Будут ли напоминания о записи?',
    a: 'Да. SLOTTY помогает напоминать клиенту о визите, чтобы мастер меньше терял время из-за забытых записей.',
  },
] as const;

export const HomeFaq: FC = () => {
  return (
    <section id="faq" className="mt-14 scroll-mt-28 sm:mt-16" style={{ animationDelay: '100ms' }}>
      <div className="px-0.5 text-center sm:text-left">
        <h2 className="text-[clamp(1.35rem,4vw,1.75rem)] font-semibold tracking-tight text-[#111827]">
          Частые вопросы
        </h2>
        <p className="mt-1 text-[13px] leading-snug text-[#9CA3AF] sm:text-[14px]">
          Коротко о записи, Telegram и возможностях для мастеров.
        </p>
      </div>

      <div className="mt-6 space-y-2.5">
        {FAQ_ITEMS.map((item) => (
          <details
            key={item.key}
            className="group rounded-[20px] bg-white px-5 py-4 ring-1 ring-[#F3F4F6] shadow-[0_6px_24px_rgba(17,24,39,0.05)] sm:px-6"
          >
            <summary
              className="
                cursor-pointer
                list-none
                text-left
                text-[15px]
                font-semibold
                tracking-tight
                text-neutral-950
                [&::-webkit-details-marker]:hidden
              "
            >
              <span className="flex items-center justify-between gap-3">
                {item.q}

                <span
                  className="
                    flex
                    h-8
                    w-8
                    shrink-0
                    items-center
                    justify-center
                    rounded-full
                    bg-white
                    text-lg
                    font-light
                    leading-none
                    text-neutral-400
                    transition
                    group-open:rotate-45
                  "
                  aria-hidden
                >
                  +
                </span>
              </span>
            </summary>

            <p className="mt-3 pt-1 text-left text-[14px] leading-relaxed text-neutral-600 sm:text-[15px]">
              {item.a}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
};