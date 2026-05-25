import { useCallback, useEffect, useMemo, useRef, useState, type FC } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { MASTER_START_PATH } from '../../app/paths';
import {
  LANDING_MASTERS_TAB_APPOINTMENTS,
  LANDING_MASTERS_TAB_OVERVIEW,
  LANDING_MASTERS_TAB_PROFILE,
  LANDING_MASTERS_TAB_SCHEDULE,
  LANDING_MASTERS_TAB_SERVICES,
  type LandingMastersTabId,
  parseLandingMastersTab,
} from '../../shared/layout/SlottyHeader/headerNav';
import { ImageReveal } from '../../shared/ui/ImageReveal';
import {
  homeBentoBody,
  homeBentoRound,
  homeGraySurface,
  homeBentoTitle,
  homeLandingHeading,
  homeOutlineBtn,
  homePinkBtn,
  homeSection,
  homeStepBadge,
} from './homeTheme';

const FOR_MASTERS_DIR = 'ДЛЯ МАСТЕРОВ';

const masterPhoto = (file: string) =>
  `/photos/${encodeURIComponent(FOR_MASTERS_DIR)}/${encodeURIComponent(file)}`;

/** Как в HomeTooHero: серая плашка без бордеров и теней. */
const MASTERS_PHOTO_PLATE =
  'w-full rounded-[24px] bg-[#F1EFEF] p-3 sm:rounded-[28px] sm:p-4';
/** Скругление внешнего кадра — как в HomeTooHero. */
const MASTERS_FRAME_ROUND = 'overflow-hidden rounded-[24px] sm:rounded-[28px]';
/** Скругление самого фото (клип + radius на img). */
const MASTERS_PHOTO_ROUND = 'overflow-hidden rounded-[20px] sm:rounded-[24px]';
const MASTERS_PHOTO_CLIP =
  '[clip-path:inset(0_round_20px)] sm:[clip-path:inset(0_round_24px)]';
/** Отступ фото от краёв серой плашки — не обрезаем скрин. */
const MASTERS_PHOTO_INSET = 'inset-3 sm:inset-4 lg:inset-5';
/** Одинаковая высота всех кадров справа. */
const SLIDE_FRAME_H = 'h-[min(28rem,78vw)] sm:h-[34rem] lg:h-[38rem]';

type MasterSlide = {
  id: LandingMastersTabId;
  label: string;
  title: string;
  text: string;
  imageSrc: string;
  imageAlt: string;
};

const MASTER_SLIDES: MasterSlide[] = [
  {
    id: LANDING_MASTERS_TAB_PROFILE,
    label: 'Профиль',
    title: 'Профиль мастера',
    text: 'Аватар, описание, адрес, контакты, категории, сертификаты и портфолио — всё в одном месте.',
    imageSrc: masterPhoto('КАБИНЕТМАСТЕРА.png'),
    imageAlt: 'Кабинет мастера — профиль',
  },
  {
    id: LANDING_MASTERS_TAB_APPOINTMENTS,
    label: 'Заявки',
    title: 'Заявки клиентов',
    text: 'Новые, предстоящие и завершённые записи — принимайте, переносите и отменяйте в пару кликов.',
    imageSrc: masterPhoto('ЗАЯВКИМАСЕТРА.png'),
    imageAlt: 'Заявки в кабинете мастера',
  },
  {
    id: LANDING_MASTERS_TAB_SERVICES,
    label: 'Услуги',
    title: 'Услуги и цены',
    text: 'Добавляйте услуги, длительность, стоимость и описание — клиенты видят актуальный прайс.',
    imageSrc: masterPhoto('УСЛУГИ МАСТЕРА.png'),
    imageAlt: 'Услуги мастера',
  },
  {
    id: LANDING_MASTERS_TAB_SCHEDULE,
    label: 'График',
    title: 'График и окна',
    text: 'Рабочие дни, время приёма и свободные слоты — расписание всегда под вашим контролем.',
    imageSrc: masterPhoto('КАЛЕНДРАЬ МАСТЕРА.png'),
    imageAlt: 'Календарь мастера',
  },
  {
    id: LANDING_MASTERS_TAB_OVERVIEW,
    label: 'Сводка',
    title: 'Сводка и аналитика',
    text: 'Записи, выручка, активность клиентов и подсказки — видно, как растёт ваш бизнес.',
    imageSrc: masterPhoto('СВОДКА МАСТЕРА.png'),
    imageAlt: 'Сводка мастера',
  },
];

function MasterSlidePhoto({ slide, priority }: { slide: MasterSlide; priority?: boolean }) {
  return (
    <figure
      id={slide.id}
      className={`${MASTERS_PHOTO_PLATE} overflow-hidden scroll-mt-24`}
      aria-label={slide.imageAlt}
    >
      <div className={`relative isolate w-full bg-[#F1EFEF] ${MASTERS_FRAME_ROUND} ${SLIDE_FRAME_H}`}>
        <div
          className={`absolute ${MASTERS_PHOTO_INSET} ${MASTERS_PHOTO_ROUND} ${MASTERS_PHOTO_CLIP} bg-white`}
        >
          <ImageReveal
            src={slide.imageSrc}
            alt={slide.imageAlt}
            loading={priority ? 'eager' : 'lazy'}
            fetchPriority={priority ? 'high' : 'low'}
            draggable={false}
            className="block h-full w-full rounded-[20px] object-contain object-center sm:rounded-[24px]"
            style={{
              objectFit: 'contain',
              objectPosition: 'center',
              borderRadius: '20px',
            }}
          />
        </div>
      </div>
    </figure>
  );
}

export type HomeForMastersProps = {
  masterCtaPath: string;
  masterCtaLabel: string;
  isMasterUser?: boolean;
};

export const HomeForMasters: FC<HomeForMastersProps> = ({
  masterCtaPath,
  masterCtaLabel,
  isMasterUser = false,
}) => {
  const location = useLocation();
  const hashTabId = useMemo(() => parseLandingMastersTab(location.hash), [location.hash]);
  const [activeTabId, setActiveTabId] = useState<LandingMastersTabId>(hashTabId);
  const activeSlide = MASTER_SLIDES.find((s) => s.id === activeTabId) ?? MASTER_SLIDES[0];
  const scrollLockRef = useRef(false);
  const scrollLockTimerRef = useRef<number | null>(null);
  const syncHashRef = useRef<string>(location.hash.replace(/^#/, ''));
  const observerRafRef = useRef<number | null>(null);

  const replaceHash = useCallback(
    (id: LandingMastersTabId) => {
      syncHashRef.current = id;
      const next = `#${id}`;
      if (window.location.hash === next) return;
      window.history.replaceState(window.history.state, '', `${location.pathname}${next}`);
    },
    [location.pathname],
  );

  const lockScroll = useCallback((ms = 900) => {
    scrollLockRef.current = true;
    if (scrollLockTimerRef.current != null) window.clearTimeout(scrollLockTimerRef.current);
    scrollLockTimerRef.current = window.setTimeout(() => {
      scrollLockRef.current = false;
    }, ms);
  }, []);

  useEffect(() => {
    setActiveTabId(hashTabId);
    const hash = location.hash.replace(/^#/, '');
    if (!hash.startsWith('for-masters')) return;
    if (hash === syncHashRef.current) return;

    syncHashRef.current = hash;
    const el = document.getElementById(hashTabId);
    if (!el || scrollLockRef.current) return;

    lockScroll();
    document.getElementById('for-masters')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    window.requestAnimationFrame(() => {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  }, [hashTabId, location.hash, lockScroll]);

  useEffect(() => {
    MASTER_SLIDES.forEach((slide) => {
      const img = new Image();
      img.src = slide.imageSrc;
    });
  }, []);

  useEffect(() => {
    const nodes = MASTER_SLIDES.map((s) => document.getElementById(s.id)).filter(Boolean) as HTMLElement[];
    if (nodes.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (scrollLockRef.current) return;

        let bestId: LandingMastersTabId | null = null;
        let bestRatio = 0;
        for (const entry of entries) {
          if (!entry.isIntersecting || entry.intersectionRatio <= bestRatio) continue;
          bestRatio = entry.intersectionRatio;
          bestId = entry.target.id as LandingMastersTabId;
        }
        if (!bestId || bestRatio < 0.2) return;

        if (observerRafRef.current != null) window.cancelAnimationFrame(observerRafRef.current);
        observerRafRef.current = window.requestAnimationFrame(() => {
          observerRafRef.current = null;
          setActiveTabId((prev) => (prev === bestId ? prev : bestId!));
          replaceHash(bestId!);
        });
      },
      { root: null, rootMargin: '-42% 0px -42% 0px', threshold: [0, 0.2, 0.4, 0.6, 0.8] },
    );

    nodes.forEach((node) => observer.observe(node));
    return () => {
      observer.disconnect();
      if (observerRafRef.current != null) window.cancelAnimationFrame(observerRafRef.current);
    };
  }, [replaceHash]);

  useEffect(
    () => () => {
      if (scrollLockTimerRef.current != null) window.clearTimeout(scrollLockTimerRef.current);
    },
    [],
  );

  const ctaBlock = (fullWidth: boolean) => (
    <div className={`flex flex-col gap-2.5 ${fullWidth ? '' : 'sm:max-w-[20rem]'}`}>
      <Link
        to={masterCtaPath}
        className={`${homePinkBtn} ${fullWidth ? 'w-full' : 'w-fit'} min-h-12 px-8 text-center text-[15px]`}
      >
        {masterCtaLabel}
      </Link>
      {isMasterUser ? null : (
        <Link
          to={MASTER_START_PATH}
          className={`${homeOutlineBtn} ${fullWidth ? 'w-full' : 'w-fit'} min-h-12 px-8 text-center text-[15px]`}
        >
          Регистрация мастера
        </Link>
      )}
    </div>
  );

  return (
    <section id="for-masters" className={`${homeSection} scroll-mt-28`} aria-labelledby="home-masters-heading">
      <div className="mx-auto max-w-[40rem] px-1 text-center sm:px-0">
        <h2 id="home-masters-heading" className={homeLandingHeading}>
          Для мастеров
        </h2>
      </div>

      <div className="mt-7 flex flex-col max-lg:gap-1 lg:mt-8 lg:grid lg:grid-cols-12 lg:items-start lg:gap-8">
        <article
          className={`${homeBentoRound} ${homeGraySurface} sticky z-20 mb-4 flex flex-col justify-center p-5 shadow-[0_10px_32px_rgba(17,24,39,0.06)] max-lg:top-[calc(var(--slotty-header-height,4.75rem)+0.75rem)] sm:mb-5 sm:p-6 lg:top-[calc(var(--slotty-header-height,5.5rem)+0.875rem)] lg:z-10 lg:col-span-5 lg:mb-0 lg:self-start lg:p-10 lg:shadow-none`}
        >
          <div
            id={`${activeSlide.id}-panel`}
            aria-live="polite"
            className="min-h-[9.5rem] sm:min-h-[10.5rem] lg:min-h-[11.5rem]"
          >
            <span className={homeStepBadge}>{activeSlide.label}</span>
            <h3 className={homeBentoTitle}>{activeSlide.title}</h3>
            <p className={homeBentoBody}>{activeSlide.text}</p>
          </div>

          <div className="mt-5 hidden sm:mt-6 lg:flex">{ctaBlock(false)}</div>
        </article>

        <div className="flex flex-col gap-5 sm:gap-6 lg:col-span-7">
          {MASTER_SLIDES.map((slide, index) => (
            <MasterSlidePhoto key={slide.id} slide={slide} priority={index === 0} />
          ))}
        </div>

        <div className="mt-6 flex flex-col gap-2.5 lg:col-span-12 lg:hidden">{ctaBlock(true)}</div>
      </div>
    </section>
  );
};
