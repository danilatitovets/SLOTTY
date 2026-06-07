import type { ServiceCategoryDto } from '../../../features/master-onboarding/api/becomeMasterApi';
import { getCategoryWorkPhotoUrl } from '../../../features/catalog/categoryWorkPhotos';
import { categoryCodesMatch } from '../../../features/catalog/serviceCategoryLabels';
import { ImageReveal } from '../../../shared/ui/ImageReveal';
import { catalogFilterSectionIconClass } from './servicesCatalogTheme';

type Props = {
  categoryCode?: string | null;
  categories?: ServiceCategoryDto[];
};

/** Иконка категории в фильтрах — фото из каталога или «Все». */
export function CatalogCategoryFilterIcon({ categoryCode = null, categories = [] }: Props) {
  const resolvedCode =
    categoryCode != null
      ? categories.find((c) => categoryCodesMatch(categoryCode, c.code))?.code ?? categoryCode
      : null;

  if (resolvedCode == null) {
    return (
      <span className={catalogFilterSectionIconClass}>
        <span className="text-[10px] font-bold leading-none text-[#F47C8C]">Все</span>
      </span>
    );
  }

  return (
    <span className="relative flex h-8 w-8 shrink-0 overflow-hidden rounded-[10px] bg-[#EEEEF0] ring-1 ring-[#F47C8C]/20">
      <ImageReveal
        src={getCategoryWorkPhotoUrl(resolvedCode)}
        alt=""
        className="h-full w-full object-cover"
      />
    </span>
  );
}
