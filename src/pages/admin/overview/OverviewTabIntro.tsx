import type { OverviewAnalyticsTab } from './overviewAnalytics';
import { overviewSvodkaPhotoSrc } from './adminOverviewTheme';

const OVERVIEW_TAB_INTRO: Record<
  OverviewAnalyticsTab,
  { title: string; description: string; imageSrc: string; overlayClass: string }
> = {
  summary: {
    title: 'Обзор',
    description: 'Ключевые показатели, ближайшая запись и динамика записей за выбранный период.',
    imageSrc: overviewSvodkaPhotoSrc('обзор.webp'),
    overlayClass:
      'bg-gradient-to-r from-[#111827]/90 via-[#111827]/72 to-[#111827]/35',
  },
  revenue: {
    title: 'Доход',
    description: 'Сумма заработка, график по дням, средний чек и оплаченные записи.',
    imageSrc: overviewSvodkaPhotoSrc('доход.webp'),
    overlayClass:
      'bg-gradient-to-r from-[#111827]/90 via-[#0f2922]/75 to-[#111827]/30',
  },
  clients: {
    title: 'Клиенты',
    description: 'Новые и повторные визиты, динамика аудитории и доля постоянных клиентов.',
    imageSrc: overviewSvodkaPhotoSrc('клиенты.webp'),
    overlayClass:
      'bg-gradient-to-r from-[#111827]/90 via-[#1e1b4b]/72 to-[#111827]/30',
  },
  reputation: {
    title: 'Репутация',
    description: 'Средний рейтинг, отзывы клиентов и ответы — всё, что влияет на доверие.',
    imageSrc: overviewSvodkaPhotoSrc('репутация.webp'),
    overlayClass:
      'bg-gradient-to-r from-[#111827]/90 via-[#292524]/72 to-[#111827]/30',
  },
};

type Props = {
  tab: OverviewAnalyticsTab;
};

export function OverviewTabIntro({ tab }: Props) {
  const { title, description, imageSrc, overlayClass } = OVERVIEW_TAB_INTRO[tab];

  return (
    <div
      className="relative min-h-[7.75rem] overflow-hidden rounded-[22px]"
      role="region"
      aria-label={title}
    >
      <img
        src={imageSrc}
        alt=""
        className="absolute inset-0 h-full w-full object-cover object-center"
        decoding="async"
      />
      <div className={`absolute inset-0 ${overlayClass}`} aria-hidden />
      <div className="relative flex min-h-[7.75rem] flex-col justify-end p-4">
        <p className="text-[11px] font-bold uppercase tracking-[0.06em] text-white/75">Раздел</p>
        <h2 className="mt-1 text-[18px] font-bold tracking-[-0.04em] text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.45)]">
          {title}
        </h2>
        <p className="mt-1.5 max-w-[20rem] text-[13px] leading-relaxed text-white/90 drop-shadow-[0_1px_6px_rgba(0,0,0,0.4)]">
          {description}
        </p>
      </div>
    </div>
  );
}
