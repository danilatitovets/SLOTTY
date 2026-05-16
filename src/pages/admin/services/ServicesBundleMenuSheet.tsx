import { HiPencilSquare, HiTrash, HiXMark } from 'react-icons/hi2';
import { AdminBottomSheet } from '../shared/AdminBottomSheet';
import type { ServiceBundle } from './servicesTypes';

type Props = {
  open: boolean;
  bundle: ServiceBundle | null;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

function MenuRow({
  label,
  icon: Icon,
  onClick,
  danger,
}: {
  label: string;
  icon: typeof HiPencilSquare;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-[16px] px-2 py-2.5 text-left transition active:scale-[0.98] hover:bg-[#FAFAFA]"
    >
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] ${
          danger ? 'bg-[#FEF2F2] text-[#EF4444]' : 'bg-[#FFF1F4] text-[#F47C8C]'
        }`}
      >
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      <span className={`text-[15px] font-semibold ${danger ? 'text-[#EF4444]' : 'text-[#111827]'}`}>
        {label}
      </span>
    </button>
  );
}

export function ServicesBundleMenuSheet({ open, bundle, onClose, onEdit, onDelete }: Props) {
  if (!bundle) return null;

  return (
    <AdminBottomSheet open={open} onClose={onClose} title={bundle.title}>
      <div className="space-y-0.5 pb-2">
        <MenuRow label="Редактировать" icon={HiPencilSquare} onClick={onEdit} />
        <MenuRow label="Удалить" icon={HiTrash} onClick={onDelete} danger />
        <MenuRow label="Закрыть" icon={HiXMark} onClick={onClose} />
      </div>
    </AdminBottomSheet>
  );
}
