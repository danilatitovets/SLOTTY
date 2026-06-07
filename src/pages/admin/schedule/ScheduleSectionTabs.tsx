import type { ComponentType } from 'react';
import { HiCalendarDays, HiPlusCircle, HiRectangleStack } from 'react-icons/hi2';
import {
  adminSectionTabIconClass,
  adminSectionTabIconToneClass,
  adminSectionTabIndicatorClass,
  adminSectionTabLabelClass,
  adminSectionTabsNavClass,
  adminSectionTabTextClass,
} from '../shared/adminSectionTabsTheme';
import type { SchedulePageTab } from './scheduleTypes';

const TABS: Array<{
  id: SchedulePageTab;
  label: string;
  Icon: ComponentType<{ className?: string }>;
}> = [
  { id: 'create', label: 'Создать', Icon: HiPlusCircle },
  { id: 'calendar', label: 'Календарь', Icon: HiCalendarDays },
  { id: 'list', label: 'Список', Icon: HiRectangleStack },
];

type Props = {
  active: SchedulePageTab;
  onChange: (tab: SchedulePageTab) => void;
  className?: string;
};

export function ScheduleSectionTabs({ active, onChange, className = '' }: Props) {
  return (
    <nav
      className={`${adminSectionTabsNavClass} ${className}`.trim()}
      aria-label="Разделы расписания"
    >
      {TABS.map((tab) => {
        const selected = active === tab.id;
        const Icon = tab.Icon;

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={adminSectionTabTextClass(selected, 'schedule')}
          >
            <Icon
              className={`${adminSectionTabIconClass} ${adminSectionTabIconToneClass(selected, 'schedule')}`}
              aria-hidden
            />
            <span className={adminSectionTabLabelClass}>{tab.label}</span>
            {selected ? <span className={adminSectionTabIndicatorClass('schedule')} aria-hidden /> : null}
          </button>
        );
      })}
    </nav>
  );
}
