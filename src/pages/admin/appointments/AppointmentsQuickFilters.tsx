import { HiFunnel } from 'react-icons/hi2';
import { apptFilterBtn, apptFilterBtnActive } from './adminAppointmentsTheme';

type Props = {
  sheetActive: boolean;
  sheetOpen: boolean;
  onOpenSheet: () => void;
  sheetAriaLabel: string;
};

export function AppointmentsQuickFilters({
  sheetActive,
  sheetOpen,
  onOpenSheet,
  sheetAriaLabel,
}: Props) {
  return (
    <div className="flex w-full justify-end">
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
    </div>
  );
}
