import { useMemo, useState } from 'react';
import { Link, useOutletContext, useParams } from 'react-router-dom';
import { HiArrowLeft } from 'react-icons/hi2';
import type { ClientOutletContext } from '../clientOutletContext';
import { ClientPageShell } from '../components/ClientPageShell';
import { MasterCard } from '../components/MasterCard';
import { QuickChips } from '../components/QuickChips';
import { SkeletonMasterCard } from '../components/SkeletonCards';
import { EmptyState } from '../components/EmptyState';
import { CatalogError } from '../components/CatalogError';
import { useCatalogData } from '../hooks/useCatalogData';
import { SERVICES_PATH } from '../../../app/paths';
import { groupListingsByMaster, sortMastersByDistance } from '../lib/groupMasters';
import type { CatalogListingsParams } from '../../../features/services/api/catalogListingsApi';

const FILTER_CHIPS = [
  { id: 'today', label: 'Сегодня' },
  { id: 'tomorrow', label: 'Завтра' },
  { id: 'near', label: 'Рядом' },
  { id: 'rating', label: 'Рейтинг' },
  { id: 'price', label: 'Цена' },
] as const;

export function ServiceCategoryPage() {
  const { categoryCode } = useParams<{ categoryCode: string }>();
  const { userLat, userLng, hasGeo, requestGeo } = useOutletContext<ClientOutletContext>();
  const [chips, setChips] = useState<Set<string>>(() => new Set());

  const apiParams = useMemo((): CatalogListingsParams => {
    const p: CatalogListingsParams = {
      limit: 80,
      category: categoryCode,
    };
    if (chips.has('today')) p.dateRange = 'today';
    if (chips.has('tomorrow')) p.dateRange = 'tomorrow';
    if (chips.has('rating')) p.sortBy = 'rating';
    if (chips.has('price')) p.sortBy = 'price_asc';
    if (chips.has('near') && hasGeo) p.sortBy = 'soonest';
    return p;
  }, [categoryCode, chips, hasGeo]);

  const { listings, categories, loading, error, reload } = useCatalogData(apiParams);

  const categoryName =
    categories.find((c) => c.code === categoryCode)?.name ?? categoryCode ?? 'Услуга';

  const masters = useMemo(
    () => sortMastersByDistance(groupListingsByMaster(listings), userLat, userLng),
    [listings, userLat, userLng],
  );

  const minPrice = useMemo(() => {
    const prices = listings.map((l) => l.priceFrom).filter((p) => p > 0);
    return prices.length ? Math.min(...prices) : null;
  }, [listings]);

  const toggleChip = (id: string) => {
    setChips((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      if (id === 'near' && !hasGeo) requestGeo();
      return next;
    });
  };

  return (
    <ClientPageShell>
      <Link
        to={SERVICES_PATH}
        className="mb-4 inline-flex items-center gap-1 text-[14px] font-semibold text-[#6B7280]"
      >
        <HiArrowLeft className="h-4 w-4" aria-hidden />
        Услуги
      </Link>

      <h1 className="text-[32px] font-semibold leading-tight tracking-tight text-[#111827]">
        {categoryName}
      </h1>
      <p className="mt-2 text-[15px] leading-snug text-[#6B7280]">
        Мастера, которые делают «{categoryName}».{' '}
        {minPrice != null ? `Цены от ${Math.round(minPrice)} BYN.` : ''}
      </p>

      <div className="mt-4">
        <QuickChips chips={[...FILTER_CHIPS]} activeIds={chips} onToggle={toggleChip} />
      </div>

      <div className="mt-6 space-y-3">
        {loading ? (
          <>
            <SkeletonMasterCard />
            <SkeletonMasterCard />
          </>
        ) : error ? (
          <CatalogError message={error} onRetry={() => void reload()} />
        ) : masters.length === 0 ? (
          <EmptyState
            title="Мастеров по этой услуге пока нет"
            description="Попробуйте другую категорию или снимите фильтры"
          />
        ) : (
          masters.map((m) => (
            <MasterCard key={m.masterId} listing={m} userLat={userLat} userLng={userLng} compact />
          ))
        )}
      </div>
    </ClientPageShell>
  );
}
