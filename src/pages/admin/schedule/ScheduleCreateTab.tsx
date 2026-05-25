import type { ReactNode } from 'react';
import { scheduleTabContentPad } from './adminScheduleTheme';
import type { WindowTemplate } from './scheduleTypes';
import { scheduleCabinetSecondaryBtn } from './scheduleUi';
import { WindowTemplateList } from './WindowTemplateList';

type Props = {
  templates: WindowTemplate[];
  selectedTemplateId: string | null;
  onTemplateSelect: (id: string) => void;
  onTemplateMenu: (template: WindowTemplate) => void;
  onCreateTemplate: () => void;
  onOpenWithoutTemplate: () => void;
  onOpenNewWindow: () => void;
  /** Блок «Идеи для акций» — под шаблонами на desktop. */
  aside?: ReactNode;
};

export function ScheduleCreateTab({
  templates,
  selectedTemplateId,
  onTemplateSelect,
  onTemplateMenu,
  onCreateTemplate,
  onOpenWithoutTemplate,
  aside,
}: Props) {
  return (
    <div className={`${scheduleTabContentPad} w-full min-w-0 max-w-none max-lg:pb-[calc(3.5rem+1rem)]`}>
      <div className="flex w-full min-w-0 max-w-none flex-col gap-4 lg:gap-6">
        <WindowTemplateList
          templates={templates}
          selectedId={selectedTemplateId}
          onSelect={onTemplateSelect}
          onOpenMenu={onTemplateMenu}
          onCreate={onCreateTemplate}
          fullWidth
        />

        <button
          type="button"
          className={`${scheduleCabinetSecondaryBtn} w-full max-w-none`}
          onClick={onOpenWithoutTemplate}
        >
          Без шаблона — указать время вручную
        </button>

        {aside ? <aside className="hidden w-full min-w-0 max-w-none lg:block">{aside}</aside> : null}
      </div>
    </div>
  );
}
