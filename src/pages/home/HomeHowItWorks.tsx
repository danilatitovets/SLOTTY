import type { FC } from 'react';
import { homeSection, homeSectionSubtitle, homeSectionTitle } from './homeTheme';

const STEPS = [
  {
    n: '1',
    title: 'Выберите услугу',
    text: 'Откройте нужную категорию и найдите подходящего мастера.',
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <path d="M4 6h16M4 12h10M4 18h7" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    n: '2',
    title: 'Выберите время',
    text: 'Смотрите свободные окна и записывайтесь без звонков.',
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    n: '3',
    title: 'Получите напоминание',
    text: 'Подтверждение и напоминание придут прямо в Telegram.',
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <path d="M18 8.5a6 6 0 0 0-12 0c0 7-3 7-3 7h18s-3 0-3-7Z" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M10.3 19a2 2 0 0 0 3.4 0" strokeLinecap="round" />
      </svg>
    ),
  },
] as const;

export const HomeHowItWorks: FC = () => {
  return (
    <section className={homeSection} aria-labelledby="home-how-heading">
      <div className="mb-5 px-0.5">
        <h2 id="home-how-heading" className={homeSectionTitle}>
          Как работает запись
        </h2>
        <p className={homeSectionSubtitle}>Три шага — и вы у мастера без переписок.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {STEPS.map((step) => (
          <article
            key={step.n}
            className="flex min-h-[10.5rem] flex-col rounded-[24px] bg-white p-5 ring-1 ring-[#F3F4F6] shadow-[0_10px_32px_rgba(17,24,39,0.06)]"
          >
            <div className="flex items-start justify-between gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#FFF1F4] text-[#F47C8C]">
                {step.icon}
              </span>
              <span className="text-[13px] font-bold tabular-nums text-[#F47C8C]/80">{step.n}</span>
            </div>
            <h3 className="mt-4 text-[16px] font-semibold tracking-tight text-[#111827]">{step.title}</h3>
            <p className="mt-1.5 flex-1 text-[13px] leading-relaxed text-[#6B7280]">{step.text}</p>
          </article>
        ))}
      </div>
    </section>
  );
};
