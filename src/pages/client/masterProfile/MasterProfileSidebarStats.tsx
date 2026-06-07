import type { ReactNode } from 'react';
import { HiCalendarDays, HiChatBubbleLeftRight, HiStar, HiTrophy } from 'react-icons/hi2';
import { formatReviewsCountLabel } from '../../../features/services/model/demoMasters';
import { estimatedBookingsCount } from '../lib/catalogFormat';
import type { MasterTopAchievement } from '../lib/resolveMasterTopRankStatus';
import type { ExtendedMasterProfile } from './types';
import { masterProfileMutedPanel } from './masterProfileTheme';

type Props = {
  master: ExtendedMasterProfile;
  topAchievements?: MasterTopAchievement[];
};

function StatRow({
  icon,
  label,
  value,
  valueClass = 'text-[#111827]',
}: {
  icon: ReactNode;
  label: string;
  value: ReactNode;
  valueClass?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <span className="inline-flex items-center gap-2 text-[13px] text-[#6B7280]">
        {icon}
        {label}
      </span>
      <span className={`text-right text-[13px] font-semibold tabular-nums ${valueClass}`}>{value}</span>
    </div>
  );
}

export function MasterProfileSidebarStats({ master, topAchievements = [] }: Props) {
  const isNewMaster = master.reviewsCount <= 0 && master.rating <= 0;
  const bookingsCount = estimatedBookingsCount(master.reviewsCount);
  const primaryTop = topAchievements[0] ?? null;

  return (
    <div className={`${masterProfileMutedPanel} divide-y divide-[#EBEBEB] px-4 py-1`}>
      <StatRow
        icon={<HiStar className="h-4 w-4 text-[#F59E0B]" aria-hidden />}
        label="Рейтинг"
        value={
          isNewMaster ? (
            <span className="font-medium text-[#6B7280]">Новый</span>
          ) : master.rating > 0 ? (
            master.rating.toFixed(1)
          ) : (
            '—'
          )
        }
      />
      <StatRow
        icon={<HiChatBubbleLeftRight className="h-4 w-4 text-[#F47C8C]" aria-hidden />}
        label="Отзывы"
        value={
          master.reviewsCount > 0 ? formatReviewsCountLabel(master.reviewsCount) : 'Пока нет'
        }
      />
      <StatRow
        icon={<HiCalendarDays className="h-4 w-4 text-[#9CA3AF]" aria-hidden />}
        label="Записей"
        value={
          bookingsCount != null && bookingsCount > 0 ? (
            <span className="text-[#F47C8C]">{bookingsCount}</span>
          ) : (
            '—'
          )
        }
        valueClass={bookingsCount != null && bookingsCount > 0 ? 'text-[#F47C8C]' : 'text-[#111827]'}
      />

      {primaryTop ? (
        <div className="flex items-center gap-2 py-2.5">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#FFF1F4] text-[#F47C8C]">
            <HiTrophy className="h-3.5 w-3.5" aria-hidden />
          </span>
          <p className="min-w-0 text-[13px] font-semibold leading-snug text-[#111827]">
            {primaryTop.title}
            {primaryTop.meta ? (
              <span className="font-medium text-[#6B7280]"> · {primaryTop.meta}</span>
            ) : null}
          </p>
        </div>
      ) : null}
    </div>
  );
}
