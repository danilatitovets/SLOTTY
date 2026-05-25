import type { ReactNode } from 'react';

/** Розовая звёздочка у обязательных полей в формах кабинета. */
export function FormRequiredMark() {
  return (
    <span
      className="ml-0.5 inline-block translate-y-[-1px] font-bold leading-none text-[#F47C8C]"
      aria-hidden
    >
      *
    </span>
  );
}

type AdminSheetFieldLabelProps = {
  children: ReactNode;
  required?: boolean;
  className?: string;
};

export function AdminSheetFieldLabel({
  children,
  required,
  className = 'text-[13px] font-medium text-[#6B7280]',
}: AdminSheetFieldLabelProps) {
  return (
    <span className={className}>
      {children}
      {required ? <FormRequiredMark /> : null}
    </span>
  );
}
