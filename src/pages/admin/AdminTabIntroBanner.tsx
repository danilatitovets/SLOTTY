import { adminIntroOverlayClass, adminIntroScrimClass } from './adminIntroOverlay';
import { useTabIntroImage } from './useTabIntroImage';

export const ADMIN_TAB_INTRO_HEIGHT_CLASS = 'h-[8.5rem]';

type Props = {
  title: string;
  imageSrc: string;
  wrapper?: 'header' | 'div';
  wrapperClassName?: string;
};

export function AdminTabIntroBanner({
  title,
  imageSrc,
  wrapper = 'div',
  wrapperClassName = '',
}: Props) {
  const displaySrc = useTabIntroImage(imageSrc);

  const card = (
    <div className={`relative ${ADMIN_TAB_INTRO_HEIGHT_CLASS} overflow-hidden rounded-[22px]`}>
      <img
        src={displaySrc}
        alt=""
        className="absolute inset-0 h-full w-full object-cover object-center"
        decoding="async"
      />
      <div className={`absolute inset-0 ${adminIntroScrimClass}`} aria-hidden />
      <div className={`absolute inset-0 ${adminIntroOverlayClass}`} aria-hidden />
      <div
        className={`relative flex ${ADMIN_TAB_INTRO_HEIGHT_CLASS} items-center justify-center px-4`}
      >
        <span className="inline-flex max-w-[min(100%,18rem)] items-center justify-center rounded-full border border-white/55 bg-white/35 px-6 py-2.5 shadow-[0_4px_24px_rgba(17,24,39,0.08)] backdrop-blur-md backdrop-saturate-150">
          <h2 className="text-center text-[22px] font-bold leading-tight tracking-[-0.04em] text-neutral-950">
            {title}
          </h2>
        </span>
      </div>
    </div>
  );

  if (wrapper === 'header') {
    return (
      <header className={`pb-4 ${wrapperClassName}`.trim()} role="region" aria-label={title}>
        {card}
      </header>
    );
  }

  return (
    <div className={wrapperClassName} role="region" aria-label={title}>
      {card}
    </div>
  );
}
