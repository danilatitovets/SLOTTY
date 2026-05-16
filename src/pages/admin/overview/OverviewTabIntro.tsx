import type { OverviewAnalyticsTab } from './overviewAnalytics';
import { overviewSvodkaPhotoSrc } from './adminOverviewTheme';

const OVERVIEW_TAB_INTRO: Record<
  OverviewAnalyticsTab,
  { title: string; description: string; imageSrc: string; surfaceClass: string }
> = {
  summary: {
    title: 'Обзор',
    description: 'Ключевые показатели, ближайшая запись и динамика записей за выбранный период.',
    imageSrc: overviewSvodkaPhotoSrc('обзор.webp'),
    surfaceClass: 'bg-gradient-to-br from-[#FFF5F8] via-[#FFFBFC] to-[#FFEEF2]',
  },
  revenue: {
    title: 'Доход',
    description: 'Сумма заработка, график по дням, средний чек и оплаченные записи.',
    imageSrc: overviewSvodkaPhotoSrc('доход.webp'),
    surfaceClass: 'bg-gradient-to-br from-[#ECFDF5] via-[#F6FEF9] to-[#E8FAF0]',
  },
  clients: {
    title: 'Клиенты',
    description: 'Новые и повторные визиты, динамика аудитории и доля постоянных клиентов.',
    imageSrc: overviewSvodkaPhotoSrc('клиенты.webp'),
    surfaceClass: 'bg-gradient-to-br from-[#F5F3FF] via-[#FAF8FF] to-[#EDE9FE]',
  },
  reputation: {
    title: 'Репутация',
    description: 'Средний рейтинг, отзывы клиентов и ответы — всё, что влияет на доверие.',
    imageSrc: overviewSvodkaPhotoSrc('репутация.webp'),
    surfaceClass: 'bg-gradient-to-br from-[#FFFBEB] via-[#FFFEF5] to-[#FEF3C7]',
  },
};

type Props = {
  tab: OverviewAnalyticsTab;
};

export function OverviewTabIntro({ tab }: Props) {
  const { title, description, imageSrc, surfaceClass } = OVERVIEW_TAB_INTRO[tab];

  return (
    <div
      className={`relative overflow-hidden rounded-[22px] p-4 ${surfaceClass}`}
      role="region"
      aria-label={title}
    >
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold uppercase tracking-[0.06em] text-[#9CA3AF]">Раздел</p>
          <h2 className="mt-1 text-[18px] font-bold tracking-[-0.04em] text-[#111827]">{title}</h2>
          <p className="mt-1.5 text-[13px] leading-relaxed text-[#6B7280]">{description}</p>
        </div>

        <img
          src={imageSrc}
          alt=""
          width={104}
          height={88}
          decoding="async"
          className="h-[5.25rem] w-[5.25rem] shrink-0 object-contain object-bottom sm:h-[5.5rem] sm:w-[5.5rem]"
        />
      </div>
    </div>
  );
}
