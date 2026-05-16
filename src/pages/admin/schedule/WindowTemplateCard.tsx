import type { WindowTemplate } from './scheduleTypes';
import { formatDurationRu, templateDisplayLabel } from './scheduleUtils';

type Props = {
  template: WindowTemplate;
  selected: boolean;
  onSelect: () => void;
  compact?: boolean;
};

export function WindowTemplateCard({ template, selected, onSelect, compact = false }: Props) {
  const label = templateDisplayLabel(template);
  const showServiceSubtitle =
    Boolean(template.title?.trim()) &&
    template.title.trim() !== template.serviceName &&
    template.serviceName !== label;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex w-full flex-col gap-1.5 rounded-[20px] border-2 p-3 text-left transition active:scale-[0.98] ${
        compact ? 'min-h-[5.25rem]' : 'min-h-[5.75rem]'
      } ${
        selected
          ? 'border-[#E29595] bg-[#FFF5F5] shadow-[0_6px_20px_rgba(226,149,149,0.16)]'
          : 'border-transparent bg-[#F1EFEF]'
      }`}
    >
      <span
        className="h-1.5 w-7 rounded-full"
        style={{ backgroundColor: template.accent }}
        aria-hidden
      />
      <span className="line-clamp-2 text-[13px] font-semibold leading-snug text-neutral-900">{label}</span>
      {showServiceSubtitle ? (
        <span className="line-clamp-1 text-[11px] font-medium text-neutral-500">{template.serviceName}</span>
      ) : null}
      <span className="text-[11px] font-medium text-neutral-500">
        {formatDurationRu(template.durationMinutes)}
      </span>
    </button>
  );
}
