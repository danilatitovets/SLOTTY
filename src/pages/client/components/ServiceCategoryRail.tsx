import { Link } from 'react-router-dom';
import type { ServiceCategoryDto } from '../../../features/master-onboarding/api/becomeMasterApi';
import { getServiceCategoryPath } from '../../../app/paths';

const CATEGORY_EMOJI: Record<string, string> = {
  nails: '💅',
  pedicure: '🦶',
  brows: '✨',
  lashes: '👁',
  hair: '💇',
  makeup: '💄',
  depilation: '🌸',
};

type Props = {
  categories: ServiceCategoryDto[];
  activeCode?: string | null;
};

export function ServiceCategoryRail({ categories, activeCode }: Props) {
  if (!categories.length) return null;

  return (
    <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {categories.map((cat) => {
        const on = activeCode === cat.code;
        const emoji = CATEGORY_EMOJI[cat.code] ?? '✨';
        return (
          <Link
            key={cat.code}
            to={getServiceCategoryPath(cat.code)}
            className={`flex shrink-0 flex-col items-center gap-1.5 rounded-[20px] px-3 py-2 transition active:scale-[0.97] ${
              on ? 'bg-[#FFF1F4] ring-1 ring-[#F47C8C]/20' : 'bg-white ring-1 ring-[#EAECEF]'
            }`}
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FAFAFA] text-2xl">
              {emoji}
            </span>
            <span
              className={`max-w-[4.5rem] truncate text-center text-[11px] font-semibold ${
                on ? 'text-[#F47C8C]' : 'text-[#374151]'
              }`}
            >
              {cat.name}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
