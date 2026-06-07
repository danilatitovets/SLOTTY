import type { ReactNode } from 'react';
import {
  HiCalendarDays,
  HiClock,
  HiHomeModern,
  HiMapPin,
  HiStar,
} from 'react-icons/hi2';
import { formatMasterCardSpecialty } from '../lib/catalogFormat';
import type { ExtendedMasterProfile, NearestSlotInfo } from './types';
import { formatMasterProfileLocationChip, visitChipLabel } from './masterProfileUtils';
import {
  formatBookingsStatLabel,
  resolveMasterProfileMetrics,
} from './masterProfileMetrics';
import { masterProfileCard } from './masterProfileTheme';

type Props = {
  master: ExtendedMasterProfile;
  nearest?: NearestSlotInfo | null;
  nearestLoading?: boolean;
  layout?: 'desktop' | 'mobile';
  onChooseTime?: (serviceId?: string | null) => void;
};

function StatCell({
  icon,
  label,
  value,
  accent,
  title,
  onValueClick,
}: {
  icon: React.ReactNode;
  label: string;
  value: ReactNode;
  accent?: boolean;
  title?: string;
  onValueClick?: () => void;
}) {
  const valueClass = `block w-full min-w-0 truncate text-[14px] font-bold leading-tight tracking-[-0.02em] ${
    accent ? 'text-[#F47C8C]' : 'text-[#111827]'
  }`;

  return (
    <div className="min-w-0 rounded-[14px] bg-[#FAFAFA] px-3 py-2.5 sm:px-3.5 sm:py-3">
      <span className="mb-1 inline-flex max-w-full items-center gap-1.5 truncate text-[11px] font-medium text-[#8E8E93]">
        <span className="shrink-0">{icon}</span>
        <span className="truncate">{label}</span>
      </span>
      {onValueClick ? (
        <button
          type="button"
          onClick={onValueClick}
          title={title}
          className={`${valueClass} text-left underline decoration-[#F47C8C]/35 underline-offset-[3px] transition hover:text-[#E86A7A] hover:decoration-[#F47C8C]`}
        >
          {value}
        </button>
      ) : (
        <span className={valueClass} title={title}>
          {value}
        </span>
      )}
    </div>
  );
}

export function MasterProfileStatsRow({
  master,
  nearest,
  nearestLoading,
  layout = 'desktop',
  onChooseTime,
}: Props) {
  const metrics = resolveMasterProfileMetrics(master);
  const locationChip = formatMasterProfileLocationChip(master.location);
  const visitChip = visitChipLabel(master.location.visitType);
  const hasSlot = Boolean(nearest?.label);
  const isMobile = layout === 'mobile';
  const openCalendar = onChooseTime
    ? () => onChooseTime(nearest?.serviceId ?? null)
    : undefined;

  const ratingValue = metrics.isNewMaster
    ? 'Новый мастер'
    : metrics.ratingLabel
      ? `${metrics.ratingLabel}${metrics.reviewsLabel ? ` · ${metrics.reviewsLabel}` : ''}`
      : 'Без отзывов';

  const bookingsValue = metrics.bookingsCount
    ? formatBookingsStatLabel(metrics.bookingsCount)
    : metrics.isNewMaster
      ? 'Скоро появятся'
      : 'Пока нет';

  const slotValue = nearestLoading
    ? 'Ищем окно…'
    : hasSlot
      ? nearest!.label
      : 'Выбрать время';

  const slotClickable = Boolean(openCalendar) && !nearestLoading;
  const columnCount = metrics.showClientsTrust ? 6 : 5;

  const gridClass = isMobile
    ? 'flex gap-2.5 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'
    : columnCount === 6
      ? 'grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6'
      : 'grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5';

  const mobileCellClass = isMobile ? 'w-[8.75rem] shrink-0 sm:w-auto sm:min-w-0 sm:flex-1' : '';

  return (
    <section className={`${masterProfileCard} p-4 sm:p-5`}>
      <p className="mb-3 text-[13px] font-medium text-[#8E8E93]">
        {formatMasterCardSpecialty(master.category)}
      </p>
      <div className={gridClass}>
        <div className={mobileCellClass}>
          <StatCell
            icon={<HiStar className="h-3.5 w-3.5 text-[#F59E0B]" aria-hidden />}
            label="Рейтинг"
            value={ratingValue}
            title={ratingValue}
          />
        </div>
        <div className={mobileCellClass}>
          <StatCell
            icon={<HiCalendarDays className="h-3.5 w-3.5 text-[#F47C8C]" aria-hidden />}
            label="Записи"
            value={bookingsValue}
            accent={Boolean(metrics.bookingsCount)}
            title={bookingsValue}
          />
        </div>
        {metrics.showClientsTrust ? (
          <div className={mobileCellClass}>
            <StatCell
              icon={<HiStar className="h-3.5 w-3.5 text-[#F47C8C]" aria-hidden />}
              label="Клиенты"
              value={`${metrics.bookingsCount}+`}
              accent
              title={`${metrics.bookingsCount}+ доверяют`}
            />
          </div>
        ) : null}
        <div className={mobileCellClass}>
          <StatCell
            icon={<HiMapPin className="h-3.5 w-3.5 text-[#9CA3AF]" aria-hidden />}
            label="Локация"
            value={locationChip}
            title={locationChip}
          />
        </div>
        <div className={mobileCellClass}>
          <StatCell
            icon={<HiHomeModern className="h-3.5 w-3.5 text-[#9CA3AF]" aria-hidden />}
            label="Формат"
            value={visitChip}
            title={visitChip}
          />
        </div>
        <div className={mobileCellClass}>
          <StatCell
            icon={<HiClock className="h-3.5 w-3.5 text-[#F47C8C]" aria-hidden />}
            label="Ближайшее окно"
            value={slotValue}
            accent={hasSlot || !nearestLoading}
            title={hasSlot ? `Записаться: ${nearest!.label}` : 'Открыть календарь записи'}
            onValueClick={slotClickable ? openCalendar : undefined}
          />
        </div>
      </div>
    </section>
  );
}
