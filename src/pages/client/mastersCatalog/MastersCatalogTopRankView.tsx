import type { ServiceListingRecord } from '../../../features/services/model/demoMasters';
import { MasterSectionRail } from '../components/MasterSectionRail';
import { TopMastersSection } from '../components/TopMastersSection';
import { SkeletonMasterCard } from '../components/SkeletonCards';
import { EmptyState } from '../components/EmptyState';
import { CatalogError } from '../components/CatalogError';
import { CatalogTrustBar } from '../servicesCatalog/CatalogTrustBar';
import { catalogDesktopPanel } from '../servicesCatalog/servicesCatalogTheme';
import { buildMastersTopRankSections } from '../lib/mastersTopRankSections';

type Props = {
  masters: ServiceListingRecord[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  userLat: number | null;
  userLng: number | null;
  variant?: 'mobile' | 'desktop';
};

export function MastersCatalogTopRankView({
  masters,
  loading,
  error,
  onRetry,
  userLat,
  userLng,
  variant = 'desktop',
}: Props) {
  const sections = buildMastersTopRankSections(masters);
  const isDesktop = variant === 'desktop';

  if (loading) {
    return (
      <section className="flex flex-col gap-6">
        <div className="space-y-2">
          <div className="h-7 w-56 animate-pulse rounded bg-[#EBEBEB]" />
          <div className="h-4 w-72 animate-pulse rounded bg-[#EBEBEB]" />
        </div>
        <SkeletonMasterCard />
        <SkeletonMasterCard />
      </section>
    );
  }

  if (error) {
    return (
      <section className={`${catalogDesktopPanel} p-8`}>
        <CatalogError message={error} onRetry={onRetry} />
      </section>
    );
  }

  if (sections.length === 0) {
    return (
      <section className={`${catalogDesktopPanel} p-8`}>
        <EmptyState
          title="Пока мало данных для топа"
          description="Когда мастера наберут отзывы и записи, здесь появятся рейтинги недели и месяца"
          variant="catalog"
        />
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-8 pb-4">
      <header className="min-w-0">
        <h2 className="text-[20px] font-bold tracking-[-0.03em] text-[#111827] lg:text-[22px]">
          Топы мастеров
        </h2>
        <p className="mt-1 text-[14px] leading-relaxed text-[#6B7280]">
          Рейтинги недели, месяца и лучшие мастера Slotty — прокрутите, чтобы увидеть все подборки
        </p>
      </header>

      {sections.map((section) => (
        <div key={section.id} className="flex flex-col gap-4">
          <TopMastersSection
            variant={isDesktop ? 'desktop' : 'mobile'}
            title={section.title}
            subtitle={section.subtitle}
            items={section.items.slice(0, 8)}
            userLat={userLat}
            userLng={userLng}
            showMoreInSection={false}
            forcePodiumLayout
          />

          {section.items.length > 3 ? (
            <MasterSectionRail
              title={`${section.title} — ещё`}
              items={section.items.slice(3)}
              userLat={userLat}
              userLng={userLng}
              inset={!isDesktop}
            />
          ) : null}
        </div>
      ))}

      <CatalogTrustBar />
    </section>
  );
}
