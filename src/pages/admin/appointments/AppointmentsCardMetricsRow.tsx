import { HiChevronRight } from 'react-icons/hi2';
import {
  apptCardDetailLink,
  apptCardMetricDuration,
  apptCardMetricPrice,
} from './adminAppointmentsTheme';

type Props = {
  price: string;
  duration: string;
  onOpen: () => void;
};

export function AppointmentsCardMetricsRow({ price, duration, onOpen }: Props) {
  return (
    <div className="mt-2 flex flex-wrap items-center justify-between gap-x-2 gap-y-1 sm:mt-2.5">
      <div className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-0.5">
        <span className={`${apptCardMetricPrice} text-[16px] sm:text-[18px]`}>{price}</span>
        {duration ? (
          <span className={`${apptCardMetricDuration} text-[12px] sm:text-[14px]`}>{duration}</span>
        ) : null}
      </div>
      <button type="button" onClick={onOpen} className={`${apptCardDetailLink} shrink-0`}>
        Подробнее
        <HiChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden />
      </button>
    </div>
  );
}
