import type { ComponentType } from 'react';
import { HiArchiveBox, HiCalendarDays, HiInbox } from 'react-icons/hi2';
import {
  adminSectionTabIconClass,
  adminSectionTabIconToneClass,
  adminSectionTabIndicatorClass,
  adminSectionTabLabelClass,
  adminSectionTabsNavClass,
  adminSectionTabTextClass,
} from '../shared/adminSectionTabsTheme';
import type { AppointmentsTabId } from './appointmentsTypes';

const TABS: Array<{
  id: AppointmentsTabId;
  label: string;
  Icon: ComponentType<{ className?: string }>;
}> = [
  { id: 'requests', label: 'Заявки', Icon: HiInbox },
  { id: 'upcoming', label: 'Предстоящие', Icon: HiCalendarDays },
  { id: 'history', label: 'История', Icon: HiArchiveBox },
];

type Props = {
  active: AppointmentsTabId;
  onChange: (tab: AppointmentsTabId) => void;
  counts?: { requests: number; upcoming: number; history: number };
  className?: string;
};

export function AppointmentsSectionTabs({ active, onChange, counts, className = '' }: Props) {
  const countFor = (id: AppointmentsTabId) => {
    if (!counts) return null;
    if (id === 'requests') return counts.requests;
    if (id === 'upcoming') return counts.upcoming;
    return counts.history;
  };

  return (
    <nav
      className={`${adminSectionTabsNavClass} ${className}`.trim()}
      aria-label="Разделы записей"
    >
      {TABS.map((tab) => {
        const selected = active === tab.id;
        const Icon = tab.Icon;
        const n = countFor(tab.id);

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={adminSectionTabTextClass(selected)}
          >
            <Icon
              className={`${adminSectionTabIconClass} ${adminSectionTabIconToneClass(selected)}`}
              aria-hidden
            />
            <span className={adminSectionTabLabelClass}>{tab.label}</span>
            {n != null && n > 0 ? (
              <span
                className={`min-w-[1.25rem] rounded-full px-1.5 py-0.5 text-[11px] font-black tabular-nums ${
                  selected ? 'bg-[#F47C8C] text-white' : 'bg-[#EBEBEB] text-[#6B7280]'
                }`}
              >
                {n > 99 ? '99+' : n}
              </span>
            ) : null}
            {selected ? <span className={adminSectionTabIndicatorClass()} aria-hidden /> : null}
          </button>
        );
      })}
    </nav>
  );
}
