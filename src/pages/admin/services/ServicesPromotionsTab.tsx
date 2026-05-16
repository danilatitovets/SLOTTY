import { useMemo, useState } from 'react';
import { HiCheck, HiFunnel, HiReceiptPercent } from 'react-icons/hi2';
import { AdminBottomSheet } from '../shared/AdminBottomSheet';
import {
  servicesCard,
  servicesChipActive,
  servicesIconCircle,
  servicesPinkBtn,
} from './adminServicesTheme';
import { PromotionBannerCard } from './PromotionBannerCard';
import type { ManagedService } from './servicesFormat';
import { derivePromotionStatus } from './servicesFormat';
import { normalizePromotion } from './promotionNormalize';
import type { ServicePromotion, ServicePromotionStatus } from './servicesTypes';
import { ServicesPromotionMenuSheet } from './ServicesPromotionMenuSheet';

type PromoFilter = 'all' | ServicePromotionStatus;

type Props = {
  services: ManagedService[];
  promotions: ServicePromotion[];
  onCreate: () => void;
  onEdit: (promo: ServicePromotion) => void;
  onDelete: (id: string) => void;
};

const FILTER_OPTIONS: Array<{ id: PromoFilter; label: string; hint: string }> = [
  { id: 'all', label: 'Все', hint: 'Показать все акции' },
  { id: 'active', label: 'Активные', hint: 'Сейчас действуют' },
  { id: 'scheduled', label: 'Запланированные', hint: 'Начнутся позже' },
  { id: 'finished', label: 'Завершённые', hint: 'Срок акции истёк' },
  { id: 'draft', label: 'Черновики', hint: 'Ещё не опубликованы' },
];

export function ServicesPromotionsTab({ services, promotions, onCreate, onEdit, onDelete }: Props) {
  const [filter, setFilter] = useState<PromoFilter>('all');
  const [filterOpen, setFilterOpen] = useState(false);
  const [menuPromo, setMenuPromo] = useState<ServicePromotion | null>(null);

  const rows = useMemo(() => {
    return promotions
      .map((p) => {
        const normalized = normalizePromotion(p);
        const serviceTitle =
          normalized.serviceTitle ||
          services.find((s) => s.id === normalized.serviceId)?.title ||
          '';
        return {
          ...normalized,
          serviceTitle,
          status: derivePromotionStatus(normalized),
        };
      })
      .filter((p) => filter === 'all' || p.status === filter)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [filter, promotions, services]);

  const activeFilterLabel = FILTER_OPTIONS.find((o) => o.id === filter)?.label ?? 'Все';
  const filterIsActive = filter !== 'all';

  const pickFilter = (id: PromoFilter) => {
    setFilter(id);
    setFilterOpen(false);
  };

  return (
    <div className="space-y-4 pb-2">
      <div className="flex gap-2">
        <button type="button" onClick={onCreate} className={`${servicesPinkBtn} min-w-0 flex-1`}>
          + Создать акцию
        </button>
        <button
          type="button"
          onClick={() => setFilterOpen(true)}
          className={`relative flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] border transition active:scale-[0.96] ${
            filterIsActive
              ? 'border-[#FDE8ED] bg-[#FFF1F4] text-[#F47C8C] shadow-[inset_0_0_0_1px_rgba(244,124,140,0.12)]'
              : 'border-[#EAECEF] bg-white text-[#6B7280]'
          }`}
          aria-label={`Фильтры: ${activeFilterLabel}`}
          aria-expanded={filterOpen}
        >
          <HiFunnel className="h-5 w-5" aria-hidden />
          {filterIsActive ? (
            <span
              className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#F47C8C]"
              aria-hidden
            />
          ) : null}
        </button>
      </div>

      {rows.length === 0 ? (
        <div className={`${servicesCard} p-6 text-center`}>
          <span className={`${servicesIconCircle} mx-auto h-16 w-16 rounded-[22px]`}>
            <HiReceiptPercent className="h-8 w-8" aria-hidden />
          </span>
          <h3 className="mt-4 text-[18px] font-bold tracking-[-0.04em] text-[#111827]">
            {promotions.length === 0 ? 'Акций пока нет' : 'Ничего не найдено'}
          </h3>
          <p className="mx-auto mt-2 max-w-[18rem] text-[13px] leading-relaxed text-[#6B7280]">
            {promotions.length === 0
              ? 'Создайте первую акцию, чтобы привлечь клиентов'
              : 'Попробуйте другой фильтр'}
          </p>
          {promotions.length === 0 ? (
            <button type="button" onClick={onCreate} className={`${servicesPinkBtn} mt-5`}>
              Создать акцию
            </button>
          ) : null}
        </div>
      ) : (
        <ul className="space-y-3.5">
          {rows.map((promo) => (
            <li key={promo.id}>
              <PromotionBannerCard promo={promo} onMenu={() => setMenuPromo(promo)} />
            </li>
          ))}
        </ul>
      )}

      <AdminBottomSheet open={filterOpen} onClose={() => setFilterOpen(false)} title="Фильтр">
        <div className="space-y-2 pb-2">
          {FILTER_OPTIONS.map((option) => {
            const selected = filter === option.id;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => pickFilter(option.id)}
                className={`flex w-full items-center gap-3 rounded-[18px] border px-4 py-3.5 text-left transition active:scale-[0.98] ${
                  selected
                    ? servicesChipActive
                    : 'border-[#EAECEF] bg-white hover:border-[#FDE8ED] hover:bg-[#FAFAFA]'
                }`}
              >
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] font-bold text-[#111827]">{option.label}</span>
                  <span className="mt-0.5 block text-[12px] font-medium text-[#9CA3AF]">{option.hint}</span>
                </span>
                {selected ? (
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#F47C8C] text-white">
                    <HiCheck className="h-5 w-5" aria-hidden />
                  </span>
                ) : (
                  <span className="h-8 w-8 shrink-0 rounded-full border border-[#EAECEF] bg-[#FAFAFA]" aria-hidden />
                )}
              </button>
            );
          })}
        </div>
      </AdminBottomSheet>

      <ServicesPromotionMenuSheet
        open={Boolean(menuPromo)}
        promo={menuPromo}
        onClose={() => setMenuPromo(null)}
        onEdit={() => {
          if (menuPromo) onEdit(menuPromo);
          setMenuPromo(null);
        }}
        onDelete={() => {
          if (menuPromo) onDelete(menuPromo.id);
          setMenuPromo(null);
        }}
      />
    </div>
  );
}
