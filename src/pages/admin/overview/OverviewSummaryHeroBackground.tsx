import { adminIntroOverlayClass, adminIntroScrimClass } from '../adminIntroOverlay';
import { useTabIntroImage } from '../useTabIntroImage';
import { OVERVIEW_WELCOME_IMAGE_SRC } from './adminOverviewTheme';

/** Фон hero-блока сводки: фото + лёгкий scrim (как у вкладок «Услуги» / «Расписание»). */
export function OverviewSummaryHeroBackground() {
  const src = useTabIntroImage(OVERVIEW_WELCOME_IMAGE_SRC);

  return (
    <>
      <img
        src={src}
        alt=""
        className="absolute inset-0 h-full w-full object-cover object-center"
        decoding="async"
      />
      <div className={`absolute inset-0 ${adminIntroScrimClass}`} aria-hidden />
      <div className={`absolute inset-0 ${adminIntroOverlayClass}`} aria-hidden />
    </>
  );
}
