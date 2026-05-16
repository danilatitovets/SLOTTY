import type { WindowTemplate } from './scheduleTypes';
import { primaryBtnClass, secondaryBtnClass } from './scheduleUi';
import { WindowTemplateList } from './WindowTemplateList';

type Props = {
  templates: WindowTemplate[];
  selectedTemplateId: string | null;
  onTemplateSelect: (id: string) => void;
  onCreateTemplate: () => void;
  onOpenNewWindow: () => void;
  onOpenWithoutTemplate: () => void;
};

export function ScheduleCreateTab({
  templates,
  selectedTemplateId,
  onTemplateSelect,
  onCreateTemplate,
  onOpenNewWindow,
  onOpenWithoutTemplate,
}: Props) {
  return (
    <div className="space-y-5">
      <WindowTemplateList
        templates={templates}
        selectedId={selectedTemplateId}
        onSelect={onTemplateSelect}
        onCreate={onCreateTemplate}
      />

      <div className="space-y-2.5">
        <button type="button" className={primaryBtnClass} onClick={onOpenNewWindow}>
          <span className="mr-2 text-[20px] leading-none" aria-hidden>
            +
          </span>
          Новое окно
        </button>
        <button type="button" className={secondaryBtnClass} onClick={onOpenWithoutTemplate}>
          Без шаблона — указать время вручную
        </button>
        <p className="px-1 text-center text-[12px] leading-snug text-neutral-500">
          Шаблон подставит услугу и длительность. Без шаблона можно выбрать любую услугу или оставить «Любая
          услуга».
        </p>
      </div>
    </div>
  );
}
