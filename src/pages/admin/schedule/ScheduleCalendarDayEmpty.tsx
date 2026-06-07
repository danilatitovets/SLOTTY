import type { ReactNode } from 'react';
import { SlottyImg } from '../../../shared/ui/SlottyImg';
import { SCHEDULE_NO_WINDOWS_DAY_ILLUSTRATION_SRC } from './adminScheduleTheme';

type Props = {
  title: string;
  text: string;
  action?: ReactNode;
  showIllustration?: boolean;
};

export function ScheduleCalendarDayEmpty({
  title,
  text,
  action,
  showIllustration = false,
}: Props) {
  return (
    <div className="mt-4 flex flex-col items-center rounded-[12px] bg-white px-4 py-8 text-center">
      {showIllustration ? (
        <SlottyImg
          src={SCHEDULE_NO_WINDOWS_DAY_ILLUSTRATION_SRC}
          alt=""
          className="mx-auto mb-4 w-full max-w-[14rem] object-contain sm:max-w-[15rem]"
          decoding="async"
          draggable={false}
        />
      ) : null}

      <p className="text-[15px] font-bold tracking-[-0.02em] text-[#111827] sm:text-[16px]">{title}</p>
      <p className="mt-1.5 max-w-[20rem] text-[13px] font-medium leading-relaxed text-[#6B7280] sm:text-[14px]">
        {text}
      </p>

      {action ? <div className="mt-5 flex w-full justify-center">{action}</div> : null}
    </div>
  );
}
