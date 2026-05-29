import type { ReactNode } from 'react';
import { BY } from 'country-flag-icons/react/1x1';
import { AdminSheetFieldLabel } from '../admin/shared/AdminFormFieldLabel';
import { sheetLabelClass } from '../admin/profile/adminProfileCabinetTheme';
import type { ContactType, MasterContactRow } from '../../features/master-onboarding/model/masterContacts';
import { MasterProfileContactsBlock } from './MasterProfileContactsBlock';
import { OnboardingProfileAvatar } from './OnboardingProfileAvatar';
import { onboardingEyebrowClass, onboardingStepTitleClass } from './onboardingFormField';

const mobileFieldClass = `
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

const mobileLabelClass =
  'flex items-center gap-2 text-[13px] font-semibold text-neutral-500 lg:font-medium lg:text-[#6B7280]';

function ProfileField({
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
}: {
  fieldId: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder: string;
  multiline?: boolean;
  inputMode?: 'text' | 'tel';
  error?: string;
  maxLength?: number;
  labelAdornment?: ReactNode;
  required?: boolean;
}) {
  const labelNode = (
    <span className={mobileLabelClass}>
      {labelAdornment ? <span className="inline-flex shrink-0 items-center">{labelAdornment}</span> : null}
      <span className="lg:hidden">{label}</span>
      <AdminSheetFieldLabel required={required} className={`hidden lg:inline ${sheetLabelClass}`}>
        {label}
      </AdminSheetFieldLabel>
    </span>
  );

  const inputClass = `${mobileFieldClass} ${multiline ? 'resize-none leading-relaxed' : ''}`;

  return (
    <label
      data-onboarding-field={fieldId}
      className="block min-w-0 scroll-mt-28 rounded-[4px] transition-shadow duration-300 data-[onboarding-highlight]:shadow-[0_0_0_3px_rgba(226,149,149,0.45)] lg:scroll-mt-32"
    >
      {labelNode}
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
      {error ? (
        <p className="mt-1.5 text-[12px] font-medium leading-snug text-red-600">{error}</p>
      ) : null}
    </label>
  );
}

export type OnboardingStep3ProfileProps = {
  name: string;
  onNameChange: (value: string) => void;
  onNameBlur: () => void;
  nameError?: string;

  description: string;
  onDescriptionChange: (value: string) => void;
  onDescriptionBlur: () => void;
  descriptionError?: string;

  phone: string;
  onPhoneChange: (value: string) => void;
  onPhoneBlur: () => void;
  phoneError?: string;

  clientContacts: MasterContactRow[];
  onAddContact: (type: ContactType) => void;
  onChangeContact: (id: string, value: string) => void;
  onRemoveContact: (id: string) => void;
  onBlurContact: (id: string) => void;
  contactRowErrors: Record<string, string>;
  showContactRowError: (id: string) => boolean;
  contactReachabilityError?: string;
  showContactReachabilityError: boolean;

  isAuthenticated: boolean;
  profileAvatarUrl: string | null;
  telegramPhotoUrl?: string | null;
  onAvatarUpdated?: () => void | Promise<void>;
};

export function OnboardingStep3Profile({
  name,
  onNameChange,
  onNameBlur,
  nameError,
  description,
  onDescriptionChange,
  onDescriptionBlur,
  descriptionError,
  phone,
  onPhoneChange,
  onPhoneBlur,
  phoneError,
  clientContacts,
  onAddContact,
  onChangeContact,
  onRemoveContact,
  onBlurContact,
  contactRowErrors,
  showContactRowError,
  contactReachabilityError,
  showContactReachabilityError,
  isAuthenticated,
  profileAvatarUrl,
  telegramPhotoUrl,
  onAvatarUpdated,
}: OnboardingStep3ProfileProps) {
  const intro = (
    <>
      <p className={onboardingEyebrowClass}>Профиль</p>
      <h1 className={onboardingStepTitleClass}>Расскажите о себе</h1>
      <p className="mt-3 hidden max-w-md text-[16px] leading-relaxed text-neutral-500 lg:block">
        Эти данные увидят клиенты перед записью.
      </p>
    </>
  );

  const formFields = (
    <div className="flex flex-col gap-6 lg:gap-5">
      <OnboardingProfileAvatar
        name={name}
        isAuthenticated={isAuthenticated}
        avatarUrl={profileAvatarUrl}
        telegramPhotoUrl={telegramPhotoUrl}
        onAvatarUpdated={onAvatarUpdated}
      />

      <ProfileField
          fieldId="name"
          label="Ваше имя или название"
          required
          value={name}
          onChange={onNameChange}
          onBlur={onNameBlur}
          placeholder="Фамилия Имя Отчество"
          error={nameError}
          maxLength={200}
        />

      <ProfileField
          fieldId="description"
          label="Описание"
          value={description}
          onChange={onDescriptionChange}
          onBlur={onDescriptionBlur}
          placeholder="Расскажите, чем занимаетесь и почему к вам стоит записаться"
          multiline
          error={descriptionError}
          maxLength={10_000}
        />

      <label
        data-onboarding-field="phone"
        className="block min-w-0 scroll-mt-28 rounded-[4px] transition-shadow duration-300 data-[onboarding-highlight]:shadow-[0_0_0_3px_rgba(226,149,149,0.45)] lg:scroll-mt-32"
      >
          <span className={mobileLabelClass}>
            <span
              className="flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-full border border-neutral-200 bg-white shadow-[0_2px_6px_rgba(17,17,17,0.04)] lg:border-0 lg:bg-[#EBEBEB] lg:shadow-none"
              title="Беларусь"
              aria-hidden
            >
              <BY title="Беларусь" className="h-full w-full object-cover" />
            </span>
            <span className="lg:hidden">Телефон для связи</span>
            <AdminSheetFieldLabel className={`hidden lg:inline ${sheetLabelClass}`}>
              Телефон
            </AdminSheetFieldLabel>
          </span>
          <input
            value={phone}
            onChange={(e) => onPhoneChange(e.target.value)}
            onBlur={onPhoneBlur}
            placeholder="+375 29 000-00-00"
            inputMode="tel"
            maxLength={19}
            className={mobileFieldClass}
          />
          {phoneError ? (
            <p className="mt-1.5 text-[12px] font-medium leading-snug text-red-600">{phoneError}</p>
          ) : null}
      </label>

      <div
        data-onboarding-field="contacts"
        className="scroll-mt-28 rounded-[4px] transition-shadow duration-300 data-[onboarding-highlight]:shadow-[0_0_0_3px_rgba(226,149,149,0.45)] lg:-mt-1 lg:scroll-mt-32"
      >
        <MasterProfileContactsBlock
            variant="catalog"
            rows={clientContacts}
            onAdd={onAddContact}
            onChange={onChangeContact}
            onRemove={onRemoveContact}
            onBlurRow={onBlurContact}
            rowErrors={contactRowErrors}
            showRowError={showContactRowError}
        />
      </div>
      {showContactReachabilityError && contactReachabilityError ? (
        <p className="mt-3 rounded-[18px] bg-[#FFF4E8] px-3 py-2 text-[12px] font-semibold leading-snug text-[#B66A24] lg:rounded-[10px]">
          {contactReachabilityError}
        </p>
      ) : null}
    </div>
  );

  return (
    <div className="w-full min-w-0 lg:grid lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)] lg:items-start lg:gap-10 xl:grid-cols-[minmax(0,400px)_minmax(0,1fr)] xl:gap-12">
      <div className="min-w-0 lg:sticky lg:top-6 lg:self-start">{intro}</div>
      <div className="mt-4 min-w-0 rounded-[24px] bg-[#f6f7fb] p-4 shadow-[0_4px_16px_rgba(17,24,39,0.04)] lg:mt-0 lg:p-5 max-lg:rounded-none max-lg:bg-transparent max-lg:p-0 max-lg:shadow-none">
        {formFields}
      </div>
    </div>
  );
}
