import { servicesTabPhotoSrc } from './adminServicesTheme';
import type { ServicesTabId } from './servicesTypes';
import { SERVICES_TAB_SUBTITLES } from './servicesTypes';

const TAB_INTRO: Record<
  ServicesTabId,
  { title: string; description: string; imageSrc: string; overlayClass: string }
> = {
  catalog: {
    title: 'Услуги',
    description: SERVICES_TAB_SUBTITLES.catalog,
    imageSrc: servicesTabPhotoSrc('11.webp'),
    overlayClass:
      'bg-gradient-to-r from-[#7a3d52]/72 via-[#c4617f]/38 via-55% to-transparent',
  },
  price: {
    title: 'Прайс',
    description: SERVICES_TAB_SUBTITLES.price,
    imageSrc: servicesTabPhotoSrc('22.webp'),
    overlayClass:
      'bg-gradient-to-r from-[#6b3d4a]/70 via-[#b86a7a]/36 via-55% to-transparent',
  },
  bundles: {
    title: 'Наборы',
    description: SERVICES_TAB_SUBTITLES.bundles,
    imageSrc: servicesTabPhotoSrc('33.webp'),
    overlayClass:
      'bg-gradient-to-r from-[#6e3550]/72 via-[#c4617f]/40 via-55% to-transparent',
  },
  promotions: {
    title: 'Акции',
    description: SERVICES_TAB_SUBTITLES.promotions,
    imageSrc: servicesTabPhotoSrc('44.webp'),
    overlayClass:
      'bg-gradient-to-r from-[#6f3a42]/70 via-[#c96b72]/38 via-55% to-transparent',
  },
};

type Props = {
  tab: ServicesTabId;
};

export function ServicesTabIntro({ tab }: Props) {
  const { title, description, imageSrc, overlayClass } = TAB_INTRO[tab];

  return (
    <header className="pb-4" role="region" aria-label={title}>
      <div className="relative min-h-[7.75rem] overflow-hidden rounded-[22px]">
        <img
          src={imageSrc}
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-center"
          decoding="async"
        />
        <div className={`absolute inset-0 ${overlayClass}`} aria-hidden />
        <div className="relative flex min-h-[7.75rem] flex-col justify-end p-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.06em] text-white/75">Раздел</p>
          <h1 className="mt-1 text-[22px] font-bold tracking-[-0.05em] text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.45)]">
            {title}
          </h1>
          <p className="mt-1.5 max-w-[20rem] text-[13px] leading-relaxed text-white/90 drop-shadow-[0_1px_6px_rgba(0,0,0,0.4)]">
            {description}
          </p>
        </div>
      </div>
    </header>
  );
}
