import { HiCheck } from 'react-icons/hi2';

const STEPS = ['Услуги', 'Цена', 'Фото', 'Превью'] as const;

type Props = {
  step: number;
};

export function ServicesBundleStepper({ step }: Props) {
  return (
    <div className="mb-5">
      <div className="flex items-start justify-between gap-1">
        {STEPS.map((label, index) => {
          const done = index < step;
          const active = index === step;
          return (
            <div key={label} className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[13px] font-bold transition ${
                  active
                    ? 'bg-[#F47C8C] text-white shadow-[0_6px_16px_rgba(244,124,140,0.35)]'
                    : done
                      ? 'bg-[#FFF1F4] text-[#F47C8C] ring-1 ring-[#FDE8ED]'
                      : 'bg-[#F3F4F6] text-[#9CA3AF]'
                }`}
              >
                {done ? <HiCheck className="h-5 w-5" aria-hidden /> : index + 1}
              </span>
              <span
                className={`max-w-full truncate text-center text-[10px] font-bold leading-tight sm:text-[11px] ${
                  active ? 'text-[#F47C8C]' : done ? 'text-[#6B7280]' : 'text-[#9CA3AF]'
                }`}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export { STEPS as BUNDLE_FORM_STEPS };
