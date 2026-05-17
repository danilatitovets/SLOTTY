import { HiFunnel } from 'react-icons/hi2';
import { apptFilterBtnActive, apptFilterBtnIdle } from './adminAppointmentsTheme';

type Props = {
  activeLabel: string;
  isActive: boolean;
  open: boolean;
  onOpen: () => void;
};

export function AppointmentsFilterBar({ activeLabel, isActive, open, onOpen }: Props) {
  return (
    <div className="flex items-center justify-end">
      <button
        type="button"
        onClick={onOpen}
        className={`relative flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] border transition active:scale-[0.96] ${
          isActive ? apptFilterBtnActive : apptFilterBtnIdle
        }`}
        aria-label={`Фильтр: ${activeLabel}`}
        aria-expanded={open}
      >
        <HiFunnel className="h-5 w-5" aria-hidden />
        {isActive ? (
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#F47C8C]" aria-hidden />
        ) : null}
      </button>
    </div>
  );
}
