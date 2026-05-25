import { Link } from 'react-router-dom';
import { HiArrowLeft, HiHeart } from 'react-icons/hi2';
import { getProfilePath, HUB_PATH } from '../../../app/paths';
import { catalogDesktopPanel, catalogMobilePageToolbarSticky } from './servicesCatalogTheme';

type Props = {
  title: string;
  backTo?: string;
  backLabel?: string;
};

const iconBtn =
  'flex h-9 w-9 items-center justify-center rounded-[10px] bg-[#F5F5F5] text-[#374151] transition hover:bg-[#EBEBEB] active:scale-95';

export function CatalogMobilePageToolbar({
  title,
  backTo = HUB_PATH,
  backLabel = 'Назад',
}: Props) {
  return (
    <div className={catalogMobilePageToolbarSticky}>
      <div className={`${catalogDesktopPanel} ring-1 ring-[#EEEEEE] px-4 py-2.5`}>
        <div className="flex min-h-[52px] w-full items-center justify-between gap-3">
          <Link
            to={backTo}
            className="inline-flex min-h-9 min-w-9 shrink-0 items-center justify-center gap-1.5 text-[#6B7280] transition hover:text-[#111827]"
            aria-label={backLabel}
          >
            <HiArrowLeft className="h-5 w-5 shrink-0" aria-hidden />
          </Link>

          <p className="min-w-0 flex-1 truncate px-2 text-center text-[15px] font-bold text-[#111827]">
            {title}
          </p>

          <Link
            to={getProfilePath('favorites')}
            aria-label="Избранное"
            className={`${iconBtn} text-[#6B7280] hover:text-[#F47C8C]`}
          >
            <HiHeart className="h-[18px] w-[18px]" aria-hidden />
          </Link>
        </div>
      </div>
    </div>
  );
}
