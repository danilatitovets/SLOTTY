import { Link } from 'react-router-dom';
import { HiArrowLeft, HiHeart } from 'react-icons/hi2';
import { getProfilePath, HUB_PATH } from '../../../app/paths';
import {
  catalogMobileHeaderBarClass,
  catalogMobileHeaderTitleClass,
  catalogMobilePadX,
  catalogMobilePageToolbarSticky,
} from './servicesCatalogTheme';

type Props = {
  title: string;
  backTo?: string;
  backLabel?: string;
};

const iconBtn =
  'flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/25 active:scale-95';

export function CatalogMobilePageToolbar({
  title,
  backTo = HUB_PATH,
  backLabel = 'Назад',
}: Props) {
  return (
    <div className={catalogMobilePageToolbarSticky}>
      <div className={`${catalogMobileHeaderBarClass} pb-3 ${catalogMobilePadX}`}>
        <div className="relative flex min-h-11 w-full items-center">
          <Link
            to={backTo}
            className="relative z-10 inline-flex h-9 w-9 shrink-0 items-center justify-center text-white transition active:scale-95"
            aria-label={backLabel}
          >
            <HiArrowLeft className="h-5 w-5 shrink-0" aria-hidden />
          </Link>

          <p className={catalogMobileHeaderTitleClass}>{title}</p>

          <Link
            to={getProfilePath('favorites')}
            aria-label="Избранное"
            className={`${iconBtn} relative z-10 ml-auto`}
          >
            <HiHeart className="h-[18px] w-[18px]" aria-hidden />
          </Link>
        </div>
      </div>
    </div>
  );
}
