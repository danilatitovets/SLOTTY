const STEPS = ['Услуги', 'Цена', 'Фото', 'Превью'] as const;

type Props = {
  step: number;
};

export function ServicesBundleStepper({ step }: Props) {
  return (
    <div className="mb-4 flex gap-1">
      {STEPS.map((label, index) => (
        <div
          key={label}
          className={`h-1 flex-1 rounded-full transition ${
            index <= step ? 'bg-[#F47C8C]' : 'bg-[#EAECEF]'
          }`}
          title={label}
        />
      ))}
    </div>
  );
}

export { STEPS as BUNDLE_FORM_STEPS };
