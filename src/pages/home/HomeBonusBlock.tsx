import type { FC } from 'react';
import { homePinkBtn, homeSection, homeSectionSubtitle, homeSectionTitle } from './homeTheme';

export type HomeBonusBlockProps = {
  onClaim: () => void;
};

export const HomeBonusBlock: FC<HomeBonusBlockProps> = ({ onClaim }) => {
  return (
    <section className={homeSection} aria-labelledby="home-bonus-heading">
      <div className="relative overflow-hidden rounded-[26px] bg-gradient-to-br from-[#FFF1F4] via-[#FCE8EC] to-[#F8D4DC] p-5 shadow-[0_14px_42px_rgba(244,124,140,0.18)] ring-1 ring-[#F47C8C]/15 sm:rounded-[28px] sm:p-6">
        <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/40 blur-2xl" aria-hidden />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-4">
            <span
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[20px] bg-white/80 text-2xl shadow-[0_8px_24px_rgba(244,124,140,0.12)]"
              aria-hidden
            >
              🎁
            </span>
            <div className="min-w-0">
              <h2 id="home-bonus-heading" className={homeSectionTitle}>
                Дарим 10 BYN за первую запись
              </h2>
              <p className={`${homeSectionSubtitle} mt-1.5 max-w-md text-[#6B7280]`}>
                Выберите мастера, оформите первую запись через SLOTTY и получите бонус на услугу.
              </p>
            </div>
          </div>
          <button type="button" onClick={() => onClaim()} className={`shrink-0 sm:min-w-[11rem] ${homePinkBtn} min-h-12 px-6 text-[15px]`}>
            Получить бонус
          </button>
        </div>
      </div>
    </section>
  );
};
