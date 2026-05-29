import { Link } from 'react-router-dom';
import { HiArrowLeft, HiChevronRight } from 'react-icons/hi2';
import { catalogDesktopPanel } from '../client/servicesCatalog/servicesCatalogTheme';
import { bookingBackLink } from './bookingUi';

type Props = {
  backTo: string;
  backLabel?: string;
  masterProfileTo: string;
  masterName: string;
  serviceTitle: string;
};

export function BookingDesktopHero({
  backTo,
  backLabel = 'Назад',
  masterProfileTo,
  masterName,
  serviceTitle,
}: Props) {
  return (
    <header className={`${catalogDesktopPanel} mb-4 px-5 py-5 lg:px-6 lg:py-5`}>
      <Link to={backTo} className={bookingBackLink}>
        <HiArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
        {backLabel}
      </Link>

      <nav
        aria-label="Маршрут записи"
        className="mt-4 flex min-w-0 items-center gap-1 rounded-[12px] border border-[#EEEEEE] bg-[#FAFAFA] px-3 py-2.5"
      >
        <Link
          to={masterProfileTo}
          className="min-w-0 truncate text-[14px] font-semibold text-[#111827] underline-offset-2 transition hover:text-[#F47C8C] hover:underline"
        >
          {masterName}
        </Link>
        <HiChevronRight className="h-4 w-4 shrink-0 text-[#C7C7CC]" aria-hidden />
        <span
          className="min-w-0 truncate text-[14px] font-medium text-[#6B7280]"
          title={serviceTitle}
          aria-current="page"
        >
          {serviceTitle}
        </span>
      </nav>

      <div className="mt-5 min-w-0 border-t border-[#F0F0F0] pt-5">
        <p className="text-[12px] font-bold uppercase tracking-[0.06em] text-[#F47C8C]">
          Онлайн-запись
        </p>
        <h1 className="mt-1.5 text-[24px] font-bold leading-tight tracking-[-0.03em] text-[#111827] lg:text-[26px]">
          Выберите дату и время
        </h1>
        <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-[#6B7280]">
          После выбора слота справа появятся детали визита и итоговая стоимость.
        </p>
      </div>
    </header>
  );
}
