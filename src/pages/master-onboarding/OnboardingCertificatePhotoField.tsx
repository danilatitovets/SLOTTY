import { useRef, type ChangeEvent } from 'react';
import { CabinetIcon } from '../admin/profile/cabinetIcons';
import { AdminSheetFieldLabel } from '../admin/shared/AdminFormFieldLabel';
import { sheetHintClass, sheetLabelClass, sheetPinkPillBtnClass } from '../admin/profile/adminProfileCabinetTheme';

export const MAX_CERTIFICATE_IMAGE_BYTES = 5 * 1024 * 1024;

type Props = {
  imageUrl: string;
  onFileChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onClear: () => void;
  uploading?: boolean;
  uploadErr?: string | null;
  fieldError?: string;
  disabled?: boolean;
};

export function OnboardingCertificatePhotoField({
  imageUrl,
  onFileChange,
  onClear,
  uploading = false,
  uploadErr,
  fieldError,
  disabled = false,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const preview = imageUrl.trim();
  const hasError = Boolean(uploadErr || fieldError);
  const busy = uploading || disabled;

  return (
    <div className={hasError ? 'rounded-[12px] ring-2 ring-red-300/80' : undefined}>
      <AdminSheetFieldLabel className={`block ${sheetLabelClass}`}>Фото сертификата</AdminSheetFieldLabel>
      <p className={`mt-1 ${sheetHintClass}`}>JPEG, PNG или WebP, до 5 МБ</p>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/*"
        className="sr-only"
        onChange={onFileChange}
        disabled={busy}
      />
      <div className="relative mx-auto mt-2 w-full max-w-[280px] lg:mx-0">
        <div className="relative aspect-[4/3] overflow-hidden rounded-[12px] bg-[#EBEBEB]">
          {preview ? (
            <img
              src={preview}
              alt=""
              className="absolute inset-0 h-full w-full object-contain p-2"
              decoding="async"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[#9CA3AF]">
              <CabinetIcon name="photo" size={40} />
            </div>
          )}
        </div>
        <div className="absolute bottom-2 right-2 flex max-w-[calc(100%-0.5rem)] flex-wrap justify-end gap-1.5">
          <button
            type="button"
            disabled={busy}
            onClick={() => fileInputRef.current?.click()}
            className={sheetPinkPillBtnClass}
          >
            {uploading ? 'Загрузка…' : preview ? 'Сменить' : 'Прикрепить фото'}
          </button>
          {preview && !uploading ? (
            <button
              type="button"
              onClick={onClear}
              className="rounded-[10px] bg-white/95 px-3 py-2 text-[12px] font-semibold text-[#6B7280] shadow-sm ring-1 ring-[#EAECEF] transition hover:bg-white active:scale-[0.98]"
            >
              Удалить
            </button>
          ) : null}
        </div>
      </div>
      {uploadErr ? (
        <p className="mt-2 text-[12px] font-medium text-red-600">{uploadErr}</p>
      ) : null}
      {fieldError ? (
        <p className="mt-2 text-[12px] font-medium text-red-600">{fieldError}</p>
      ) : null}
    </div>
  );
}
