import type { FC } from 'react';
import { ImageReveal } from '../shared/ui/ImageReveal';
import { homeSection, homeSectionSubtitle, homeSectionTitle } from './home/homeTheme';

const CATEGORIES = [
  { key: 'manicure', label: 'Маникюр', image: '/photos/work/manicure.webp' },
  { key: 'barbers', label: 'Барберы', image: '/photos/work/barbers.webp' },
  { key: 'brows-lashes', label: 'Брови и ресницы', image: '/photos/work/brows_lashes.webp' },
  { key: 'massage', label: 'Массаж', image: '/photos/work/massage.webp' },
  { key: 'fitness', label: 'Фитнес', image: '/photos/work/fitness.webp' },
  { key: 'tattoo', label: 'Тату', image: '/photos/work/tattoo.webp' },
];

type HomeCategoriesProps = {
  onCategory: (category: string) => void;
};

export const HomeCategories: FC<HomeCategoriesProps> = ({ onCategory }) => {
  return (
    <section className={homeSection} style={{ animationDelay: '120ms' }} aria-labelledby="home-categories-heading">
      <div className="mb-4 px-0.5">
        <h2 id="home-categories-heading" className={homeSectionTitle}>
          Выберите услугу
        </h2>
        <p className={homeSectionSubtitle}>Найдите подходящего мастера в нужной категории.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {CATEGORIES.map((category, index) => (
          <button
            key={category.key}
            type="button"
            onClick={() => onCategory(category.key)}
            className="
              flex
              h-full
              min-h-[8.5rem]
              flex-col
              items-stretch
              overflow-hidden
              rounded-[22px]
              bg-white
              text-left
              ring-1
              ring-[#F3F4F6]
              shadow-[0_8px_28px_rgba(17,24,39,0.06)]
              transition
              active:scale-[0.98]
            "
          >
            <span className="flex h-[4.75rem] shrink-0 items-center justify-center bg-[#FAF8F8] sm:h-[5.25rem]">
              <ImageReveal
                src={category.image}
                alt=""
                loading={index < 2 ? 'eager' : 'lazy'}
                fetchPriority={index < 2 ? 'high' : 'low'}
                draggable={false}
                className="h-[3.25rem] w-[3.25rem] origin-center scale-[1.28] select-none object-contain sm:h-[3.5rem] sm:w-[3.5rem]"
              />
            </span>
            <span className="flex flex-1 items-center justify-center px-3 py-3 text-center text-[14px] font-semibold leading-snug tracking-[-0.02em] text-[#111827] sm:text-[15px]">
              {category.label}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
};
