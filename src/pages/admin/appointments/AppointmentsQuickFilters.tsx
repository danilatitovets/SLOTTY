import { HiFunnel } from 'react-icons/hi2';
import { apptFilterBtn, apptFilterBtnActive, apptTrayLabel } from './adminAppointmentsTheme';

type Props = {
  sheetActive: boolean;
  sheetOpen: boolean;
  onOpenSheet: () => void;
  sheetAriaLabel: string;
  /** Подпись слева в панели фильтра (название раздела). */
  label?: string;
  /** Только кнопка фильтра (без отступа под toolbar). */
  compact?: boolean;
};

export function AppointmentsQuickFilters({
  sheetActive,
  sheetOpen,
  onOpenSheet,
  sheetAriaLabel,
  label,
  compact = false,
}: Props) {
  const filterButton = (
    <button
      type="button"
      onClick={onOpenSheet}
      className={`${apptFilterBtn} ${sheetActive ? apptFilterBtnActive : ''}`}
      aria-label={sheetAriaLabel}
      aria-expanded={sheetOpen}
    >
      <HiFunnel className="h-5 w-5" aria-hidden />
      {sheetActive ? (
        <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-white" aria-hidden />
      ) : null}
    </button>
  );

  if (compact) return filterButton;

  return (
    <div className="flex w-full items-center justify-between gap-3">
      {label ? (
        <p className={`min-w-0 flex-1 ${apptTrayLabel}`}>{label}</p>
      ) : (
        <span className="min-h-12 min-w-0 flex-1" aria-hidden />
      )}
      {filterButton}
    </div>
  );
}
