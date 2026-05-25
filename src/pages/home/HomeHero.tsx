import { useEffect, useRef, useState, type FC } from 'react';
import { HERO_BG_SRC } from '../../app/headerLogo';
import { homePinkBtn } from './homeTheme';

const HERO_VIDEO_SRC = `/video/${encodeURIComponent('ЗЕРО.mp4')}`;

const heroContentShell =
  'mx-auto w-full max-w-[1320px] px-4 sm:px-6 xl:px-10';

const heroPrimaryBtn = `w-full sm:w-auto sm:min-w-[11.5rem] ${homePinkBtn} min-h-12 px-8 text-[15px]`;

const heroSecondaryBtn =
  'inline-flex min-h-12 w-full items-center justify-center rounded-full border border-[#D1D5DB] bg-white/95 px-8 text-[15px] font-semibold text-[#111827] shadow-sm backdrop-blur-sm transition hover:border-[#9CA3AF] hover:bg-[#FAFAFA] active:scale-[0.98] max-sm:border-[#E5E7EB] sm:bg-white sm:backdrop-blur-none sm:w-auto sm:min-w-[11.5rem]';

export type HomeHeroProps = {
  onFindMaster: () => void;
  onBecomeMaster: () => void;
  masterCtaLabel: string;
};

export const HomeHero: FC<HomeHeroProps> = ({
  onFindMaster,
  onBecomeMaster,
  masterCtaLabel,
}) => {
  const sectionRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [motionOk, setMotionOk] = useState(true);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setMotionOk(!mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    const section = sectionRef.current;
    if (!video || !section || !motionOk) return;

    video.muted = true;

    const play = () => {
      void video.play().catch(() => undefined);
    };

    play();
    video.addEventListener('loadeddata', play);

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) play();
        else video.pause();
      },
      { threshold: 0.08 },
    );
    observer.observe(section);

    return () => {
      video.removeEventListener('loadeddata', play);
      observer.disconnect();
    };
  }, [motionOk]);

  return (
    <section
      ref={sectionRef}
      className="relative min-h-[100dvh] w-full scroll-mt-28 overflow-hidden rounded-b-[28px] sm:rounded-b-[36px]"
      aria-labelledby="home-hero-heading"
    >
      <div
        className="pointer-events-none absolute inset-0 left-1/2 z-0 h-full w-[100vw] max-w-[100vw] -translate-x-1/2 overflow-hidden rounded-b-[28px] bg-[#F1EFEF] sm:rounded-b-[36px]"
        aria-hidden
      >
        {motionOk ? (
          <video
            ref={videoRef}
            src={HERO_VIDEO_SRC}
            poster={HERO_BG_SRC}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            disablePictureInPicture
            className="h-full min-h-full w-full object-cover object-[center_55%] sm:object-[center_52%]"
          />
        ) : (
          <img
            src={HERO_BG_SRC}
            alt=""
            loading="eager"
            decoding="async"
            draggable={false}
            className="h-full w-full object-cover object-[center_55%] sm:object-[center_52%]"
          />
        )}

        <div className="absolute inset-0 bg-gradient-to-b from-[#FFFCFC]/72 via-[#FFFCFC]/78 to-[#FFFCFC]/90 sm:from-[#FFFCFC]/65 sm:via-[#FFFCFC]/74 sm:to-[#FFFCFC]/88" />
      </div>

      <div
        className={`${heroContentShell} relative z-10 flex min-h-[100dvh] flex-col items-center justify-center pb-10 text-center sm:pb-14`}
        style={{
          paddingTop: 'var(--slotty-header-height, calc(5.5rem + env(safe-area-inset-top, 0px) + 0.5rem))',
        }}
      >
        <div className="mx-auto w-full max-w-[36em] antialiased">
          <h1
            id="home-hero-heading"
            className="mx-auto max-w-[13.5em] text-balance text-[1.875rem] font-bold leading-[1.08] tracking-[-0.03em] text-[#111827] sm:max-w-[18em] sm:text-[clamp(2.25rem,7vw,4rem)] sm:leading-[1.05]"
          >
            Найдите мастера рядом и запишитесь онлайн
          </h1>
        </div>

        <div className="mx-auto mt-6 flex w-full max-w-[20rem] flex-col items-stretch gap-2.5 sm:mt-8 sm:max-w-none sm:flex-row sm:justify-center sm:gap-3">
          <button type="button" onClick={() => onFindMaster()} className={heroPrimaryBtn}>
            Найти мастера
          </button>
          <button type="button" onClick={() => onBecomeMaster()} className={heroSecondaryBtn}>
            {masterCtaLabel}
          </button>
        </div>
      </div>
    </section>
  );
};
