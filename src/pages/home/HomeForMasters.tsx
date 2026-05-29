import { useEffect, type FC } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { MASTER_START_PATH } from '../../app/paths';
import {
  LANDING_MASTERS_TAB_APPOINTMENTS,
  LANDING_MASTERS_TAB_PROFILE,
  LANDING_MASTERS_TAB_SERVICES,
  type LandingMastersTabId,
} from '../../shared/layout/SlottyHeader/headerNav';
import {
  CLIENT_DESKTOP_SHELL_BLEED_CLASS,
  CLIENT_DESKTOP_SHELL_BLEED_PAD_CLASS,
} from '../../shared/layout/clientShellLayout';
import { homeLandingHeading, homePinkBtn, homeSection } from './homeTheme';

const MEDIA_SHELL =
  'flex w-full items-center justify-center overflow-hidden rounded-[24px] bg-[#F0F1F3] p-3 sm:rounded-[28px] sm:p-4';

const MEDIA_FRAME =
  'relative aspect-[9/16] w-full overflow-hidden rounded-[18px] bg-[#F0F1F3] sm:rounded-[20px]';

type MastersBlock = {
  id: LandingMastersTabId;
  title: string;
  text: string;
  videoSrc: string;
  videoLabel: string;
};

const MASTERS_BLOCKS: MastersBlock[] = [
  {
    id: LANDING_MASTERS_TAB_APPOINTMENTS,
    title: 'Создание услуги',
    text: 'Добавляйте услугу в пару шагов: название, цена, длительность и описание.',
    videoSrc: `/video/${encodeURIComponent('Для мастеров')}/${encodeURIComponent('УСЛУГА.MOV')}`,
    videoLabel: 'Видео: создание услуги',
  },
  {
    id: LANDING_MASTERS_TAB_SERVICES,
    title: 'Создание окна',
    text: 'Открывайте свободные окна в расписании на нужные дату и время.',
    videoSrc: `/video/${encodeURIComponent('Для мастеров')}/${encodeURIComponent('ОКНО.MP4')}`,
    videoLabel: 'Видео: создание окна',
  },
  {
    id: LANDING_MASTERS_TAB_PROFILE,
    title: 'Уведомления',
    text: 'Мгновенно получайте уведомления о новых записях и изменениях.',
    videoSrc: `/video/${encodeURIComponent('Для мастеров')}/${encodeURIComponent('УВЕДОМЛЕНИЕ.MOV')}`,
    videoLabel: 'Видео: уведомления мастера',
  },
];

function MastersMediaSlot({ videoSrc, videoLabel }: { videoSrc: string; videoLabel: string }) {
  return (
    <div className={MEDIA_SHELL}>
      <div className={MEDIA_FRAME}>
        <video
          src={videoSrc}
          className="absolute inset-0 h-full w-full scale-[1.02] bg-[#F0F1F3] object-cover object-center"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          aria-label={videoLabel}
        />
      </div>
    </div>
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

  useEffect(() => {
    const hash = location.hash.replace(/^#/, '');
    if (!hash.startsWith('for-masters')) return;

    const frame = window.requestAnimationFrame(() => {
      document.getElementById('for-masters')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });

      const block = document.getElementById(hash);
      block?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [location.hash]);

  return (
    <section
      id="for-masters"
      className={`${homeSection} scroll-mt-28`}
      aria-labelledby="home-masters-heading"
    >
      <div className="text-center">
        <h2 id="home-masters-heading" className={homeLandingHeading}>
          Для мастеров
        </h2>
        <p className="mx-auto mt-4 max-w-[36rem] text-[15px] leading-7 text-[#6B7280] sm:text-[17px]">
          Кабинет, где мастер управляет записями, услугами, графиком и заявками в одном месте.
        </p>
      </div>

      <div
        className={`${CLIENT_DESKTOP_SHELL_BLEED_CLASS} mt-10 mr-[calc(50%-50vw)] overflow-x-auto [scrollbar-width:none] sm:mt-14 md:mr-0 md:overflow-visible [&::-webkit-scrollbar]:hidden`}
      >
        <div
          className={`flex snap-x snap-mandatory gap-4 pb-1 md:grid md:snap-none md:grid-cols-3 md:gap-6 lg:gap-8 ${CLIENT_DESKTOP_SHELL_BLEED_PAD_CLASS}`}
        >
          {MASTERS_BLOCKS.map((block) => (
            <article
              key={block.id}
              id={block.id}
              className="w-[min(17.5rem,78vw)] shrink-0 snap-start scroll-mt-28 md:w-auto"
            >
              <MastersMediaSlot videoSrc={block.videoSrc} videoLabel={block.videoLabel} />
              <h3 className="mt-4 text-center text-[1.05rem] font-bold tracking-[-0.02em] text-[#111827] sm:text-[1.2rem]">
                {block.title}
              </h3>
              <p className="mx-auto mt-2 text-center text-[13px] leading-relaxed text-[#6B7280] sm:text-[15px]">
                {block.text}
              </p>
            </article>
          ))}
        </div>
      </div>

      <div
        className={`mx-auto mt-10 flex max-w-lg gap-2 sm:mt-12 sm:gap-3 ${
          isMasterUser ? 'max-w-md' : ''
        }`}
      >
        {!isMasterUser && (
          <Link
            to={masterCtaPath}
            className={`${homePinkBtn} min-h-12 flex-1 text-center text-[13px] shadow-none sm:text-[14px]`}
          >
            {masterCtaLabel}
          </Link>
        )}
        {!isMasterUser && (
          <Link
            to={MASTER_START_PATH}
            className="inline-flex min-h-12 flex-1 items-center justify-center rounded-full border border-[#E5E7EB] bg-white px-5 text-center text-[13px] font-semibold text-[#374151] transition active:scale-[0.98] sm:text-[14px]"
          >
            Регистрация мастера
          </Link>
        )}
      </div>
    </section>
  );
};
