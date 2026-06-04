import { useTabIntroImage } from '../useTabIntroImage';
import { OVERVIEW_WELCOME_IMAGE_SRC } from './adminOverviewTheme';

/** Фон hero-блока сводки: то же фото, что у «Расписание → Окна», с плотным scrim для текста. */
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
      <div className="pointer-events-none absolute inset-0 bg-black/45" aria-hidden />
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/55 via-black/30 to-black/20"
        aria-hidden
      />
    </>
  );
}
