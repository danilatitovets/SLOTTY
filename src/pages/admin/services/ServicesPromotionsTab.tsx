import { useMemo, useState } from 'react';
import { HiReceiptPercent } from 'react-icons/hi2';
import {
  servicesCard,
  servicesChip,
  servicesChipActive,
  servicesChipIdle,
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

const FILTER_CHIPS: Array<{ id: PromoFilter; label: string }> = [
  { id: 'all', label: 'Все' },
  { id: 'active', label: 'Активные' },
  { id: 'scheduled', label: 'Запланированные' },
  { id: 'finished', label: 'Завершённые' },
  { id: 'draft', label: 'Черновики' },
];

export function ServicesPromotionsTab({ services, promotions, onCreate, onEdit, onDelete }: Props) {
  const [filter, setFilter] = useState<PromoFilter>('all');
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

  return (
    <div className="space-y-4 pb-2">
      <button type="button" onClick={onCreate} className={servicesPinkBtn}>
        + Создать акцию
      </button>

      <div className="flex gap-2">
        <div className="flex min-w-0 flex-1 gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {FILTER_CHIPS.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setFilter(c.id)}
              className={`${servicesChip} ${filter === c.id ? servicesChipActive : servicesChipIdle}`}
            >
              {c.label}
            </button>
          ))}
        </div>
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

      <div className={`${servicesCard} flex gap-3.5 border-[#FDE8ED] bg-gradient-to-br from-[#FFF9FB] to-white p-4`}>
        <span className={`${servicesIconCircle} h-11 w-11 shrink-0 rounded-[14px]`}>
          <HiReceiptPercent className="h-5 w-5" aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="text-[15px] font-bold leading-snug text-[#111827]">
            Акции помогают заполнять свободные окна
          </p>
          <p className="mt-1.5 text-[13px] leading-relaxed text-[#6B7280]">
            Создавайте предложения на определённый срок и продвигайте нужные услуги
          </p>
        </div>
      </div>

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
