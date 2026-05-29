import type { ReactNode } from 'react';
import { AdminSheetFieldLabel } from '../admin/shared/AdminFormFieldLabel';
import { sheetLabelClass, sheetSegmentClass } from '../admin/profile/adminProfileCabinetTheme';

export const onboardingFieldClass = `
  mt-1.5
  min-w-0
  max-w-full
  w-full
  rounded-[24px]
  bg-[#F1EFEF]
  px-4
  py-3.5
  text-[16px]
  font-semibold
  text-neutral-950
  outline-none
  ring-0
  placeholder:text-neutral-400
  transition
  focus:bg-white
  focus:shadow-[0_10px_28px_rgba(17,17,17,0.05)]
  lg:mt-1.5
  lg:rounded-[10px]
  lg:bg-[#EBEBEB]
  lg:px-4
  lg:py-3
  lg:text-[15px]
  lg:font-medium
  lg:text-[#111827]
  lg:placeholder:text-[#8E8E93]
  lg:focus:bg-[#E4E4E4]
  lg:focus:shadow-none
`;

export const onboardingFieldScrollClass =
  'scroll-mt-28 rounded-[4px] transition-shadow duration-300 data-[onboarding-highlight]:shadow-[0_0_0_3px_rgba(226,149,149,0.45)] lg:scroll-mt-32';

export const onboardingLabelClass =
  'flex items-center gap-2 text-[13px] font-semibold text-neutral-500 lg:font-medium lg:text-[#6B7280]';

/** Подпись над заголовком шага (Адрес, Профиль…) */
export const onboardingEyebrowClass =
  'text-[11px] font-semibold uppercase tracking-normal text-neutral-400 lg:text-[13px] lg:normal-case lg:tracking-normal lg:text-[#E29595]';

/** Заголовок шага */
export const onboardingStepTitleClass =
  'mt-1.5 break-words text-balance text-[22px] font-semibold leading-[1.15] tracking-normal text-neutral-950 sm:text-[30px] lg:mt-3 lg:text-[32px] xl:text-[36px]';

export const onboardingSectionLabelClass =
  'text-[12px] font-semibold uppercase tracking-normal text-neutral-400 lg:text-[13px] lg:font-medium lg:normal-case lg:tracking-normal lg:text-[#6B7280]';

/** Лейбл секции в превью и на шаге проверки */
export const onboardingPreviewSectionLabelClass =
  'text-[12px] font-semibold uppercase tracking-normal text-neutral-400';

/** Заголовок в карточках превью / итогов */
export const onboardingPreviewTitleClass = 'font-semibold tracking-normal text-neutral-950';

/** Обёртка сегментов — как «Тип приёма» в кабинете мастера. */
export const onboardingSegmentWrapClass =
  'mt-2 grid grid-cols-2 gap-2 rounded-[10px] bg-[#F5F5F5] p-1.5';

export function onboardingSegmentBtnClass(active: boolean): string {
  return sheetSegmentClass(active);
}

type OnboardingFormFieldProps = {
  fieldId?: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder: string;
  multiline?: boolean;
  inputMode?: 'text' | 'numeric' | 'tel';
  error?: string;
  maxLength?: number;
  labelAdornment?: ReactNode;
  required?: boolean;
};

export function OnboardingFormField({
  fieldId,
  label,
  value,
  onChange,
  onBlur,
  placeholder,
  multiline,
  inputMode,
  error,
  maxLength,
  labelAdornment,
  required,
}: OnboardingFormFieldProps) {
  const inputClass = `${onboardingFieldClass} ${multiline ? 'resize-none leading-relaxed' : ''}`;

  return (
    <label
      data-onboarding-field={fieldId}
      className={`block min-w-0 ${fieldId ? onboardingFieldScrollClass : ''}`}
    >
      <span className={multiline ? 'block' : onboardingLabelClass}>
        {labelAdornment ? <span className="inline-flex shrink-0 items-center">{labelAdornment}</span> : null}
        {multiline ? (
          <AdminSheetFieldLabel required={required} className={sheetLabelClass}>
            {label}
          </AdminSheetFieldLabel>
        ) : (
          <>
            <span className="lg:hidden">{label}</span>
            <AdminSheetFieldLabel required={required} className={`hidden lg:inline ${sheetLabelClass}`}>
              {label}
            </AdminSheetFieldLabel>
          </>
        )}
      </span>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          placeholder={placeholder}
          rows={4}
          maxLength={maxLength}
          className={inputClass}
        />
      ) : (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          placeholder={placeholder}
          inputMode={inputMode}
          maxLength={maxLength}
          className={inputClass}
        />
      )}
      {error ? <p className="mt-1.5 text-[12px] font-medium leading-snug text-red-600">{error}</p> : null}
    </label>
  );
}
