import type { IconType } from 'react-icons';
import {
  HiCalendarDays,
  HiChevronRight,
  HiDevicePhoneMobile,
  HiDocumentDuplicate,
  HiEye,
  HiEyeSlash,
  HiPencilSquare,
  HiTrash,
} from 'react-icons/hi2';
import { AdminBottomSheet } from '../shared/AdminBottomSheet';
import { catalogSheetSecondaryBtn, catalogSheetTitle } from '../shared/adminCatalogSheetTheme';
import { servicesSheetMenuList, servicesSheetMenuRow } from './adminServicesTheme';
import {
  SERVICE_DELETE_BLOCKED_BODY,
  SERVICE_DELETE_BLOCKED_HINT,
  SERVICE_DELETE_BLOCKED_TITLE,
} from './serviceDeleteGuard';
import type { ManagedService } from './servicesFormat';
import { formatServicePrice } from './servicesFormat';
import { ServicesSheetNotice } from './ServicesSheetNotice';
import { ServicesSheetPriceHero } from './ServicesSheetPriceHero';

type Props = {
  open: boolean;
  service: ManagedService | null;
  deleteBlocked?: boolean;
  onClose: () => void;
  onEdit: () => void;
  onToggleActive: () => void;
  onDuplicate: () => void;
  onPreview: () => void;
  onAddWindow: () => void;
  onDelete: () => void;
};

type MenuTone = 'neutral' | 'danger';

function ActionRow({
  label,
  icon: Icon,
  onClick,
  tone = 'neutral',
  disabled,
}: {
  label: string;
  icon: IconType;
  onClick: () => void;
  tone?: MenuTone;
  disabled?: boolean;
}) {
  return (
    <button type="button" disabled={disabled} onClick={onClick} className={servicesSheetMenuRow}>
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] ${
          disabled
            ? 'bg-[#EBEBEB] text-[#C4C9D1]'
            : tone === 'danger'
              ? 'bg-[#FEE2E2] text-[#EF4444]'
              : 'bg-white text-[#374151]'
        }`}
      >
        <Icon className="h-[18px] w-[18px]" aria-hidden />
      </span>
      <span
        className={`min-w-0 flex-1 text-[14px] font-semibold ${
          disabled ? 'text-[#C4C9D1]' : tone === 'danger' ? 'text-[#EF4444]' : 'text-[#111827]'
        }`}
      >
        {label}
      </span>
      <HiChevronRight className="h-4 w-4 shrink-0 text-[#C4C9D1]" aria-hidden />
    </button>
  );
}

export function ServicesServiceMenuSheet({
  open,
  service,
  deleteBlocked = false,
  onClose,
  onEdit,
  onToggleActive,
  onDuplicate,
  onPreview,
  onAddWindow,
  onDelete,
}: Props) {
  if (!service) return null;

  const isActive = service.isActive !== false;
  const priceLabel = formatServicePrice(service);

  return (
    <AdminBottomSheet
      variant="catalog"
      open={open}
      onClose={onClose}
      headerContent={
        <div className="min-w-0 pr-2">
          <div className="flex flex-wrap items-center gap-2">
            <h2 id="admin-sheet-title" className={`${catalogSheetTitle} min-w-0 break-words`}>
              {service.title}
            </h2>
            <span
              className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${
                isActive ? 'bg-[#ECFDF5] text-[#16A34A]' : 'bg-[#EBEBEB] text-[#6B7280]'
              }`}
            >
              {isActive ? 'Видна' : 'Скрыта'}
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
      <div className="space-y-3.5">
        <ServicesSheetPriceHero value={priceLabel} onClick={onEdit} />

        <section>
          <p className="mb-2 text-[12px] font-bold uppercase tracking-[0.08em] text-[#9CA3AF]">
            Управление
          </p>
          <div className={`${servicesSheetMenuList} divide-y divide-[#EBEBEB]`}>
            <ActionRow label="Редактировать" icon={HiPencilSquare} onClick={onEdit} />
            <ActionRow
              label={isActive ? 'Скрыть' : 'Показать'}
              icon={isActive ? HiEyeSlash : HiEye}
              onClick={onToggleActive}
            />
            <ActionRow label="Дублировать" icon={HiDocumentDuplicate} onClick={onDuplicate} />
            <ActionRow label="Добавить окно" icon={HiCalendarDays} onClick={onAddWindow} />
            <ActionRow label="Превью" icon={HiDevicePhoneMobile} onClick={onPreview} />
          </div>
        </section>

        {deleteBlocked ? (
          <ServicesSheetNotice
            tone="warning"
            title={SERVICE_DELETE_BLOCKED_TITLE}
            body={SERVICE_DELETE_BLOCKED_BODY}
            hint={SERVICE_DELETE_BLOCKED_HINT}
          />
        ) : (
          <button
            type="button"
            onClick={onDelete}
            className="flex min-h-10 w-full items-center justify-center gap-2 rounded-[12px] bg-[#FEE2E2] px-4 text-[14px] font-semibold text-[#DC2626] transition hover:bg-[#FECACA] active:scale-[0.98]"
          >
            <HiTrash className="h-4 w-4" aria-hidden />
            Удалить услугу
          </button>
        )}
      </div>
    </AdminBottomSheet>
  );
}
