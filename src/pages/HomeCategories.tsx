import type { FC } from 'react';
import { ImageReveal } from '../shared/ui/ImageReveal';
import { homeSection } from './home/homeTheme';

const CATEGORIES = [
  { key: 'manicure', label: 'Маникюр', image: '/photos/лендинг/каталог/маникюр.webp' },
  { key: 'barbers', label: 'Барберы', image: '/photos/лендинг/каталог/барберы.webp' },
  { key: 'brows-lashes', label: 'Брови и ресницы', image: '/photos/лендинг/каталог/брови.webp' },
  { key: 'massage', label: 'Массаж', image: '/photos/лендинг/каталог/массаж.webp' },
  { key: 'fitness', label: 'Фитнес', image: '/photos/лендинг/каталог/фитнес.webp' },
  { key: 'tattoo', label: 'Тату', image: '/photos/лендинг/каталог/тату.webp' },
] as const;

function categoryImageSrc(category: (typeof CATEGORIES)[number]): string {
  return category.image;
}

type HomeCategoriesProps = {
  onCategory: (category: string) => void;
};

export const HomeCategories: FC<HomeCategoriesProps> = ({ onCategory }) => {
  return (
    <section
      className={`${homeSection} !mt-12 sm:!mt-16`}
      style={{ animationDelay: '120ms' }}
      aria-labelledby="home-categories-heading"
    >
      <h2
        id="home-categories-heading"
        className="text-left text-[clamp(2rem,6vw,3.25rem)] font-bold leading-[1.05] tracking-[-0.04em] text-[#111827]"
      >
        Выберите услугу
      </h2>

      <div
        className="mt-10 mr-[calc(50%-50vw)] overflow-x-auto [scrollbar-width:none] sm:mt-14 [&::-webkit-scrollbar]:hidden"
      >
        <ul className="flex w-max list-none snap-x snap-mandatory gap-5 pb-2 sm:gap-6">
          {CATEGORIES.map((category, index) => (
            <li key={category.key} className="w-[min(17.5rem,82vw)] shrink-0 snap-start sm:w-[19.5rem]">
              <button
                type="button"
                onClick={() => onCategory(category.key)}
                aria-label={category.label}
                className="group block w-full transition active:opacity-95"
              >
                <div className="overflow-hidden rounded-[22px] bg-[#F2F2F2] p-3 sm:rounded-[26px] sm:p-4">
                  <ImageReveal
                    src={categoryImageSrc(category)}
                    alt={category.label}
                    loading={index < 2 ? 'eager' : 'lazy'}
                    fetchPriority={index < 2 ? 'high' : 'low'}
                    draggable={false}
                    className="block h-auto w-full rounded-[20px] object-contain transition duration-500 group-hover:scale-[1.01] sm:rounded-[24px]"
                  />
                </div>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};
