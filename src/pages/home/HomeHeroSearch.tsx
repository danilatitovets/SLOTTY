import { useCallback, useState, type FC, type FormEvent } from 'react';
import { HiMagnifyingGlass } from 'react-icons/hi2';
import { homePinkBtn } from './homeTheme';

type Props = {
  onSearch: (query: string) => void;
};

export const HomeHeroSearch: FC<Props> = ({ onSearch }) => {
  const [query, setQuery] = useState('');

  const submitSearch = useCallback(
    (e?: FormEvent) => {
      e?.preventDefault();
      onSearch(query.trim());
    },
    [onSearch, query],
  );

  return (
    <form
      onSubmit={submitSearch}
      className="
        w-full rounded-[22px] border border-[#F3F4F6] bg-white px-4 py-4
        sm:rounded-[26px] sm:px-5 sm:py-5
      "
    >
      <p className="mb-3 text-[13px] font-medium text-[#6B7280] sm:text-[14px]">
        Найдите услугу, мастера или салон
      </p>
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:gap-2">
        <div
          className="
            flex min-h-12 flex-1 items-center gap-2 rounded-full
            bg-[#F7F7F8] px-3.5 ring-1 ring-[#ECECEC]
          "
        >
          <HiMagnifyingGlass className="h-5 w-5 shrink-0 text-[#9CA3AF]" aria-hidden />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Маникюр, барбер, массаж…"
            className="min-w-0 flex-1 border-0 bg-transparent py-2.5 text-[15px] text-[#111827] outline-none placeholder:text-[#9CA3AF]"
            aria-label="Поиск услуги, мастера или салона"
          />
        </div>
        <button
          type="submit"
          className={`${homePinkBtn} !shadow-none min-h-12 w-full shrink-0 px-8 text-[15px] sm:w-auto`}
        >
          Найти
        </button>
      </div>
    </form>
  );
};
