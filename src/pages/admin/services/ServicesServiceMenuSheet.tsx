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
  HiXMark,
} from 'react-icons/hi2';
import { AdminBottomSheet } from '../shared/AdminBottomSheet';
import type { ManagedService } from './servicesFormat';
import { formatDurationRu, formatServicePrice } from './servicesFormat';

type Props = {
  open: boolean;
  service: ManagedService | null;
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

type MenuTone = 'brand' | 'neutral' | 'danger' | 'muted';

function iconWrapClass(tone: MenuTone, disabled?: boolean): string {
  if (disabled) return 'bg-[#F3F4F6] text-[#C4C9D1]';
  switch (tone) {
    case 'danger':
      return 'bg-[#FEF2F2] text-[#EF4444]';
    case 'muted':
      return 'bg-[#F3F4F6] text-[#6B7280]';
    case 'neutral':
      return 'bg-[#EEF2FF] text-[#6366F1]';
    default:
      return 'bg-[#FFF1F4] text-[#F47C8C]';
  }
}

function labelClass(tone: MenuTone, disabled?: boolean): string {
  if (disabled) return 'text-[#C4C9D1]';
  if (tone === 'danger') return 'text-[#EF4444]';
  if (tone === 'muted') return 'text-[#6B7280]';
  return 'text-[#111827]';
}

function MenuButton({
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
      className="flex w-full items-center gap-3 rounded-[18px] px-2 py-2 text-left transition active:scale-[0.98] enabled:hover:bg-[#FAFAFA] disabled:cursor-not-allowed"
    >
      <span
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] ${iconWrapClass(tone, disabled)}`}
      >
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className={`block text-[15px] font-semibold leading-snug ${labelClass(tone, disabled)}`}>
          {label}
        </span>
        {hint ? (
          <span className={`mt-0.5 block text-[12px] font-medium ${disabled ? 'text-[#D1D5DB]' : 'text-[#9CA3AF]'}`}>
            {hint}
          </span>
        ) : null}
      </span>
    </button>
  );
}

export function ServicesServiceMenuSheet({
  open,
  service,
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

  return (
    <AdminBottomSheet open={open} onClose={onClose} title={service.title}>
      <p className="-mt-1 mb-3 text-[13px] font-medium text-[#9CA3AF]">
        {formatServicePrice(service)} · {formatDurationRu(service.durationMin)}
      </p>

      <div className="space-y-1 rounded-[20px] border border-[#EAECEF] bg-[#FAFAFA] p-1.5">
        <MenuButton label="Редактировать" hint="Название, цена, длительность" icon={HiPencilSquare} onClick={onEdit} />
        <MenuButton
          label={isActive ? 'Скрыть услугу' : 'Показать услугу'}
          hint={isActive ? 'Клиенты не увидят в каталоге' : 'Снова доступна для записи'}
          icon={isActive ? HiEyeSlash : HiEye}
          onClick={onToggleActive}
        />
        <MenuButton label="Дублировать" hint="Копия с теми же параметрами" icon={HiDocumentDuplicate} onClick={onDuplicate} />
        <MenuButton
          label="Предпросмотр для клиента"
          hint="Как выглядит в записи"
          icon={HiDevicePhoneMobile}
          tone="neutral"
          onClick={onPreview}
        />
      </div>

      <div className="mt-3 space-y-1 rounded-[20px] border border-[#EAECEF] bg-[#FAFAFA] p-1.5">
        <MenuButton
          label="Поднять выше"
          hint="Изменить порядок в каталоге"
          icon={HiArrowUp}
          onClick={onMoveUp}
          disabled={!canMoveUp}
        />
        <MenuButton
          label="Опустить ниже"
          hint="Изменить порядок в каталоге"
          icon={HiArrowDown}
          onClick={onMoveDown}
          disabled={!canMoveDown}
        />
      </div>

      <div className="mt-4 space-y-1">
        <MenuButton label="Удалить услугу" icon={HiTrash} tone="danger" onClick={onDelete} />
        <MenuButton label="Отмена" icon={HiXMark} tone="muted" onClick={onClose} />
      </div>
    </AdminBottomSheet>
  );
}
