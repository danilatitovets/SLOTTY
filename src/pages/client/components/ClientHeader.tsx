import { Link } from 'react-router-dom';
import { HiHeart, HiMapPin } from 'react-icons/hi2';
import { HEADER_LOGO_SRC } from '../../../app/headerLogo';
import { getProfilePath, SERVICES_PATH } from '../../../app/paths';

type Props = {
  cityLabel: string;
  onCityClick?: () => void;
};

export function ClientHeader({ cityLabel, onCityClick }: Props) {
  return (
    <header className="fixed inset-x-0 top-0 z-40 pt-[calc(0.5rem+env(safe-area-inset-top,0px))]">
      <div className="mx-auto max-w-lg px-4">
        <div className="flex items-center justify-between gap-2 rounded-[28px] bg-[#F1EFEF] px-3 py-2 shadow-[0_1px_3px_rgba(0,0,0,0.06)] sm:px-4">
          <Link
            to={SERVICES_PATH}
            aria-label="SLOTTY"
            className="inline-flex h-9 shrink-0 items-center transition active:opacity-70"
          >
            <img
              src={HEADER_LOGO_SRC}
              alt=""
              decoding="async"
              className="h-9 w-auto origin-center object-contain [transform:translateY(0.2rem)_scale(1.5)]"
            />
          </Link>

          <button
            type="button"
            onClick={onCityClick}
            className="flex min-w-0 max-w-[46%] items-center gap-1 rounded-full bg-white/80 px-3 py-1.5 text-[13px] font-semibold text-[#374151] shadow-sm transition active:scale-[0.98]"
          >
            <HiMapPin className="h-4 w-4 shrink-0 text-[#F47C8C]" aria-hidden />
            <span className="truncate">{cityLabel}</span>
          </button>

          <Link
            to={getProfilePath('favorites')}
            aria-label="Избранное"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/90 text-[#9CA3AF] shadow-sm transition hover:text-[#F47C8C] active:scale-95"
          >
            <HiHeart className="h-5 w-5" aria-hidden />
          </Link>
        </div>
      </div>
    </header>
  );
}
