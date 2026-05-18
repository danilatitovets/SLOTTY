import { HiMagnifyingGlass } from 'react-icons/hi2';
import { HiAdjustmentsHorizontal } from 'react-icons/hi2';

type Props = {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  onFilterClick: () => void;
};

export function ClientSearchBar({ value, onChange, placeholder, onFilterClick }: Props) {
  return (
    <div className="flex gap-2">
      <label className="relative flex min-h-12 min-w-0 flex-1 items-center">
        <HiMagnifyingGlass
          className="pointer-events-none absolute left-4 h-5 w-5 text-[#9CA3AF]"
          aria-hidden
        />
        <input
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="h-12 w-full rounded-full border border-[#EAECEF] bg-white pl-11 pr-4 text-[15px] text-[#111827] shadow-sm outline-none placeholder:text-[#9CA3AF] focus:border-[#F47C8C]/40 focus:ring-2 focus:ring-[#F47C8C]/15"
        />
      </label>
      <button
        type="button"
        onClick={onFilterClick}
        aria-label="Фильтры"
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[#EAECEF] bg-white text-[#6B7280] shadow-sm transition active:scale-95 hover:text-[#F47C8C]"
      >
        <HiAdjustmentsHorizontal className="h-5 w-5" aria-hidden />
      </button>
    </div>
  );
}
