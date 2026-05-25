import { HiEllipsisVertical } from 'react-icons/hi2';
import { scheduleTemplateCardClass } from './adminScheduleTheme';
import type { WindowTemplate } from './scheduleTypes';
import { formatDurationRu, templateDisplayLabel } from './scheduleUtils';

type Props = {
  template: WindowTemplate;
  selected: boolean;
  onSelect: () => void;
  onOpenMenu?: () => void;
  compact?: boolean;
  hideMenu?: boolean;
};

export function WindowTemplateCard({
  template,
  selected,
  onSelect,
  onOpenMenu,
  hideMenu = false,
}: Props) {
  const label = templateDisplayLabel(template);
  const showServiceSubtitle =
    Boolean(template.title?.trim()) &&
    template.title.trim() !== template.serviceName &&
    template.serviceName !== label;

  return (
    <div className={`h-full w-full ${scheduleTemplateCardClass(selected)}`}>
      <button
        type="button"
        onClick={onSelect}
        className={`flex h-full w-full flex-col p-3 text-left lg:min-h-[8.5rem] lg:p-4 ${
          hideMenu ? '' : 'pr-10'
        }`}
      >
        <span
          className="h-1 w-10 shrink-0 rounded-full lg:h-1.5 lg:w-12"
          style={{ backgroundColor: template.accent }}
          aria-hidden
        />
        <span className="mt-2.5 line-clamp-2 text-[13px] font-bold leading-snug tracking-[-0.02em] text-[#111827] lg:mt-3 lg:text-[15px]">
          {label}
        </span>
        {showServiceSubtitle ? (
          <span className="mt-1 line-clamp-1 text-[11px] font-medium text-[#6B7280] lg:text-[12px]">
            {template.serviceName}
          </span>
        ) : null}
        <span className="mt-auto pt-2.5 text-[12px] font-semibold tabular-nums text-[#6B7280] lg:text-[13px]">
          {formatDurationRu(template.durationMinutes)}
        </span>
      </button>
      {!hideMenu && onOpenMenu ? (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onOpenMenu();
          }}
          className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-[10px] bg-[#F5F5F5] text-[#6B7280] ring-1 ring-[#EEEEEE] transition hover:bg-[#EBEBEB] hover:text-[#111827] active:scale-[0.95] lg:right-2.5 lg:top-2.5"
          aria-label={`Действия: ${label}`}
        >
          <HiEllipsisVertical className="h-5 w-5" aria-hidden />
        </button>
      ) : null}
    </div>
  );
}
