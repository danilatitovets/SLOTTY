import { HiAdjustmentsHorizontal } from 'react-icons/hi2';

const fieldBase =
  'rounded-full bg-[#F1EFEF] outline-none transition';

type Props = {
  activeCount: number;
  onClick: () => void;
  className?: string;
};

export function FilterOpenButton({ activeCount, onClick, className = '' }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={activeCount > 0 ? `Фильтры, выбрано ${activeCount}` : 'Фильтры'}
      className={`relative flex h-11 w-11 shrink-0 items-center justify-center ${fieldBase} text-[#6B7280] active:scale-95 hover:text-[#F47C8C] focus:bg-white focus:text-[#F47C8C] ${className}`}
    >
      <HiAdjustmentsHorizontal className="h-5 w-5" aria-hidden />
      {activeCount > 0 ? (
        <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#F47C8C] px-1 text-[10px] font-bold text-white">
          {activeCount > 9 ? '9+' : activeCount}
        </span>
      ) : null}
    </button>
  );
}
