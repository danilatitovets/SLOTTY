import type { FC } from 'react';
import { Link } from 'react-router-dom';
import { BECOME_MASTER_PATH, SERVICES_PATH } from '../app/paths';
import { homePinkBtn, homeSection, homeSectionTitle } from './home/homeTheme';

const PLANS = [
  {
    key: 'client',
    title: 'Клиент',
    price: '0 BYN',
    text: 'Для клиентов SLOTTY бесплатный: выбирайте услуги, смотрите мастеров и записывайтесь онлайн.',
    features: ['Поиск услуг', 'Профили мастеров', 'Онлайн-запись', 'Напоминания в Telegram'],
    cta: 'Найти мастера',
    to: SERVICES_PATH,
    recommended: false,
  },
  {
    key: 'master',
    title: 'Мастер Pro',
    price: '29 BYN',
    priceNote: '/ месяц',
    text: 'Для мастеров, которые хотят принимать записи онлайн и управлять услугами в одном кабинете.',
    features: [
      'Профиль мастера',
      'Услуги и цены',
      'График работы',
      'Заявки клиентов',
      'Акции и свободные окна',
      'Telegram-уведомления',
    ],
    cta: 'Стать мастером',
    to: BECOME_MASTER_PATH,
    recommended: true,
  },
] as const;

function IconCheck({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      aria-hidden
    >
      <path d="m5 12 4 4L19 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export const HomeTariffs: FC = () => {
  return (
    <section id="tarify" className={homeSection} style={{ animationDelay: '60ms' }}>
      <div className="mb-5 px-0.5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#9CA3AF]">Тарифы</p>
        <h2 className={`${homeSectionTitle} mt-1`}>Простые условия для клиентов и мастеров</h2>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {PLANS.map((plan) => (
          <article
            key={plan.key}
            className={`
              relative flex min-h-[20rem] flex-col overflow-hidden rounded-[26px] px-5 pb-6 pt-5
              shadow-[0_12px_40px_rgba(17,24,39,0.08)]
              ${
                plan.recommended
                  ? 'bg-gradient-to-br from-[#F47C8C] to-[#F26D83] text-white shadow-[0_20px_56px_rgba(244,124,140,0.35)] ring-2 ring-[#F47C8C]/30'
                  : 'bg-white text-[#111827] ring-1 ring-[#F3F4F6]'
              }
            `}
          >
            {plan.recommended ? (
              <span className="absolute right-4 top-4 rounded-full bg-white/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.1em]">
                Рекомендуем
              </span>
            ) : null}

            <p className={`text-[18px] font-semibold tracking-tight ${plan.recommended ? 'text-white' : 'text-[#111827]'}`}>
              {plan.title}
            </p>

            <div className="mt-4 flex items-baseline gap-1">
              <span className={`text-[36px] font-bold tracking-tight ${plan.recommended ? 'text-white' : 'text-[#111827]'}`}>
                {plan.price}
              </span>
              {'priceNote' in plan && plan.priceNote ? (
                <span className={`text-[14px] font-medium ${plan.recommended ? 'text-white/75' : 'text-[#9CA3AF]'}`}>
                  {plan.priceNote}
                </span>
              ) : null}
            </div>

            <p className={`mt-3 text-[14px] leading-relaxed ${plan.recommended ? 'text-white/85' : 'text-[#6B7280]'}`}>
              {plan.text}
            </p>

            <ul className="mt-4 flex flex-1 flex-col gap-2">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-center gap-2.5">
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                      plan.recommended ? 'bg-white/20 text-white' : 'bg-[#FFF1F4] text-[#F47C8C]'
                    }`}
                  >
                    <IconCheck className="h-3.5 w-3.5" />
                  </span>
                  <span className={`text-[14px] font-medium ${plan.recommended ? 'text-white/90' : 'text-[#374151]'}`}>
                    {feature}
                  </span>
                </li>
              ))}
            </ul>

            <Link
              to={plan.to}
              className={`mt-5 flex min-h-12 w-full items-center justify-center rounded-full text-[15px] font-semibold transition active:scale-[0.98] ${
                plan.recommended
                  ? 'bg-white text-[#111827] shadow-[0_10px_28px_rgba(0,0,0,0.12)]'
                  : homePinkBtn
              }`}
            >
              {plan.cta}
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
};
