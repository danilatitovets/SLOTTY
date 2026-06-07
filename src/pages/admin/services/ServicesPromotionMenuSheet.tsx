import type { IconType } from 'react-icons';
import { HiCalendarDays, HiChevronRight, HiPencilSquare, HiTrash } from 'react-icons/hi2';
import { AdminBottomSheet } from '../shared/AdminBottomSheet';
import { AdminFormSheetLayout } from '../shared/AdminFormSheetLayout';
import { catalogSheetSecondaryBtn, catalogSheetTitle } from '../shared/adminCatalogSheetTheme';
import { servicesSheetFormPanel, servicesSheetMenuList, servicesSheetMenuRow } from './adminServicesTheme';
import { ServicesBrandPhotoLayers } from './ServicesBrandPhotoLayers';
import { derivePromotionStatus, promotionStatusLabel } from './servicesFormat';
import type { ServicePromotion, ServicePromotionStatus } from './servicesTypes';

type Props = {
  open: boolean;
  promo: ServicePromotion | null;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

function formatDdMmRu(iso: string): string {
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}

function statusBadgeClass(status: ServicePromotionStatus): string {
  switch (status) {
    case 'active':
      return 'bg-[#ECFDF5] text-[#16A34A]';
    case 'scheduled':
      return 'bg-[#FFF1F4] text-[#F47C8C]';
    case 'finished':
      return 'bg-[#EBEBEB] text-[#6B7280]';
    default:
      return 'bg-[#FFF4E8] text-[#B45309]';
  }
}

function ActionRow({
  label,
  hint,
  icon: Icon,
  onClick,
}: {
  label: string;
  hint?: string;
  icon: IconType;
  onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick} className={servicesSheetMenuRow}>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-white text-[#374151]">
        <Icon className="h-[18px] w-[18px]" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[14px] font-semibold text-[#111827]">{label}</span>
        {hint ? (
          <span className="mt-0.5 block text-[12px] font-medium text-[#6B7280]">{hint}</span>
        ) : null}
      </span>
      <HiChevronRight className="h-4 w-4 shrink-0 text-[#C4C9D1]" aria-hidden />
    </button>
  );
}

function PromoDiscountHero({
  promo,
  onEdit,
}: {
  promo: ServicePromotion;
  onEdit: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onEdit}
      className="relative w-full overflow-hidden rounded-[14px] bg-[#EF4444] px-4 py-4 text-left transition hover:opacity-95 active:scale-[0.99] sm:px-5"
    >
      <ServicesBrandPhotoLayers roundedClassName="rounded-[14px]" />
      <div className="relative z-10">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#111827]/75">
              Скидка
            </span>
            <p className="mt-1 text-[28px] font-black tabular-nums leading-none tracking-[-0.05em] text-[#111827] sm:text-[32px]">
              {promo.discountLabel}
            </p>
            {promo.serviceTitle ? (
              <p className="mt-2 text-[14px] font-semibold text-[#111827]">{promo.serviceTitle}</p>
            ) : null}
            <p className="mt-2 flex items-center gap-1.5 text-[12px] font-medium text-[#111827]/70">
              <HiCalendarDays className="h-4 w-4 shrink-0" aria-hidden />
              {formatDdMmRu(promo.startsAt)} — {formatDdMmRu(promo.endsAt)}
            </p>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1 pt-5 text-[12px] font-semibold text-[#111827]">
            Изменить
            <HiChevronRight className="h-4 w-4" aria-hidden />
          </span>
        </div>
      </div>
    </button>
  );
}

export function ServicesPromotionMenuSheet({ open, promo, onClose, onEdit, onDelete }: Props) {
  if (!promo) return null;

  const status = derivePromotionStatus(promo);

  return (
    <AdminBottomSheet
      variant="catalog"
      open={open}
      onClose={onClose}
      headerContent={
        <div className="min-w-0 pr-2">
          <div className="flex flex-wrap items-center gap-2">
            <h2 id="admin-sheet-title" className={`${catalogSheetTitle} min-w-0 break-words`}>
              {promo.title}
            </h2>
            <span
              className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${statusBadgeClass(status)}`}
            >
              {promotionStatusLabel(status)}
            </span>
          </div>
        </div>
      }
      footer={
        <button type="button" onClick={onClose} className={`${catalogSheetSecondaryBtn} w-full`}>
          Закрыть
        </button>
      }
    >
      <AdminFormSheetLayout>
        <div className="space-y-3">
          <PromoDiscountHero promo={promo} onEdit={onEdit} />

          {promo.description?.trim() ? (
            <section className={servicesSheetFormPanel}>
              <p className="text-[14px] font-bold tracking-[-0.02em] text-[#111827]">Описание</p>
              <p className="mt-2 text-[14px] font-medium leading-relaxed text-[#6B7280]">
                {promo.description.trim()}
              </p>
            </section>
          ) : null}

          <section>
            <p className="mb-2 text-[12px] font-bold uppercase tracking-[0.08em] text-[#9CA3AF]">
              Управление
            </p>
            <div className={`${servicesSheetMenuList} divide-y divide-[#EBEBEB]`}>
              <ActionRow
                label="Редактировать"
                hint="Срок, скидка, текст"
                icon={HiPencilSquare}
                onClick={onEdit}
              />
            </div>
          </section>

          <button
            type="button"
            onClick={onDelete}
            className="flex min-h-10 w-full items-center justify-center gap-2 rounded-[12px] bg-[#FEE2E2] px-4 text-[14px] font-semibold text-[#DC2626] transition hover:bg-[#FECACA] active:scale-[0.98]"
          >
            <HiTrash className="h-4 w-4" aria-hidden />
            Удалить акцию
          </button>
        </div>
      </AdminFormSheetLayout>
    </AdminBottomSheet>
  );
}
