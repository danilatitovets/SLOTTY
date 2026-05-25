import { ADMIN_TAB_INTRO_HEIGHT_CLASS } from '../AdminTabIntroBanner';
import type { OverviewAnalyticsTab } from './overviewAnalytics';
import { OVERVIEW_CLIENTS_FOOTER_SRC, overviewSvodkaPhotoSrc } from './adminOverviewTheme';

export const OVERVIEW_TAB_INTRO_IMAGES = [
  overviewSvodkaPhotoSrc('обзор.webp'),
  overviewSvodkaPhotoSrc('доход.webp'),
  overviewSvodkaPhotoSrc('клиенты.webp'),
  overviewSvodkaPhotoSrc('репутация.webp'),
  OVERVIEW_CLIENTS_FOOTER_SRC,
] as const;

const OVERVIEW_TAB_INTRO: Record<OverviewAnalyticsTab, { title: string }> = {
  summary: { title: 'Обзор' },
  revenue: { title: 'Доход' },
  clients: { title: 'Клиенты' },
  reputation: { title: 'Репутация' },
};

const SLOTTY_GRADIENT =
  'bg-gradient-to-br from-[#111827] via-[#2b2430] to-[#ff5f7a]';

type Props = {
  tab: OverviewAnalyticsTab;
};

export function OverviewTabIntro({ tab }: Props) {
  const { title } = OVERVIEW_TAB_INTRO[tab];

  return (
    <div className="pb-4" role="region" aria-label={title}>
      <div
        className={`relative ${ADMIN_TAB_INTRO_HEIGHT_CLASS} overflow-hidden rounded-[22px] ${SLOTTY_GRADIENT}`}
      >
        <div
          className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-[#ff8aa0]/35 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-16 -left-12 h-32 w-32 rounded-full bg-[#ff5f7a]/20 blur-3xl"
          aria-hidden
        />
        <div
          className={`relative flex ${ADMIN_TAB_INTRO_HEIGHT_CLASS} items-center justify-center px-6`}
        >
          <h2 className="text-center text-[22px] font-black leading-tight tracking-[-0.05em] text-white">
            {title}
          </h2>
        </div>
      </div>
    </div>
  );
}
