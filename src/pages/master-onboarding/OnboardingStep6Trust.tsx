import { useMemo, useState, type ChangeEvent } from 'react';
import { PortfolioImagePreview } from '../client/masterProfile/PortfolioImagePreview';
import type { MasterCertificate } from '../../features/master-onboarding/model/masterCertificate';
import { CertificateDocumentThumb } from './CertificateDocumentThumb';
import {
  formatCertificateDisplayTitle,
  resolveCertificateOrganizationAndYear,
} from './certificateDisplay';
import { OnboardingCertificatePhotoField } from './OnboardingCertificatePhotoField';
import { AdminSheetFieldLabel } from '../admin/shared/AdminFormFieldLabel';
import { AdminFormSheetSection } from '../admin/shared/AdminFormSheetLayout';
import {
  sheetCancelBtnClass,
  sheetFieldClass,
  sheetHintClass,
  sheetLabelClass,
  sheetPrimaryBtnClass,
} from '../admin/profile/adminProfileCabinetTheme';
import { OnboardingEducationBlock } from './OnboardingEducationBlock';
import {
  onboardingEyebrowClass,
  onboardingFieldScrollClass,
  onboardingStepTitleClass,
} from './onboardingFormField';
import type { OnboardingEducationItem } from './onboardingEducation';
import { OnboardingTrustPreview } from './OnboardingTrustPreview';

const dashedAddBtnClass =
  'flex min-h-11 w-full items-center justify-center rounded-[10px] border-2 border-dashed border-[#E29595]/55 bg-[#FFF9FB] px-4 text-[14px] font-semibold text-[#111827] transition hover:border-[#F47C8C]/75 hover:bg-[#FFF1F4] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50';

type Props = {
  certificates: MasterCertificate[];
  educationItems: OnboardingEducationItem[];
  onEducationChange: (items: OnboardingEducationItem[]) => void;
  certFormVisible: boolean;
  certEditingId: string | null;
  onOpenCertFormForAdd: () => void;
  onCancelCertForm: () => void;
  onSubmitCertificateForm: () => void;
  certTitle: string;
  onCertTitleChange: (value: string) => void;
  onCertTitleBlur: () => void;
  certTitleError?: string;
  certOrganization: string;
  onCertOrganizationChange: (value: string) => void;
  onCertOrganizationBlur: () => void;
  certOrganizationError?: string;
  certYear: string;
  onCertYearChange: (value: string) => void;
  onCertYearBlur: () => void;
  certYearError?: string;
  certDesc: string;
  onCertDescChange: (value: string) => void;
  onCertDescBlur: () => void;
  certDescError?: string;
  certImageUrl: string;
  onCertImageFileChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onClearCertPhoto: () => void;
  certPhotoUploading?: boolean;
  certPhotoUploadErr?: string | null;
  certPhotoError?: string;
  onStartEditCertificate: (certificate: MasterCertificate) => void;
  onRemoveCertificate: (id: string) => void;
};

function fieldErrorClass(error?: string) {
  return error ? 'mt-1.5 text-[12px] font-medium leading-snug text-red-600' : 'hidden';
}

export function OnboardingStep6Trust({
  certificates,
  educationItems,
  onEducationChange,
  certFormVisible,
  certEditingId,
  onOpenCertFormForAdd,
  onCancelCertForm,
  onSubmitCertificateForm,
  certTitle,
  onCertTitleChange,
  onCertTitleBlur,
  certTitleError,
  certOrganization,
  onCertOrganizationChange,
  onCertOrganizationBlur,
  certOrganizationError,
  certYear,
  onCertYearChange,
  onCertYearBlur,
  certYearError,
  certDesc,
  onCertDescChange,
  onCertDescBlur,
  certDescError,
  certImageUrl,
  onCertImageFileChange,
  onClearCertPhoto,
  certPhotoUploading,
  certPhotoUploadErr,
  certPhotoError,
  onStartEditCertificate,
  onRemoveCertificate,
}: Props) {
  const [certPreviewIndex, setCertPreviewIndex] = useState<number | null>(null);

  const certImageUrls = useMemo(
    () =>
      certificates
        .map((c) => c.imageUrl?.trim())
        .filter((url): url is string => Boolean(url)),
    [certificates],
  );

  const intro = (
    <>
      <p className={onboardingEyebrowClass}>Доверие</p>
      <h1 className={onboardingStepTitleClass}>Сертификаты и образование</h1>
      <p className="mt-2 text-[14px] font-medium leading-snug text-[#6B7280] lg:text-[15px]">
        Дипломы, курсы и учёба — по желанию, можно добавить позже
      </p>
    </>
  );

  const preview = (
    <OnboardingTrustPreview certificates={certificates} educationItems={educationItems} />
  );

  const certForm = certFormVisible ? (
    <div className="mt-4 space-y-4 border-t border-dashed border-[#E5E7EB] pt-4">
      <label className="block">
        <AdminSheetFieldLabel required className={sheetLabelClass}>
          Название сертификата
        </AdminSheetFieldLabel>
        <input
          value={certTitle}
          onChange={(e) => onCertTitleChange(e.target.value)}
          onBlur={onCertTitleBlur}
          className={sheetFieldClass}
          placeholder="Например, курс аппаратного маникюра"
          maxLength={300}
        />
        <p className={fieldErrorClass(certTitleError)}>{certTitleError}</p>
      </label>

      <label className="block">
        <AdminSheetFieldLabel className={sheetLabelClass}>Организация</AdminSheetFieldLabel>
        <input
          value={certOrganization}
          onChange={(e) => onCertOrganizationChange(e.target.value)}
          onBlur={onCertOrganizationBlur}
          className={sheetFieldClass}
          placeholder="Например, Nail School Minsk"
          maxLength={300}
        />
        <p className={fieldErrorClass(certOrganizationError)}>{certOrganizationError}</p>
      </label>

      <label className="block sm:max-w-[10rem]">
        <AdminSheetFieldLabel className={sheetLabelClass}>Год</AdminSheetFieldLabel>
        <input
          value={certYear}
          onChange={(e) => onCertYearChange(e.target.value)}
          onBlur={onCertYearBlur}
          inputMode="numeric"
          className={sheetFieldClass}
          placeholder="2024"
          maxLength={4}
        />
        <p className={fieldErrorClass(certYearError)}>{certYearError}</p>
      </label>

      <label className="block">
        <AdminSheetFieldLabel className={sheetLabelClass}>Описание</AdminSheetFieldLabel>
        <textarea
          value={certDesc}
          onChange={(e) => onCertDescChange(e.target.value)}
          onBlur={onCertDescBlur}
          rows={3}
          maxLength={1000}
          className={`${sheetFieldClass} resize-none leading-relaxed`}
          placeholder="Коротко о курсе или направлении"
        />
        <p className={fieldErrorClass(certDescError)}>{certDescError}</p>
      </label>

      <OnboardingCertificatePhotoField
        imageUrl={certImageUrl}
        onFileChange={onCertImageFileChange}
        onClear={onClearCertPhoto}
        uploading={certPhotoUploading}
        uploadErr={certPhotoUploadErr}
        fieldError={certPhotoError}
        disabled={certPhotoUploading}
      />
      {!certPhotoUploadErr && certImageUrl.startsWith('blob:') ? (
        <p className={`${sheetHintClass} -mt-2`}>Фото прикреплено — загрузится при публикации профиля</p>
      ) : null}

      <div className="flex flex-col gap-2 sm:flex-row">
        <button type="button" onClick={onSubmitCertificateForm} className={`${sheetPrimaryBtnClass} sm:flex-1`}>
          {certEditingId ? 'Сохранить сертификат' : 'Добавить сертификат'}
        </button>
        <button type="button" onClick={onCancelCertForm} className={`${sheetCancelBtnClass} sm:shrink-0`}>
          Отмена
        </button>
      </div>
    </div>
  ) : null;

  const certList =
    certificates.length > 0 ? (
      <ul className="mt-4 space-y-2 border-t border-dashed border-[#E5E7EB] pt-4">
        {certificates.map((certificate) => {
          const { organization, year } = resolveCertificateOrganizationAndYear(
            certificate.organization,
            certificate.year,
          );
          return (
            <li
              key={certificate.id}
              className={`flex gap-3.5 overflow-hidden rounded-[14px] bg-white p-3 shadow-[0_1px_8px_rgba(17,24,39,0.05)] ring-1 ring-[#EAECEF] ${
                certEditingId === certificate.id ? 'ring-2 ring-[#F47C8C]/40' : ''
              }`}
            >
              {certificate.imageUrl?.trim() ? (
                <button
                  type="button"
                  onClick={() => {
                    const url = certificate.imageUrl!.trim();
                    const index = certImageUrls.indexOf(url);
                    setCertPreviewIndex(index >= 0 ? index : 0);
                  }}
                  className="shrink-0 cursor-zoom-in rounded-[12px] transition active:opacity-90"
                  aria-label={`Увеличить: ${formatCertificateDisplayTitle(certificate.title)}`}
                >
                  <CertificateDocumentThumb
                    src={certificate.imageUrl}
                    alt={formatCertificateDisplayTitle(certificate.title)}
                    variant="row"
                  />
                </button>
              ) : null}
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-semibold leading-snug tracking-[-0.01em] text-[#111827]">
                  {formatCertificateDisplayTitle(certificate.title)}
                </p>
                {organization ? (
                  <p className="mt-0.5 text-[12px] font-medium text-[#6B7280]">{organization}</p>
                ) : null}
                {year ? (
                  <p className="mt-0.5 text-[11px] font-semibold tabular-nums text-[#9CA3AF]">{year}</p>
                ) : null}
                {certificate.description ? (
                  <p className="mt-1 line-clamp-2 text-[12px] leading-snug text-[#6B7280]">
                    {certificate.description}
                  </p>
                ) : null}
                <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[12px] font-semibold">
                  <button
                    type="button"
                    onClick={() => onStartEditCertificate(certificate)}
                    className="text-[#F47C8C] underline-offset-2 hover:underline"
                  >
                    Редактировать
                  </button>
                  <button
                    type="button"
                    onClick={() => onRemoveCertificate(certificate.id)}
                    className="text-[#6B7280] underline-offset-2 hover:underline"
                  >
                    Удалить
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    ) : null;

  const certPreviewModal =
    certPreviewIndex != null && certImageUrls.length > 0 ? (
      <PortfolioImagePreview
        urls={certImageUrls}
        index={certPreviewIndex}
        singleLabel="Сертификат"
        onClose={() => setCertPreviewIndex(null)}
        onIndexChange={setCertPreviewIndex}
      />
    ) : null;

  const form = (
    <div className="space-y-4">
      <AdminFormSheetSection
        title="Сертификаты"
        description="Курсы и дипломы повышают доверие клиентов"
      >
        <button
          type="button"
          onClick={onOpenCertFormForAdd}
          disabled={certFormVisible && !certEditingId}
          className={dashedAddBtnClass}
        >
          + Добавить сертификат
        </button>

        {certForm}

        {certificates.length === 0 && !certFormVisible ? (
          <p className="mt-3 text-center text-[12px] font-medium text-[#6B7280] lg:text-left">
            Сертификаты можно добавить позже в кабинете
          </p>
        ) : null}

        {certList}
      </AdminFormSheetSection>

      <AdminFormSheetSection
        title="Образование"
        description="Колледж, вуз или курсы повышения квалификации"
      >
        <OnboardingEducationBlock
          variant="cabinet"
          embedded
          items={educationItems}
          onChange={onEducationChange}
        />
      </AdminFormSheetSection>

      <p className="text-center text-[12px] font-medium text-[#6B7280] lg:text-left">
        Можно добавить позже в кабинете
      </p>
    </div>
  );

  return (
    <>
      {certPreviewModal}
      <div
        data-onboarding-field="trust"
        className={`mt-0 scroll-mt-28 transition-shadow duration-300 data-[onboarding-highlight]:shadow-[0_0_0_3px_rgba(226,149,149,0.45)] lg:scroll-mt-32 ${onboardingFieldScrollClass}`}
      >
      <div className="w-full min-w-0 lg:grid lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)] lg:items-start lg:gap-10 xl:grid-cols-[minmax(0,400px)_minmax(0,1fr)] xl:gap-12">
        <div className="min-w-0 lg:sticky lg:top-6 lg:self-start">
          {intro}

          <div className="mt-5 hidden lg:block">{preview}</div>
        </div>

        <div className="mt-4 min-w-0 lg:mt-0">
          <div className="rounded-[24px] bg-[#f6f7fb] p-4 shadow-[0_4px_16px_rgba(17,24,39,0.04)] max-lg:rounded-none max-lg:bg-transparent max-lg:p-0 max-lg:shadow-none lg:p-5">
            {form}
          </div>
          <div className="mt-5 lg:hidden">{preview}</div>
        </div>
      </div>
    </div>
    </>
  );
}
