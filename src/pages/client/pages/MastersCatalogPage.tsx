import { useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import type { ClientOutletContext } from '../clientOutletContext';
import { ClientPageShell } from '../components/ClientPageShell';
import { ClientSearchBar } from '../components/ClientSearchBar';
import { QuickChips } from '../components/QuickChips';
import { MasterCard } from '../components/MasterCard';
import { SectionHeading } from '../components/SectionHeading';
import { GeoPromptCard } from '../components/GeoPromptCard';
import { FilterSheet, FilterChipGroup } from '../components/FilterSheet';
import { SkeletonMasterCard } from '../components/SkeletonCards';
import { EmptyState } from '../components/EmptyState';
import { CatalogError } from '../components/CatalogError';
import { useCatalogData } from '../hooks/useCatalogData';
import { groupListingsByMaster, sortMastersByDistance } from '../lib/groupMasters';
import { isSlotToday } from '../lib/catalogFormat';
import type { CatalogListingsParams } from '../../../features/services/api/catalogListingsApi';

const QUICK_CHIPS = [
  { id: 'near', label: 'Рядом' },
  { id: 'today', label: 'Сегодня' },
  { id: 'top', label: 'Топ рейтинг' },
  { id: 'home', label: 'На дому' },
  { id: 'studio', label: 'В студии' },
] as const;

export function MastersCatalogPage() {
  const { hasGeo, requestGeo, userLat, userLng } = useOutletContext<ClientOutletContext>();
  const [search, setSearch] = useState('');
  const [chips, setChips] = useState<Set<string>>(() => new Set());
  const [filterOpen, setFilterOpen] = useState(false);
  const [minRating, setMinRating] = useState<string | null>(null);
  const [visitFilter, setVisitFilter] = useState<string | null>(null);

  const apiParams = useMemo((): CatalogListingsParams => {
    const p: CatalogListingsParams = { limit: 80 };
    if (search.trim()) p.search = search.trim();
    if (chips.has('today')) p.dateRange = 'today';
    if (chips.has('top') || minRating === '48') p.sortBy = 'rating';
    else if (chips.has('near') && hasGeo) p.sortBy = 'soonest';
    else p.sortBy = 'recommended';
    if (chips.has('home') || visitFilter === 'home') p.visitType = 'at_home';
    if (chips.has('studio') || visitFilter === 'studio') p.visitType = 'studio';
    if (minRating === '45') p.minRating = 4.5;
    if (minRating === '48') p.minRating = 4.8;
    return p;
  }, [search, chips, minRating, visitFilter, hasGeo]);

  const { listings, loading, error, reload } = useCatalogData(apiParams);

  const masters = useMemo(() => {
    const grouped = groupListingsByMaster(listings);
    const sorted = sortMastersByDistance(grouped, userLat, userLng);
    if (chips.has('top')) return [...sorted].sort((a, b) => b.rating - a.rating);
    return sorted;
  }, [listings, userLat, userLng, chips]);

  const nearby = useMemo(() => masters.slice(0, 8), [masters]);
  const freeToday = useMemo(() => masters.filter((m) => isSlotToday(m.nextSlotStartsAt)).slice(0, 8), [masters]);
  const top = useMemo(
    () => [...masters].sort((a, b) => b.rating - a.rating || b.reviewsCount - a.reviewsCount).slice(0, 6),
    [masters],
  );
  const newest = useMemo(() => [...masters].slice(-6).reverse(), [masters]);

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
      <div className="space-y-5 pb-6">
        <ClientSearchBar
          value={search}
          onChange={setSearch}
          placeholder="Найти мастера или услугу"
          onFilterClick={() => setFilterOpen(true)}
        />

        <QuickChips chips={[...QUICK_CHIPS]} activeIds={chips} onToggle={toggleChip} />

        {!hasGeo ? <GeoPromptCard onAllow={requestGeo} /> : null}

        {loading ? (
          <div className="space-y-3">
            <SkeletonMasterCard />
            <SkeletonMasterCard />
          </div>
        ) : error ? (
          <CatalogError message={error} onRetry={() => void reload()} />
        ) : masters.length === 0 ? (
          <EmptyState
            title="Мастеров пока нет"
            description="Попробуйте изменить фильтры или зайдите позже"
          />
        ) : (
          <>
            <section>
              <SectionHeading title="Мастера рядом" />
              {nearby.length === 0 ? (
                <EmptyState
                  title="Рядом ничего не найдено"
                  description="Попробуйте изменить фильтры или укажите район"
                />
              ) : (
                <div className="space-y-3">
                  {nearby.map((m) => (
                    <MasterCard key={m.masterId} listing={m} userLat={userLat} userLng={userLng} />
                  ))}
                </div>
              )}
            </section>

            {freeToday.length > 0 ? (
              <section>
                <SectionHeading title="Свободны сегодня" />
                <div className="space-y-3">
                  {freeToday.map((m) => (
                    <MasterCard key={`free-${m.masterId}`} listing={m} userLat={userLat} userLng={userLng} />
                  ))}
                </div>
              </section>
            ) : null}

            <section>
              <SectionHeading title="Топ мастера" />
              <div className="space-y-3">
                {top.map((m) => (
                  <MasterCard key={`top-${m.masterId}`} listing={m} userLat={userLat} userLng={userLng} />
                ))}
              </div>
            </section>

            {newest.length > 0 ? (
              <section>
                <SectionHeading title="Новые мастера" />
                <div className="space-y-3">
                  {newest.map((m) => (
                    <MasterCard key={`new-${m.masterId}`} listing={m} userLat={userLat} userLng={userLng} />
                  ))}
                </div>
              </section>
            ) : null}
          </>
        )}
      </div>

      <FilterSheet
        open={filterOpen}
        title="Фильтры мастеров"
        onClose={() => setFilterOpen(false)}
        onReset={() => {
          setMinRating(null);
          setVisitFilter(null);
        }}
        onApply={() => {
          setFilterOpen(false);
          void reload();
        }}
      >
        <FilterChipGroup
          label="Рейтинг"
          options={[
            { id: '45', label: 'от 4.5' },
            { id: '48', label: 'от 4.8' },
          ]}
          value={minRating}
          onChange={setMinRating}
        />
        <FilterChipGroup
          label="Формат"
          options={[
            { id: 'studio', label: 'В студии' },
            { id: 'home', label: 'На дому' },
          ]}
          value={visitFilter}
          onChange={setVisitFilter}
        />
      </FilterSheet>
    </ClientPageShell>
  );
}
