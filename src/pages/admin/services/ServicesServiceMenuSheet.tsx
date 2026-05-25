import type { IconType } from 'react-icons';
import {
  HiArrowDown,
  HiArrowUp,
  HiDevicePhoneMobile,
  HiDocumentDuplicate,
  HiEye,
  HiEyeSlash,
  HiPencilSquare,
  HiTrash,
} from 'react-icons/hi2';
import { AdminBottomSheet } from '../shared/AdminBottomSheet';
import {
  catalogSheetPrimaryBtn,
  catalogSheetSecondaryBtn,
  catalogSheetTitle,
} from '../shared/adminCatalogSheetTheme';
import { sheetSectionClass, sheetSectionTitleClass } from '../profile/adminProfileCabinetTheme';
import { SERVICE_DELETE_BLOCKED_MESSAGE } from './serviceDeleteGuard';
import type { ManagedService } from './servicesFormat';
import { formatServicePrice } from './servicesFormat';

type Props = {
  open: boolean;
  service: ManagedService | null;
  deleteBlocked?: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onClose: () => void;
  onEdit: () => void;
  onToggleActive: () => void;
  onDuplicate: () => void;
  onPreview: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDelete: () => void;
};

type MenuTone = 'brand' | 'neutral' | 'danger';

function iconWrapClass(tone: MenuTone, disabled?: boolean): string {
  if (disabled) return 'bg-[#EBEBEB] text-[#C4C9D1]';
  switch (tone) {
    case 'danger':
      return 'bg-[#FEF2F2] text-[#EF4444]';
    case 'neutral':
      return 'bg-[#EEF2FF] text-[#6366F1]';
    default:
      return 'bg-[#FFF1F4] text-[#F47C8C]';
  }
}

function ActionTile({
  label,
  hint,
  icon: Icon,
  onClick,
  tone = 'brand',
  disabled,
}: {
  label: string;
  hint?: string;
  icon: IconType;
  onClick: () => void;
  tone?: MenuTone;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="flex min-h-[72px] w-full items-center gap-3 rounded-[10px] bg-[#EBEBEB] px-3 py-3 text-left transition enabled:hover:bg-[#E4E4E4] enabled:active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-55 lg:min-h-[80px] lg:flex-col lg:items-start lg:justify-center lg:gap-2 lg:bg-[#F5F5F5] lg:px-4 lg:py-4 lg:enabled:hover:bg-[#EBEBEB]"
    >
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] lg:h-11 lg:w-11 ${iconWrapClass(tone, disabled)}`}
      >
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      <span className="min-w-0 flex-1 lg:flex-none">
        <span
          className={`block text-[14px] font-semibold leading-snug lg:text-[15px] ${
            disabled ? 'text-[#C4C9D1]' : tone === 'danger' ? 'text-[#EF4444]' : 'text-[#111827]'
          }`}
        >
          {label}
        </span>
        {hint ? (
          <span
            className={`mt-0.5 block text-[11px] font-medium leading-snug lg:text-[12px] ${
              disabled ? 'text-[#D1D5DB]' : 'text-[#6B7280]'
            }`}
          >
            {hint}
          </span>
        ) : null}
      </span>
    </button>
  );
}

function OrderButton({
  label,
  icon: Icon,
  onClick,
  disabled,
}: {
  label: string;
  icon: IconType;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-[10px] bg-[#EBEBEB] text-[14px] font-semibold text-[#111827] transition enabled:hover:bg-[#E4E4E4] enabled:active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45"
    >
      <Icon className="h-4 w-4 shrink-0" aria-hidden />
      {label}
    </button>
  );
}

export function ServicesServiceMenuSheet({
  open,
  service,
  deleteBlocked = false,
  canMoveUp,
  canMoveDown,
  onClose,
  onEdit,
  onToggleActive,
  onDuplicate,
  onPreview,
  onMoveUp,
  onMoveDown,
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
      <div className="space-y-4">
        <button
          type="button"
          onClick={onEdit}
          className="flex w-full flex-col rounded-[10px] bg-[#FFF1F4] px-5 py-4 text-left transition hover:bg-[#FFE4EA] active:scale-[0.99] lg:px-6 lg:py-5"
        >
          <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#F47C8C]">Цена в каталоге</span>
          <span className="mt-1 text-[34px] font-black tabular-nums leading-none tracking-[-0.05em] text-[#F47C8C] lg:text-[42px]">
            {priceLabel}
          </span>
          <span className="mt-2 text-[13px] font-medium text-[#6B7280]">Нажмите, чтобы изменить цену и название</span>
        </button>

        <section className={sheetSectionClass}>
          <p className={sheetSectionTitleClass}>Управление</p>
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <ActionTile label="Редактировать" hint="Название и цена" icon={HiPencilSquare} onClick={onEdit} />
            <ActionTile
              label={isActive ? 'Скрыть' : 'Показать'}
              hint={isActive ? 'Не в каталоге' : 'Снова в записи'}
              icon={isActive ? HiEyeSlash : HiEye}
              onClick={onToggleActive}
            />
            <ActionTile
              label="Дублировать"
              hint="Копия услуги"
              icon={HiDocumentDuplicate}
              onClick={onDuplicate}
            />
            <ActionTile
              label="Превью"
              hint="Как у клиента"
              icon={HiDevicePhoneMobile}
              tone="neutral"
              onClick={onPreview}
            />
          </div>
        </section>

        <section className={sheetSectionClass}>
          <p className={sheetSectionTitleClass}>Порядок в каталоге</p>
          <div className="mt-3 flex gap-2">
            <OrderButton label="Выше" icon={HiArrowUp} onClick={onMoveUp} disabled={!canMoveUp} />
            <OrderButton label="Ниже" icon={HiArrowDown} onClick={onMoveDown} disabled={!canMoveDown} />
          </div>
        </section>

        {deleteBlocked ? (
          <div className="rounded-[10px] bg-[#FFF4E8] px-4 py-3">
            <p className="text-[13px] font-semibold leading-relaxed text-[#B66A24]">
              {SERVICE_DELETE_BLOCKED_MESSAGE}
            </p>
            <p className="mt-2 text-[12px] font-medium text-[#6B7280]">
              Вместо удаления можно скрыть услугу — кнопка выше.
            </p>
          </div>
        ) : (
          <button
            type="button"
            onClick={onDelete}
            className={`${catalogSheetPrimaryBtn} w-full !bg-[#FEF2F2] !text-[#EF4444] hover:!opacity-95`}
          >
            <span className="inline-flex items-center justify-center gap-2">
              <HiTrash className="h-5 w-5" aria-hidden />
              Удалить услугу
            </span>
          </button>
        )}
      </div>
    </AdminBottomSheet>
  );
}
