import type { FC } from 'react';
import { Link } from 'react-router-dom';
import { HiBell, HiCalendarDays } from 'react-icons/hi2';
import { homeOutlineBtn, homePinkBtn, homeSection } from './home/homeTheme';

const STATS = [
  { title: '6 категорий', Icon: HiCalendarDays },
  { title: 'Онлайн-запись 24/7', Icon: HiCalendarDays },
  { title: 'Telegram-напоминания', Icon: HiBell, highlight: true },
] as const;

export type HomeTrustProps = {
  onFindMaster: () => void | Promise<void>;
};

export const HomeTrust: FC<HomeTrustProps> = ({ onFindMaster }) => {
  return (
    <section id="nagrady" className={homeSection} style={{ animationDelay: '80ms' }}>
      <div className="rounded-[28px] bg-[#F1EFEF] p-4 shadow-[0_10px_36px_rgba(17,24,39,0.05)] sm:p-5">
        <div className="rounded-[24px] bg-white px-5 py-8 text-center ring-1 ring-[#F3F4F6] shadow-[0_8px_28px_rgba(17,24,39,0.06)] sm:px-8 sm:py-10">
          <div className="grid gap-4 sm:grid-cols-3">
            {STATS.map((row) => (
              <div key={row.title} className="flex flex-col items-center gap-2 px-2">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#FFF1F4] text-[#F47C8C]">
                  <row.Icon className="h-5 w-5" aria-hidden />
                </span>
                <p
                  className={`text-center text-[15px] font-bold leading-snug tracking-tight sm:text-[16px] ${
                    'highlight' in row && row.highlight
                      ? 'bg-gradient-to-r from-[#F47C8C] to-[#F26D83] bg-clip-text text-transparent'
                      : 'text-[#111827]'
                  }`}
                >
                  {row.title}
                </p>
              </div>
            ))}
          </div>

          <p className="mx-auto mt-6 max-w-md text-[14px] leading-relaxed text-[#6B7280]">
            Мастера, услуги, график работы и напоминания — в одном понятном интерфейсе.
          </p>

          <div className="mx-auto mt-6 flex max-w-sm flex-col gap-2.5">
            <button type="button" onClick={() => void onFindMaster()} className={`w-full ${homePinkBtn} min-h-12 text-[15px]`}>
              Найти мастера
            </button>
            <Link to="#tarify" className={`w-full ${homeOutlineBtn} min-h-12 text-[15px]`}>
              Смотреть тарифы
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};
