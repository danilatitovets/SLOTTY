import { useEffect, useState, type FC } from 'react';
import { HiCalendarDays, HiClock } from 'react-icons/hi2';
import { bookingDateCardDisabled } from './bookingDateTimeUi';

const WEEK_DAYS = [
  { short: 'Пн', num: '9' },
  { short: 'Вт', num: '10' },
  { short: 'Ср', num: '11' },
  { short: 'Чт', num: '12' },
  { short: 'Пт', num: '13' },
  { short: 'Сб', num: '14' },
  { short: 'Вс', num: '15' },
] as const;

const TIME_SLOTS = [
  '10:00',
  '11:30',
  '13:00',
  '14:30',
  '16:00',
  '17:30',
  '19:00',
  '20:30',
] as const;

const SEARCH_HINTS = [
  'Ищем свободное время…',
  'Все окна заняты',
  'Мастер может открыть новые дни',
] as const;

export const BookingNoSlotsScene: FC = () => {
  const [hintIndex, setHintIndex] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setHintIndex((i) => (i + 1) % SEARCH_HINTS.length);
    }, 2800);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div
      className="relative mx-auto w-full max-w-[19rem] select-none sm:max-w-[21rem]"
      aria-hidden
    >
      <span
        className="pointer-events-none absolute left-1/2 top-1/2 h-36 w-36 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#FFF1F4]/60 blur-2xl motion-reduce:hidden"
        aria-hidden
      />

      <div className="relative rounded-[18px] bg-[#F6F7FB] px-3.5 py-3.5 sm:px-4 sm:py-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-white text-[#F47C8C]">
              <HiCalendarDays className="h-4 w-4" aria-hidden />
            </span>
            <div className="min-w-0 text-left">
              <p className="font-landing text-[12px] font-semibold text-[#111827] sm:text-[13px]">
                Ближайшие дни
              </p>
              <p className="font-landing text-[10px] text-[#9CA3AF] sm:text-[11px]">Июнь</p>
            </div>
          </div>
          <span className="shrink-0 rounded-full bg-white px-2.5 py-1 font-landing text-[10px] font-bold tabular-nums text-[#9CA3AF] motion-safe:animate-booking-no-slot-badge motion-reduce:animate-none sm:text-[11px]">
            0 свободно
          </span>
        </div>

        <div className="flex gap-1 overflow-hidden">
          {WEEK_DAYS.map((day) => (
            <div
              key={day.short}
              className={`flex min-w-0 flex-1 flex-col items-center justify-center rounded-[12px] py-2 ${bookingDateCardDisabled}`}
            >
              <span className="font-landing text-[10px] font-semibold uppercase leading-none sm:text-[11px]">
                {day.short}
              </span>
              <span className="mt-1 font-landing text-[15px] font-bold tabular-nums leading-none sm:text-[16px]">
                {day.num}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-3 grid grid-cols-4 gap-1.5">
          {TIME_SLOTS.map((time, index) => (
            <div
              key={time}
              className="relative flex min-h-10 items-center justify-center rounded-[12px] bg-[#F0F0F2] font-landing text-[12px] font-semibold tabular-nums text-[#D1D5DB] motion-safe:animate-booking-no-slot-scan motion-reduce:animate-none sm:min-h-11 sm:text-[13px]"
              style={{ animationDelay: `${index * 0.22}s` }}
            >
              <span className="relative z-[1]">{time}</span>
              <span
                className="pointer-events-none absolute inset-0 flex items-center justify-center text-[#E5E7EB] motion-reduce:opacity-100"
                aria-hidden
              >
                <span className="h-px w-[70%] rotate-[-18deg] bg-current" />
              </span>
            </div>
          ))}
        </div>

        <div className="mt-3 flex items-center justify-center gap-1.5 rounded-[12px] bg-white/80 px-2.5 py-2">
          <HiClock className="h-3.5 w-3.5 shrink-0 text-[#F47C8C] motion-safe:animate-pulse motion-reduce:animate-none" aria-hidden />
          <p
            key={hintIndex}
            className="min-h-[1.125rem] font-landing text-[11px] font-medium text-[#6B7280] motion-safe:animate-fade-enter motion-reduce:animate-none sm:text-[12px]"
          >
            {SEARCH_HINTS[hintIndex]}
          </p>
        </div>
      </div>
    </div>
  );
};
