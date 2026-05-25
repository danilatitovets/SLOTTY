import { useEffect, type FC } from 'react';
import { SlottyImg } from '../../shared/ui/SlottyImg';

const HERO_IMAGE = `/photos/${encodeURIComponent('херо')}/${encodeURIComponent('1.png')}`;

const HERO_ASPECT_CLASS = 'aspect-[1672/941]';

/** Скругление внутри серой плашки — совпадает с радиусом категорий на лендинге. */
const HERO_IMG_ROUND = 'rounded-[24px] sm:rounded-[28px]';

/** На мобилке скрыто: фоновое видео уже в HomeHero. */
const plateClass =
  'mt-10 hidden rounded-[24px] bg-[#F1EFEF] p-3 sm:mt-12 sm:block sm:rounded-[32px] sm:p-4';

const slideFrameClass =
  `relative w-full overflow-hidden ${HERO_IMG_ROUND} ${HERO_ASPECT_CLASS}`;

export const HomeTooHero: FC = () => {
  useEffect(() => {
    const img = new Image();
    img.src = HERO_IMAGE;
  }, []);

  return (
    <div className={plateClass} aria-hidden>
      <div className={slideFrameClass}>
        <SlottyImg
          src={HERO_IMAGE}
          alt=""
          decoding="async"
          loading="eager"
          fetchPriority="high"
          draggable={false}
          className={`absolute inset-0 z-10 h-full w-full ${HERO_IMG_ROUND} object-cover object-center`}
          style={{ objectFit: 'cover', objectPosition: 'center' }}
        />
      </div>
    </div>
  );
};
