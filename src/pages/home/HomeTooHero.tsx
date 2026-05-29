import { useEffect, type FC } from 'react';
import { SlottyImg } from '../../shared/ui/SlottyImg';

const HERO_IMAGE = `/photos/${encodeURIComponent('херо')}/${encodeURIComponent('1.webp')}`;

/** Скругление внутри серой плашки — совпадает с радиусом категорий на лендинге. */
const HERO_IMG_ROUND = 'rounded-[20px] sm:rounded-[28px]';

/** На мобилке тоже показываем фото сразу под видео. */
const plateClass = 'block';

export const HomeTooHero: FC = () => {
  useEffect(() => {
    const img = new Image();
    img.src = HERO_IMAGE;
  }, []);

  return (
    <div className={plateClass} aria-hidden>
      <SlottyImg
        src={HERO_IMAGE}
        alt=""
        decoding="async"
        loading="eager"
        fetchPriority="high"
        draggable={false}
        className={`block min-h-[14.5rem] w-full object-cover object-center sm:min-h-0 sm:object-contain ${HERO_IMG_ROUND}`}
      />
    </div>
  );
};
