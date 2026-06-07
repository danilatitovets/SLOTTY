import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { HiMapPin } from 'react-icons/hi2';

import { PickerSheet, pickerSheetPrimaryBtn } from '../PickerSheet';
import { LocationPicker, type LocationPickerProps, type LocationPickerValue } from './LocationPicker';

type Draft = {
  address: string;
  latitude: number | null;
  longitude: number | null;
};

export type LocationPickerModalFieldProps = Omit<
  LocationPickerProps,
  'label' | 'showRouteLink' | 'viewportDropdown' | 'portalSuggestions' | 'suggestionsZIndex'
> & {
  triggerLabel?: string;
  modalTitle?: string;
  modalSubtitle?: string;
  summaryClassName?: string;
  triggerClassName?: string;
  triggerBackdrop?: ReactNode;
};

function formatAddressSummary(address: string, hasCoords: boolean): string {
  const line = address.trim();
  if (line) return line;
  return hasCoords ? 'Точка на карте без адреса' : 'Адрес не указан';
}

export function LocationPickerModalField({
  value,
  latitude = null,
  longitude = null,
  city = 'Минск',
  onChange,
  onInputChange,
  onAddressResolved,
  error,
  coordsError,
  inputClassName,
  placeholder,
  suppressSuggestUntilFocus,
  addressCommitted,
  onInputBlur,
  inputMaxLength,
  onMapAvailabilityChange,
  triggerLabel = 'Выбрать адрес на карте',
  modalTitle = 'Адрес на карте',
  modalSubtitle = 'Найдите адрес или поставьте метку. Клиенты увидят это в профиле.',
  summaryClassName = 'rounded-[12px] border border-[#EAECEF] bg-white px-3.5 py-3',
  triggerClassName = 'mt-2 flex min-h-11 w-full items-center justify-center gap-2 rounded-[12px] bg-[#FFF1F4] px-4 text-[14px] font-semibold text-[#E29595] transition hover:bg-[#FFE8EC] active:scale-[0.98]',
  triggerBackdrop,
}: LocationPickerModalFieldProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Draft>({ address: '', latitude: null, longitude: null });
  const [draftCoordsError, setDraftCoordsError] = useState<string | null>(null);

  const hasCoords =
    latitude != null &&
    longitude != null &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude);

  const openModal = useCallback(() => {
    setDraft({
      address: value,
      latitude: hasCoords ? latitude : null,
      longitude: hasCoords ? longitude : null,
    });
    setDraftCoordsError(null);
    setOpen(true);
  }, [value, hasCoords, latitude, longitude]);

  useEffect(() => {
    if (!open) return;
    setDraft({
      address: value,
      latitude: hasCoords ? latitude : null,
      longitude: hasCoords ? longitude : null,
    });
  }, [open, value, hasCoords, latitude, longitude]);

  const applyDraft = () => {
    const address = draft.address.trim();
    if (draft.latitude == null || draft.longitude == null || !Number.isFinite(draft.latitude)) {
      setDraftCoordsError('Поставьте точку на карте');
      return;
    }
    if (address.length < 3) {
      setDraftCoordsError('Введите адрес');
      return;
    }
    const next: LocationPickerValue = {
      address,
      latitude: draft.latitude,
      longitude: draft.longitude,
    };
    onChange(next);
    onInputChange?.(address);
    onAddressResolved?.(address);
    setOpen(false);
    setDraftCoordsError(null);
  };

  const handleDraftChange = (next: LocationPickerValue) => {
    setDraft({
      address: next.address,
      latitude: next.latitude,
      longitude: next.longitude,
    });
    setDraftCoordsError(null);
  };

  return (
    <>
      <div className={summaryClassName}>
        <div className="flex items-start gap-2.5">
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-[#FFF1F4] text-[#E29595]">
            <HiMapPin className="h-4 w-4" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-semibold leading-snug text-[#111827]">
              {formatAddressSummary(value, hasCoords)}
            </p>
            <p className="mt-1 text-[12px] font-medium leading-snug text-[#6B7280]">
              {hasCoords ? 'Точка на карте выбрана' : 'Укажите адрес и метку на карте'}
            </p>
          </div>
        </div>
      </div>

      <button type="button" className={triggerClassName} onClick={openModal}>
        {triggerBackdrop}
        <span className={`flex items-center justify-center gap-2 ${triggerBackdrop ? 'relative z-10 drop-shadow-sm' : ''}`}>
          <HiMapPin className="h-4 w-4 shrink-0" aria-hidden />
          {triggerLabel}
        </span>
      </button>

      {error ? (
        <p className="mt-1.5 text-[12px] font-medium leading-snug text-red-600">{error}</p>
      ) : null}
      {!open && coordsError ? (
        <p className="mt-1.5 text-[12px] leading-snug text-[#B66A24]">{coordsError}</p>
      ) : null}

      <PickerSheet
        open={open}
        onClose={() => setOpen(false)}
        title={modalTitle}
        subtitle={modalSubtitle}
        footer={
          <button type="button" className={pickerSheetPrimaryBtn} onClick={applyDraft}>
            Готово
          </button>
        }
      >
        {open ? (
          <LocationPicker
            label=""
            value={draft.address}
            latitude={draft.latitude}
            longitude={draft.longitude}
            city={city}
            onChange={handleDraftChange}
            onInputChange={(address) => {
              setDraft((prev) => ({ ...prev, address }));
              setDraftCoordsError(null);
            }}
            onAddressResolved={(address) => {
              setDraft((prev) => ({ ...prev, address }));
            }}
            placeholder={placeholder}
            coordsError={draftCoordsError ?? undefined}
            inputClassName={
              inputClassName
                ? inputClassName.replace(/\bmt-1\.5\b/g, '').trim()
                : 'w-full rounded-[12px] border-0 bg-[#F3F4F6] px-4 py-3 text-[16px] font-medium text-[#111827] outline-none placeholder:text-[#9CA3AF] focus:bg-[#ECECEC]'
            }
            suppressSuggestUntilFocus={suppressSuggestUntilFocus}
            addressCommitted={addressCommitted}
            onInputBlur={onInputBlur}
            inputMaxLength={inputMaxLength}
            onMapAvailabilityChange={onMapAvailabilityChange}
            showRouteLink={false}
            suggestStacked
            portalSuggestions={false}
            viewportDropdown={false}
            mapClassName="slotty-osm-map__canvas--picker-modal h-[min(240px,32dvh)] min-h-[220px] w-full sm:h-[min(300px,36dvh)]"
          />
        ) : null}
      </PickerSheet>
    </>
  );
}
