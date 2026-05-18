import { useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import type { ClientOutletContext } from '../clientOutletContext';
import { ClientPageShell } from '../components/ClientPageShell';
import { ClientSearchBar } from '../components/ClientSearchBar';
import { QuickChips } from '../components/QuickChips';
import { ServiceCategoryRail } from '../components/ServiceCategoryRail';
import { ServiceCard } from '../components/ServiceCard';
import { SectionHeading } from '../components/SectionHeading';
import { GeoPromptCard } from '../components/GeoPromptCard';
import { FilterSheet, FilterChipGroup } from '../components/FilterSheet';
import { SkeletonServiceCard } from '../components/SkeletonCards';
import { EmptyState } from '../components/EmptyState';
import { CatalogError } from '../components/CatalogError';
import { useCatalogData } from '../hooks/useCatalogData';
import { aggregateServicesByCategory } from '../lib/aggregateServices';
import type { CatalogListingsParams } from '../../../features/services/api/catalogListingsApi';
const QUICK_CHIPS = [
  { id: 'today', label: 'Сегодня' },
  { id: 'near', label: 'Рядом' },
  { id: 'promo', label: 'С акциями' },
  { id: 'home', label: 'На дому' },
  { id: 'studio', label: 'В студии' },
] as const;

export function ServicesCatalogPage() {
  const { hasGeo, requestGeo } = useOutletContext<ClientOutletContext>();
  const [search, setSearch] = useState('');
  const [chips, setChips] = useState<Set<string>>(() => new Set());
  const [filterOpen, setFilterOpen] = useState(false);
  const [visitFilter, setVisitFilter] = useState<string | null>(null);
  const [todayOnly, setTodayOnly] = useState(false);
  const [promoOnly, setPromoOnly] = useState(false);

  const apiParams = useMemo((): CatalogListingsParams => {
    const p: CatalogListingsParams = { limit: 80, sortBy: 'recommended' };
    if (search.trim()) p.search = search.trim();
    if (chips.has('today') || todayOnly) p.dateRange = 'today';
    if (chips.has('promo') || promoOnly) p.promotionOnly = true;
    if (chips.has('home') || visitFilter === 'home') p.visitType = 'at_home';
    if (chips.has('studio') || visitFilter === 'studio') p.visitType = 'studio';
    if (chips.has('near') && hasGeo) p.sortBy = 'soonest';
    return p;
  }, [search, chips, todayOnly, promoOnly, visitFilter, hasGeo]);

  const { listings, categories, loading, error, reload } = useCatalogData(apiParams);

  const services = useMemo(
    () => aggregateServicesByCategory(listings, categories),
    [listings, categories],
  );

  const popular = useMemo(() => services.filter((s) => s.badge === 'popular' || s.badge === 'hit').slice(0, 6), [services]);
  const todayServices = useMemo(() => services.filter((s) => s.hasToday).slice(0, 6), [services]);
  const displayList = services;

  const toggleChip = (id: string) => {
    setChips((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      if (id === 'near' && !hasGeo) void requestGeo();
      return next;
    });
  };

  return (
    <ClientPageShell>
      <div className="space-y-4 pb-6">
        <ClientSearchBar
          value={search}
          onChange={setSearch}
          placeholder="Найти услугу или мастера"
          onFilterClick={() => setFilterOpen(true)}
        />

        <QuickChips chips={[...QUICK_CHIPS]} activeIds={chips} onToggle={toggleChip} />

        {!hasGeo ? <GeoPromptCard onAllow={requestGeo} /> : null}

        {loading ? (
          <div className="space-y-3">
            <SkeletonServiceCard />
            <SkeletonServiceCard />
            <SkeletonServiceCard />
          </div>
        ) : error ? (
          <CatalogError message={error} onRetry={() => void reload()} />
        ) : (
          <>
            <section>
              <SectionHeading title="Категории" />
              <ServiceCategoryRail categories={categories} />
            </section>

            {popular.length > 0 ? (
              <section>
                <SectionHeading title="Популярные услуги" />
                <div className="space-y-3">
                  {popular.map((s) => (
                    <ServiceCard key={s.id} service={s} />
                  ))}
                </div>
              </section>
            ) : null}

            {todayServices.length > 0 ? (
              <section>
                <SectionHeading title="Есть окна сегодня" />
                <div className="space-y-3">
                  {todayServices.map((s) => (
                    <ServiceCard key={`today-${s.id}`} service={s} />
                  ))}
                </div>
              </section>
            ) : null}

            <section>
              <SectionHeading title="Все услуги" />
              {displayList.length === 0 ? (
                <EmptyState title="Пока нет доступных услуг" description="Загляните позже — мастера скоро добавят услуги" />
              ) : (
                <div className="space-y-3">
                  {displayList.map((s) => (
                    <ServiceCard key={s.id} service={s} />
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>

      <FilterSheet
        open={filterOpen}
        title="Фильтры услуг"
        onClose={() => setFilterOpen(false)}
        onReset={() => {
          setVisitFilter(null);
          setTodayOnly(false);
          setPromoOnly(false);
        }}
        onApply={() => {
          setFilterOpen(false);
          void reload();
        }}
      >
        <FilterChipGroup
          label="Формат"
          options={[
            { id: 'studio', label: 'В студии' },
            { id: 'home', label: 'На дому' },
          ]}
          value={visitFilter}
          onChange={setVisitFilter}
        />
        <FilterChipGroup
          label="Окна"
          options={[{ id: 'today', label: 'Только сегодня' }]}
          value={todayOnly ? 'today' : null}
          onChange={(id) => setTodayOnly(id === 'today')}
        />
        <FilterChipGroup
          label="Акции"
          options={[{ id: 'promo', label: 'С акциями' }]}
          value={promoOnly ? 'promo' : null}
          onChange={(id) => setPromoOnly(id === 'promo')}
        />
      </FilterSheet>
    </ClientPageShell>
  );
}
