import { sheetSegmentClass } from '../profile/adminProfileCabinetTheme';
import { scheduleSegmentClass } from './adminScheduleTheme';

type Mode = 'template' | 'manual';

type Props = {
  mode: Mode;
  onTemplate: () => void;
  onManual: () => void;
  accent?: 'brand' | 'schedule';
};

function modeBtnClass(active: boolean, accent: 'brand' | 'schedule'): string {
  const base =
    'flex min-h-10 items-center justify-center rounded-[10px] px-3 text-[13px] font-semibold transition active:scale-[0.98]';

  if (accent === 'schedule') {
    return `${base} ${active ? 'bg-[#3B4CCA] text-white' : 'text-[#6B7280] hover:text-[#374151]'}`;
  }

  return `${base} ${sheetSegmentClass(active)}`;
}

export function AddWindowModeSwitch({
  mode,
  onTemplate,
  onManual,
  accent = 'brand',
}: Props) {
  return (
    <div
      className="grid grid-cols-2 gap-1.5 rounded-[12px] bg-[#EBEBEB] p-1.5"
      role="tablist"
      aria-label="Способ создания окна"
    >
      <button
        type="button"
        role="tab"
        aria-selected={mode === 'template'}
        onClick={onTemplate}
        className={modeBtnClass(mode === 'template', accent)}
      >
        По шаблону
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={mode === 'manual'}
        onClick={onManual}
        className={modeBtnClass(mode === 'manual', accent)}
      >
        Вручную
      </button>
    </div>
  );
}
