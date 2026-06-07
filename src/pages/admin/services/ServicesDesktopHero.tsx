import type { ReactNode } from 'react';
import {
  HiChevronDown,
  HiClipboardDocumentList,
  HiEye,
  HiEyeSlash,
  HiGift,
  HiReceiptPercent,
  HiScissors,
  HiSquares2X2,
  HiWallet,
} from 'react-icons/hi2';
import { OverviewKpiCarousel, OverviewKpiStatCard } from '../overview/OverviewKpiBlocks';
import {
  formatOptionalByn,
  formatOptionalPriceRange,
} from '../../../shared/lib/emptyDisplayText';
import { servicesDesktopCard, SERVICES_HERO_BG } from './adminServicesTheme';
import type { ServicesTabMetrics } from './servicesTabMetrics';
import type { ServicesTabId } from './servicesTypes';

type Props = {
  tab: ServicesTabId;
  metrics: ServicesTabMetrics;
  /** Free: на вкладках наборов/акций — без счётчиков «0 активных», только пояснение Pro. */
  extrasLocked?: boolean;
  onCollapse?: () => void;
};

export type ServicesHeroSummary = {
  badge: string;
  value: string;
  subtitle: string;
  icon: ReactNode;
};

export function servicesHeroSummary(
  tab: ServicesTabId,
  metrics: ServicesTabMetrics,
): ServicesHeroSummary {
  switch (tab) {
    case 'price': {
      const m = metrics.price;
      return {
        badge: 'Прайс-лист',
        value: m.avgPrice > 0 ? `${m.avgPrice} BYN` : '0 BYN',
        subtitle: 'Средняя цена по каталогу',
        icon: <HiClipboardDocumentList className="h-4 w-4" aria-hidden />,
      };
    }
    case 'bundles': {
      const m = metrics.bundles;
      return {
        badge: 'Наборы услуг',
        value: String(m.total),
        subtitle: m.total === 1 ? '1 набор' : `${m.total} наборов`,
        icon: <HiGift className="h-4 w-4" aria-hidden />,
      };
    }
    case 'promotions': {
      const m = metrics.promotions;
      return {
        badge: 'Акции',
        value: String(m.active),
        subtitle: 'Активных акций сейчас',
        icon: <HiReceiptPercent className="h-4 w-4" aria-hidden />,
      };
    }
    default: {
      const m = metrics.catalog;
      return {
        badge: 'Каталог услуг',
        value: String(m.total),
        subtitle: m.total === 1 ? '1 услуга в каталоге' : `${m.total} услуг в каталоге`,
        icon: <HiSquares2X2 className="h-4 w-4" aria-hidden />,
      };
    }
  }
}

function HeroShell({
  children,
  hero,
  onCollapse,
}: {
  children: ReactNode;
  hero: ReactNode;
  onCollapse?: () => void;
}) {
  return (
    <div className={`overflow-hidden ${servicesDesktopCard}`}>
      {hero}
      <div className="bg-white px-3 pb-3 pt-0 sm:px-4">
        {children}
        {onCollapse ? (
          <button
            type="button"
            onClick={onCollapse}
            className="mt-2 flex w-full min-h-10 items-center justify-center gap-1.5 rounded-[12px] bg-[#F6F7FB] text-[13px] font-semibold text-[#6B7280] transition hover:bg-[#F1EFEF] hover:text-[#111827] active:scale-[0.99]"
          >
            <HiChevronDown className="h-4 w-4 rotate-180" aria-hidden />
            Свернуть сводку
          </button>
        ) : null}
      </div>
    </div>
  );
}

function HeroBlock({
  badgeIcon,
  badge,
  value,
  subtitle,
  description,
  action,
}: {
  badgeIcon: ReactNode;
  badge: string;
  value: string;
  subtitle: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <section className="relative overflow-hidden p-4 text-white sm:p-4 lg:p-5">
      <div
        className="pointer-events-none absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${SERVICES_HERO_BG})` }}
        aria-hidden
      />
      <div className="pointer-events-none absolute inset-0 bg-black/40" aria-hidden />

      <div className="relative min-w-0">
        <p className="inline-flex items-center gap-1.5 rounded-full bg-white/12 px-2.5 py-1 text-[11px] font-bold text-white sm:text-[12px]">
          {badgeIcon}
          {badge}
        </p>

        <p className="mt-2.5 text-[28px] font-black leading-none tabular-nums tracking-[-0.06em] text-white sm:text-[32px] lg:text-[38px]">
          {value}
        </p>

        <p className="mt-1 text-[12px] font-semibold text-white/85 sm:text-[13px]">{subtitle}</p>

        <p className="mt-1.5 line-clamp-2 max-w-[520px] text-[12px] font-medium leading-snug text-white/78 lg:text-[13px]">
          {description}
        </p>

        {action ? <div className="mt-2.5">{action}</div> : null}
      </div>
    </section>
  );
}

function CatalogHero({
  metrics,
  onCollapse,
}: {
  metrics: ServicesTabMetrics['catalog'];
  onCollapse?: () => void;
}) {
  const m = metrics;

  return (
    <HeroShell
      onCollapse={onCollapse}
      hero={
        <HeroBlock
          badgeIcon={<HiSquares2X2 className="h-3.5 w-3.5" aria-hidden />}
          badge="Каталог услуг"
          value={String(m.total)}
          subtitle={m.total === 1 ? '1 услуга в каталоге' : `${m.total} услуг в каталоге`}
          description="Добавляйте услуги, настраивайте цену и видимость — клиенты увидят их при записи и в поиске."
        />
      }
    >
      <OverviewKpiCarousel>
        <OverviewKpiStatCard
          compact
          surface="carousel"
          label="Всего"
          value={String(m.total)}
          hint="Позиций в каталоге"
          icon={<HiScissors className="h-4 w-4" aria-hidden />}
        />
        <OverviewKpiStatCard
          compact
          surface="carousel"
          label="Видимые"
          value={String(m.visible)}
          hint="Открыты для записи"
          icon={<HiEye className="h-4 w-4" aria-hidden />}
        />
        <OverviewKpiStatCard
          compact
          surface="carousel"
          label="Скрытые"
          value={String(m.hidden)}
          hint="Не показываются клиентам"
          icon={<HiEyeSlash className="h-4 w-4" aria-hidden />}
        />
        <OverviewKpiStatCard
          compact
          surface="carousel"
          label="Средняя"
          value={formatOptionalByn(m.avgPrice)}
          hint="Цена по каталогу"
          icon={<HiWallet className="h-4 w-4" aria-hidden />}
        />
      </OverviewKpiCarousel>
    </HeroShell>
  );
}

function PriceHero({
  metrics,
  onCollapse,
}: {
  metrics: ServicesTabMetrics['price'];
  onCollapse?: () => void;
}) {
  const m = metrics;
  const range = formatOptionalPriceRange(m.minPrice, m.maxPrice, m.total);

  return (
    <HeroShell
      onCollapse={onCollapse}
      hero={
        <HeroBlock
          badgeIcon={<HiClipboardDocumentList className="h-3.5 w-3.5" aria-hidden />}
          badge="Прайс-лист"
          value={m.avgPrice > 0 ? `${m.avgPrice} BYN` : '0 BYN'}
          subtitle="Средняя цена по каталогу"
          description="Быстро меняйте цену и длительность — клиенты сразу увидят обновления при записи."
        />
      }
    >
      <OverviewKpiCarousel>
        <OverviewKpiStatCard
          compact
          surface="carousel"
          label="Всего"
          value={String(m.total)}
          hint="Позиций в прайсе"
          icon={<HiScissors className="h-4 w-4" aria-hidden />}
        />
        <OverviewKpiStatCard
          compact
          surface="carousel"
          label="Средняя"
          value={formatOptionalByn(m.avgPrice)}
          hint="По каталогу"
          icon={<HiWallet className="h-4 w-4" aria-hidden />}
        />
        <OverviewKpiStatCard
          compact
          surface="carousel"
          label="Видимых"
          value={String(m.visible)}
          hint="Открыты для записи"
          icon={<HiEye className="h-4 w-4" aria-hidden />}
        />
        <OverviewKpiStatCard
          compact
          surface="carousel"
          label="Диапазон"
          value={range}
          hint="Минимум и максимум"
          icon={<HiClipboardDocumentList className="h-4 w-4" aria-hidden />}
        />
      </OverviewKpiCarousel>
    </HeroShell>
  );
}

function BundlesHero({
  metrics,
  onCollapse,
}: {
  metrics: ServicesTabMetrics['bundles'];
  onCollapse?: () => void;
}) {
  const m = metrics;

  return (
    <HeroShell
      onCollapse={onCollapse}
      hero={
        <HeroBlock
          badgeIcon={<HiGift className="h-3.5 w-3.5" aria-hidden />}
          badge="Наборы услуг"
          value={String(m.total)}
          subtitle={m.total === 1 ? '1 набор' : `${m.total} наборов`}
          description="Соберите несколько услуг в одно предложение со скидкой — клиент видит выгоду, вы повышаете средний чек."
        />
      }
    >
      <OverviewKpiCarousel>
        <OverviewKpiStatCard
          compact
          surface="carousel"
          label="Всего"
          value={String(m.total)}
          hint="Наборов создано"
          icon={<HiGift className="h-4 w-4" aria-hidden />}
        />
        <OverviewKpiStatCard
          compact
          surface="carousel"
          label="Опубликовано"
          value={String(m.published)}
          hint="Видны клиентам"
          icon={<HiEye className="h-4 w-4" aria-hidden />}
        />
        <OverviewKpiStatCard
          compact
          surface="carousel"
          label="Черновики"
          value={String(m.drafts)}
          hint="Ещё не опубликованы"
          icon={<HiEyeSlash className="h-4 w-4" aria-hidden />}
        />
        <OverviewKpiStatCard
          compact
          surface="carousel"
          label="В каталоге"
          value={String(m.catalogServices)}
          hint="Услуг для наборов"
          icon={<HiScissors className="h-4 w-4" aria-hidden />}
        />
      </OverviewKpiCarousel>
    </HeroShell>
  );
}

function PromotionsHero({
  metrics,
  onCollapse,
}: {
  metrics: ServicesTabMetrics['promotions'];
  onCollapse?: () => void;
}) {
  const m = metrics;

  return (
    <HeroShell
      onCollapse={onCollapse}
      hero={
        <HeroBlock
          badgeIcon={<HiReceiptPercent className="h-3.5 w-3.5" aria-hidden />}
          badge="Акции"
          value={String(m.active)}
          subtitle="Активных акций сейчас"
          description="Запускайте скидки и спецпредложения с датами начала и окончания — они показываются в каталоге и при записи."
        />
      }
    >
      <OverviewKpiCarousel>
        <OverviewKpiStatCard
          compact
          surface="carousel"
          label="Всего"
          value={String(m.total)}
          hint="Все акции"
          icon={<HiReceiptPercent className="h-4 w-4" aria-hidden />}
        />
        <OverviewKpiStatCard
          compact
          surface="carousel"
          label="Активные"
          value={String(m.active)}
          hint="Действуют сейчас"
          icon={<HiEye className="h-4 w-4" aria-hidden />}
        />
        <OverviewKpiStatCard
          compact
          surface="carousel"
          label="Запланированные"
          value={String(m.scheduled)}
          hint="Скоро начнутся"
          icon={<HiClipboardDocumentList className="h-4 w-4" aria-hidden />}
        />
        <OverviewKpiStatCard
          compact
          surface="carousel"
          label="Черновики"
          value={String(m.drafts)}
          hint="Не опубликованы"
          icon={<HiEyeSlash className="h-4 w-4" aria-hidden />}
        />
      </OverviewKpiCarousel>
    </HeroShell>
  );
}

export function ServicesDesktopHero({
  tab,
  metrics,
  extrasLocked = false,
  onCollapse,
}: Props) {
  if (extrasLocked && (tab === 'bundles' || tab === 'promotions')) {
    return null;
  }

  switch (tab) {
    case 'price':
      return <PriceHero metrics={metrics.price} onCollapse={onCollapse} />;
    case 'bundles':
      return <BundlesHero metrics={metrics.bundles} onCollapse={onCollapse} />;
    case 'promotions':
      return <PromotionsHero metrics={metrics.promotions} onCollapse={onCollapse} />;
    default:
      return <CatalogHero metrics={metrics.catalog} onCollapse={onCollapse} />;
  }
}
