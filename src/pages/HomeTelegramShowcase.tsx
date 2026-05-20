import type { FC } from 'react';
import { homeOutlineBtn, homeSection, homeSectionSubtitle, homeSectionTitle } from './home/homeTheme';

function IconCheck({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="m5 12 4 4L19 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const DEMO_ROWS: Array<{ label: string; value: string }> = [
  { label: 'Услуга', value: 'Маникюр' },
  { label: 'Дата и время', value: 'Завтра, 14:30' },
  { label: 'Мастер', value: 'Анна Иванова' },
  { label: 'Стоимость', value: 'от 45 BYN' },
  { label: 'Напоминание', value: 'завтра в 12:00' },
  { label: 'Статус', value: 'подтверждено' },
];

export const HomeTelegramShowcase: FC = () => {
  return (
    <section
      id="telegram-showcase"
      className={homeSection}
      style={{ animationDelay: '155ms' }}
      aria-labelledby="home-booking-demo-heading"
    >
      <div className="mb-5 px-0.5">
        <h2 id="home-booking-demo-heading" className={homeSectionTitle}>
          Запись всегда под рукой
        </h2>
        <p className={homeSectionSubtitle}>
          После записи клиент получает понятное подтверждение и напоминание в Telegram.
        </p>
      </div>

      <div className="rounded-[28px] bg-[#F1EFEF] p-4 shadow-[0_12px_40px_rgba(17,24,39,0.05)] sm:p-5">
        <article className="mx-auto max-w-md rounded-[24px] bg-white p-5 ring-1 ring-[#F3F4F6] shadow-[0_14px_42px_rgba(17,24,39,0.08)] sm:p-6">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#FFF1F4] text-[#F47C8C]">
              <IconCheck className="h-5 w-5" />
            </span>
            <div>
              <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#9CA3AF]">Подтверждение</p>
              <h3 className="text-[22px] font-bold tracking-tight text-[#111827]">Вы записаны</h3>
            </div>
          </div>

          <dl className="mt-5 space-y-3">
            {DEMO_ROWS.map((row) => (
              <div key={row.label} className="flex items-start justify-between gap-4 border-b border-[#F1EFEF] pb-3 last:border-0 last:pb-0">
                <dt className="text-[13px] font-medium text-[#9CA3AF]">{row.label}</dt>
                <dd className="text-right text-[14px] font-semibold text-[#111827]">{row.value}</dd>
              </div>
            ))}
          </dl>

          <button type="button" className={`mt-6 w-full ${homeOutlineBtn} min-h-12 cursor-default text-[15px]`} tabIndex={-1}>
            Открыть запись
          </button>
        </article>
      </div>
    </section>
  );
};
