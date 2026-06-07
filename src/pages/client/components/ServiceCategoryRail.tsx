import { Link } from 'react-router-dom';
import type { ServiceCategoryDto } from '../../../features/master-onboarding/api/becomeMasterApi';
import { getCategoryWorkPhotoUrl } from '../../../features/catalog/categoryWorkPhotos';
import { categoryCodesMatch } from '../../../features/catalog/serviceCategoryLabels';
import { getServiceCategoryPath, SERVICES_PATH } from '../../../app/paths';
import { ImageReveal } from '../../../shared/ui/ImageReveal';

type Props = {
  categories: ServiceCategoryDto[];
  activeCode?: string | null;
  /** Показать плитку «Все категории» (ведёт на список услуг). */
  showAllLink?: boolean;
  /** Режим фильтра на странице каталога — без перехода на другую страницу. */
  onSelectCategory?: (code: string | null) => void;
};

export function ServiceCategoryRail({
  categories,
  activeCode,
  showAllLink,
  onSelectCategory,
}: Props) {
  if (!categories.length) return null;

  const allTileClass = (active: boolean) =>
    `relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-[18px] bg-white shadow-[0_2px_10px_rgba(17,24,39,0.06)] ${
      active ? 'ring-2 ring-[#F47C8C]' : 'ring-1 ring-[#F47C8C]/30'
    }`;

  const tileLabelClass = (active: boolean) =>
    `w-[5.25rem] truncate px-0.5 text-center text-[11px] font-semibold leading-tight ${
      active ? 'text-[#F47C8C]' : 'text-[#374151]'
    }`;

  const itemClass = 'flex w-[5.25rem] shrink-0 flex-col items-center gap-1.5 transition active:scale-[0.97]';

  return (
    <div className="-mx-0.5 flex items-start gap-2.5 overflow-x-auto overscroll-x-contain px-0.5 py-1 [scrollbar-width:none] [touch-action:pan-x] [&::-webkit-scrollbar]:hidden">
      {showAllLink ? (
        onSelectCategory ? (
          <button
            type="button"
            onClick={() => onSelectCategory(null)}
            className={itemClass}
            aria-pressed={activeCode == null}
          >
            <span className={allTileClass(activeCode == null)}>
              <span className="text-[11px] font-bold text-[#F47C8C]">Все</span>
            </span>
            <span className={tileLabelClass(activeCode == null)}>Все категории</span>
          </button>
        ) : (
          <Link to={SERVICES_PATH} className={itemClass}>
            <span className={allTileClass(false)}>
              <span className="text-[11px] font-bold text-[#F47C8C]">Все</span>
            </span>
            <span className={tileLabelClass(false)}>Все категории</span>
          </Link>
        )
      ) : null}
      {categories.map((cat) => {
        const on = categoryCodesMatch(activeCode, cat.code);
        const imageSrc = getCategoryWorkPhotoUrl(cat.code || cat.name);
        const imageWrapClass = `relative block h-14 w-14 overflow-hidden rounded-[18px] bg-[#EEEEF0] shadow-[0_2px_10px_rgba(17,24,39,0.06)] ${
          on ? 'shadow-[0_4px_16px_rgba(244,124,140,0.2)] ring-2 ring-[#F47C8C]' : ''
        }`;

        if (onSelectCategory) {
          return (
            <button
              key={cat.code}
              type="button"
              onClick={() => onSelectCategory(cat.code)}
              className={itemClass}
              aria-pressed={on}
            >
              <span className={imageWrapClass}>
                <ImageReveal
                  src={imageSrc}
                  alt=""
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </span>
              <span className={tileLabelClass(on)}>{cat.name}</span>
            </button>
          );
        }

        return (
          <Link key={cat.code} to={getServiceCategoryPath(cat.code)} className={itemClass}>
            <span className={imageWrapClass}>
              <ImageReveal
                src={imageSrc}
                alt=""
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </span>
            <span className={tileLabelClass(on)}>{cat.name}</span>
          </Link>
        );
      })}
    </div>
  );
}
