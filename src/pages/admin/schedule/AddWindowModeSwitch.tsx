import { sheetSegmentClass } from '../profile/adminProfileCabinetTheme';

type Mode = 'template' | 'manual';

type Props = {
  mode: Mode;
  onTemplate: () => void;
  onManual: () => void;
};

export function AddWindowModeSwitch({ mode, onTemplate, onManual }: Props) {
  return (
    <div
      className="grid grid-cols-2 gap-1.5 rounded-[10px] bg-[#F5F5F5] p-1.5"
      role="tablist"
      aria-label="Способ создания окна"
    >
      <button
        type="button"
        role="tab"
        aria-selected={mode === 'template'}
        onClick={onTemplate}
        className={`flex min-h-11 items-center justify-center ${sheetSegmentClass(mode === 'template')}`}
      >
        По шаблону
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={mode === 'manual'}
        onClick={onManual}
        className={`flex min-h-11 items-center justify-center ${sheetSegmentClass(mode === 'manual')}`}
      >
        Вручную
      </button>
    </div>
  );
}
