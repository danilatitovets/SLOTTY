import { Link } from 'react-router-dom';
import { LuArrowLeft } from 'react-icons/lu';
import { BookingNoSlotsScene } from './BookingNoSlotsScene';

type Props = {
  backTo: string;
};

export function BookingNoSlotsEmpty({ backTo }: Props) {
  return (
    <div className="animate-fade-enter flex w-full flex-col items-center px-2 pt-2 text-center sm:pt-6 lg:pt-8">
      <div className="mb-4 w-full sm:mb-5">
        <BookingNoSlotsScene />
      </div>

      <h2 className="text-[19px] font-bold tracking-[-0.03em] text-[#111827] sm:text-[20px]">
        Свободных слотов нет
      </h2>
      <p className="mx-auto mt-2 max-w-[19rem] text-[14px] leading-relaxed text-[#6B7280]">
        Попробуйте другую услугу или зайдите позже — мастер может открыть новые окна.
      </p>

      <Link
        to={backTo}
        className="mt-5 inline-flex items-center gap-1.5 text-[14px] font-semibold text-[#F47C8C] no-underline transition hover:opacity-80"
      >
        <LuArrowLeft className="h-4 w-4 shrink-0" strokeWidth={1.75} aria-hidden />
        Назад к мастеру
      </Link>
    </div>
  );
}
