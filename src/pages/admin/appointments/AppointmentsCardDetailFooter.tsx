import { HiChevronRight } from 'react-icons/hi2';
import { apptCardDetailLink } from './adminAppointmentsTheme';

type Props = {
  onClick: () => void;
};

export function AppointmentsCardDetailFooter({ onClick }: Props) {
  return (
    <div className="flex justify-end px-3.5 pb-3.5 pt-0 sm:px-4 sm:pb-4">
      <button type="button" onClick={onClick} className={apptCardDetailLink}>
        Подробнее
        <HiChevronRight className="h-4 w-4" aria-hidden />
      </button>
    </div>
  );
}
