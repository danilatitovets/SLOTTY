import { useCallback, useState, type FC, type FormEvent } from 'react';
import { HiMagnifyingGlass } from 'react-icons/hi2';
import {
  homeOutlineBtn,
  homePinkBtn,
  homeSection,
} from './homeTheme';

const BENEFITS = [
  'Онлайн-запись 24/7',
  'Напоминания в Telegram',
  'Проверенные мастера',
  'Без звонков и переписок',
] as const;

export type HomeHeroProps = {
  onFindMaster: () => void;
  onBecomeMaster: () => void;
  onSearch: (query: string) => void;
  masterCtaLabel: string;
};

export const HomeHero: FC<HomeHeroProps> = ({
  onFindMaster,
  onBecomeMaster,
  onSearch,
  masterCtaLabel,
}) => {
  const [query, setQuery] = useState('');

  const submitSearch = useCallback(
    (e?: FormEvent) => {
      e?.preventDefault();
      onSearch(query.trim());
    },
    [onSearch, query],
  );

  return (
    <section className={`${homeSection} !mt-0 scroll-mt-28`} aria-labelledby="home-hero-heading">
      <div className="relative isolate overflow-hidden rounded-[28px] bg-[#FAF8F8] px-5 py-8 ring-1 ring-[#F3F4F6] shadow-[0_12px_40px_rgba(17,24,39,0.06)] sm:rounded-[32px] sm:px-8 sm:py-10">
        <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-[#F47C8C]/12 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute -bottom-24 -left-12 h-48 w-48 rounded-full bg-[#F1EFEF] blur-2xl" aria-hidden />

        <div className="relative">
          <span className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#FFF1F4] to-[#FCE8EC] px-3.5 py-1.5 text-[13px] font-semibold text-[#D45A6E] ring-1 ring-[#F47C8C]/20">
            <span aria-hidden className="text-base leading-none">
              🎁
            </span>
            −10 BYN на первую запись
          </span>

          <h1
            id="home-hero-heading"
            className="mt-5 max-w-[20rem] text-balance text-[clamp(1.75rem,6vw,2.5rem)] font-bold leading-[1.08] tracking-[-0.04em] text-[#111827] sm:max-w-[26rem]"
          >
            Запишитесь к мастеру за пару кликов
          </h1>

          <p className="mt-3 max-w-[22rem] text-[15px] leading-relaxed text-[#6B7280] sm:max-w-[28rem] sm:text-[16px]">
            Маникюр, брови, ресницы, барберы, массаж, фитнес и тату — выбирайте услугу, мастера и удобное
            время прямо в Telegram.
          </p>

          <form className="mt-6 flex gap-2" onSubmit={submitSearch}>
            <label className="relative min-w-0 flex-1">
              <HiMagnifyingGlass
                className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#9CA3AF]"
                aria-hidden
              />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Услуга, мастер или салон"
                className="h-12 w-full rounded-full border-0 bg-white pl-11 pr-4 text-[15px] text-[#111827] shadow-[0_4px_20px_rgba(17,24,39,0.06)] outline-none ring-1 ring-[#F3F4F6] placeholder:text-[#9CA3AF] focus:ring-2 focus:ring-[#F47C8C]/35"
              />
            </label>
            <button type="submit" className={`shrink-0 px-5 ${homePinkBtn}`}>
              Найти
            </button>
          </form>

          <div className="mt-5 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap">
            <button type="button" onClick={() => onFindMaster()} className={`w-full sm:flex-1 ${homePinkBtn} min-h-12 text-[15px]`}>
              Найти мастера
            </button>
            <button
              type="button"
              onClick={() => onBecomeMaster()}
              className={`w-full sm:flex-1 ${homeOutlineBtn} min-h-12 text-[15px]`}
            >
              {masterCtaLabel}
            </button>
          </div>

          <ul className="mt-6 grid grid-cols-2 gap-x-3 gap-y-2 sm:flex sm:flex-wrap sm:gap-x-5">
            {BENEFITS.map((item) => (
              <li key={item} className="flex items-center gap-2 text-[12px] font-medium text-[#6B7280] sm:text-[13px]">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#F47C8C]" aria-hidden />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
};
