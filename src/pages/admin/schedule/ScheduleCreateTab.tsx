import { scheduleTabContentPad } from './adminScheduleTheme';
import type { ScheduleTabMetrics } from './scheduleTabMetrics';
import type { WindowTemplate } from './scheduleTypes';
import { ScheduleCreateTabStats } from './ScheduleCreateTabStats';
import { WindowTemplateList } from './WindowTemplateList';

type Props = {
  templates: WindowTemplate[];
  selectedTemplateId: string | null;
  createMetrics: ScheduleTabMetrics['create'];
  onTemplateSelect: (id: string) => void;
  onTemplateMenu: (template: WindowTemplate) => void;
  onCreateTemplate: () => void;
  onOpenWithoutTemplate: () => void;
};

export function ScheduleCreateTab({
  templates,
  selectedTemplateId,
  createMetrics,
  onTemplateSelect,
  onTemplateMenu,
  onCreateTemplate,
  onOpenWithoutTemplate,
}: Props) {
  return (
    <div className={`${scheduleTabContentPad} w-full min-w-0 max-w-none max-lg:pb-[calc(3.5rem+1rem)]`}>
      <div className="flex w-full min-w-0 max-w-none flex-col gap-5 lg:gap-6">
        <header className="min-w-0">
          <h2 className="text-[20px] font-black tracking-[-0.04em] text-[#111827] lg:text-[24px] lg:tracking-[-0.05em]">
            Окна для записи
          </h2>

        </header>

        <ScheduleCreateTabStats metrics={createMetrics} />

        <WindowTemplateList
          templates={templates}
          selectedId={selectedTemplateId}
          onSelect={onTemplateSelect}
          onOpenMenu={onTemplateMenu}
          onCreate={onCreateTemplate}
          onOpenWithoutTemplate={onOpenWithoutTemplate}
          fullWidth
        />
      </div>
    </div>
  );
}
