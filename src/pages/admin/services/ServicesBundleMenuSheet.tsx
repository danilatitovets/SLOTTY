import type { IconType } from 'react-icons';
import { HiCheck, HiPencilSquare, HiTrash } from 'react-icons/hi2';
import { AdminBottomSheet } from '../shared/AdminBottomSheet';
import {
  catalogSheetPrimaryBtn,
  catalogSheetSecondaryBtn,
  catalogSheetTitle,
} from '../shared/adminCatalogSheetTheme';
import { sheetSectionClass, sheetSectionTitleClass } from '../profile/adminProfileCabinetTheme';
import { bundleHasDiscount, bundleStatusLabel } from './bundleUtils';
import { formatDurationRu } from './servicesFormat';
import type { ServiceBundle } from './servicesTypes';

type Props = {
  open: boolean;
  bundle: ServiceBundle | null;
  serviceLabels?: string[];
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

type MenuTone = 'brand' | 'danger';

function iconWrapClass(tone: MenuTone): string {
  return tone === 'danger' ? 'bg-[#FEF2F2] text-[#EF4444]' : 'bg-[#FFF1F4] text-[#F47C8C]';
}

function statusBadgeClass(status: ServiceBundle['status']): string {
  switch (status) {
    case 'visible':
      return 'bg-[#ECFDF5] text-[#16A34A]';
    case 'hidden':
      return 'bg-[#EBEBEB] text-[#6B7280]';
    default:
      return 'bg-[#FFF4E8] text-[#B45309]';
  }
}

function ActionTile({
  label,
  hint,
  icon: Icon,
  onClick,
  tone = 'brand',
}: {
  label: string;
  hint?: string;
  icon: IconType;
  onClick: () => void;
  tone?: MenuTone;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-[72px] w-full items-center gap-3 rounded-[10px] bg-[#F5F5F5] px-3 py-3 text-left transition hover:bg-[#EBEBEB] active:scale-[0.99] lg:min-h-[80px] lg:flex-col lg:items-start lg:justify-center lg:gap-2 lg:px-4 lg:py-4"
    >
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] lg:h-11 lg:w-11 ${iconWrapClass(tone)}`}
      >
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      <span className="min-w-0 flex-1 lg:flex-none">
        <span
          className={`block text-[14px] font-semibold leading-snug lg:text-[15px] ${
            tone === 'danger' ? 'text-[#EF4444]' : 'text-[#111827]'
          }`}
        >
          {label}
        </span>
        {hint ? (
          <span className="mt-0.5 block text-[11px] font-medium leading-snug text-[#6B7280] lg:text-[12px]">
            {hint}
          </span>
        ) : null}
      </span>
    </button>
  );
}

export function ServicesBundleMenuSheet({
  open,
  bundle,
  serviceLabels = [],
  onClose,
  onEdit,
  onDelete,
}: Props) {
  if (!bundle) return null;

  const showDeal = bundleHasDiscount(bundle.originalPrice, bundle.bundlePrice);
  const servicesCount = bundle.serviceIds.length;

  return (
    <AdminBottomSheet
      variant="catalog"
      open={open}
      onClose={onClose}
      headerContent={
        <div className="min-w-0 pr-2">
          <div className="flex flex-wrap items-center gap-2">
            <h2 id="admin-sheet-title" className={`${catalogSheetTitle} min-w-0 break-words`}>
              {bundle.title}
            </h2>
            <span
              className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${statusBadgeClass(bundle.status)}`}
            >
              {bundleStatusLabel(bundle.status)}
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
      <div className="space-y-4">
        <button
          type="button"
          onClick={onEdit}
          className="flex w-full flex-col rounded-[10px] bg-[#FFF1F4] px-5 py-4 text-left transition hover:bg-[#FFE4EA] active:scale-[0.99] lg:px-6 lg:py-5"
        >
          <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#F47C8C]">
            Цена набора
          </span>
          <div className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <span className="text-[34px] font-black tabular-nums leading-none tracking-[-0.05em] text-[#F47C8C] lg:text-[42px]">
              {bundle.bundlePrice} BYN
            </span>
            {showDeal ? (
              <>
                <span className="text-[16px] font-semibold text-[#9CA3AF] line-through lg:text-[18px]">
                  {bundle.originalPrice} BYN
                </span>
                <span className="text-[14px] font-bold text-[#F47C8C]">−{bundle.discountPercent}%</span>
              </>
            ) : null}
          </div>
          <p className="mt-2 text-[13px] font-medium text-[#6B7280]">
            {servicesCount}{' '}
            {servicesCount === 1 ? 'услуга' : servicesCount < 5 ? 'услуги' : 'услуг'}
            {' · '}
            {formatDurationRu(bundle.durationMinutes)}
            {showDeal ? ` · экономия ${bundle.discountAmount} BYN` : ''}
          </p>
          <span className="mt-2 text-[12px] font-semibold text-[#F47C8C]">
            Нажмите, чтобы изменить набор
          </span>
        </button>

        {serviceLabels.length > 0 ? (
          <section className={sheetSectionClass}>
            <p className={sheetSectionTitleClass}>Состав набора</p>
            <ul className="mt-3 space-y-2">
              {serviceLabels.map((label) => (
                <li
                  key={label}
                  className="flex items-start gap-2 text-[14px] font-medium leading-snug text-[#374151]"
                >
                  <HiCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#F47C8C]" aria-hidden />
                  <span className="min-w-0 break-words">{label}</span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className={sheetSectionClass}>
          <p className={sheetSectionTitleClass}>Управление</p>
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <ActionTile
              label="Редактировать"
              hint="Цена, услуги, описание"
              icon={HiPencilSquare}
              onClick={onEdit}
            />
          </div>
        </section>

        <button
          type="button"
          onClick={onDelete}
          className={`${catalogSheetPrimaryBtn} w-full !bg-[#FEF2F2] !text-[#EF4444] hover:!opacity-95`}
        >
          <span className="inline-flex items-center justify-center gap-2">
            <HiTrash className="h-5 w-5" aria-hidden />
            Удалить набор
          </span>
        </button>
      </div>
    </AdminBottomSheet>
  );
}
