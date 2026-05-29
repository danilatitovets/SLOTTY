import { useCallback, useRef } from 'react';

import type { MapPickResult } from '../../features/geo/types';
import { LocationPickerModalField } from '../../shared/ui/location/LocationPickerModalField';

export type { MapPickResult };

/** Разбор строки «улица, дом» в поля формы fallback. */
export function splitReferenceLabelToStreetBuilding(label: string): {
  street: string;
  building: string;
} {
  const t = label.trim();
  const m = t.match(/^(.+?),\s*([^,]{1,40})\s*$/);

  if (m && m[1].trim() && m[2].trim()) {
    return {
      street: m[1].trim(),
      building: m[2].trim(),
    };
  }

  return {
    street: t,
    building: 'б/н',
  };
}

export function splitReferenceLabelToStreetBuildingLenient(label: string): {
  street: string;
  building: string;
} {
  const trimmed = label.trim();
  const m = trimmed.match(/^(.+?),\s*([^,]{1,40})\s*$/);
  if (m && m[1].trim() && m[2].trim()) {
    return { street: m[1].trim(), building: m[2].trim() };
  }
  return { street: label, building: 'б/н' };
}

type Props = {
  city: string;
  onPick: (res: MapPickResult) => void;
  visitType?: 'studio' | 'at_home';
  coordsError?: string;
  initialLat?: number | null;
  initialLng?: number | null;
  onMapAvailabilityChange?: (available: boolean) => void;
  addressSummary?: string | null;
  street?: string;
  onStreetChange?: (value: string) => void;
  onStreetResolved?: (value: string) => void;
  inputLabel?: string;
  inputPlaceholder?: string;
  inputError?: string;
  onInputBlur?: () => void;
  inputMaxLength?: number;
  viewportDropdown?: boolean;
  suppressSuggestUntilFocus?: boolean;
  addressCommitted?: boolean;
  inputClassName?: string;
  addressLine?: string;
  /** @deprecated Всегда используется модалка; оставлено для совместимости. */
  mapInModal?: boolean;
};

export function OnboardingAddressMap({
  city,
  onPick,
  visitType: _visitType = 'studio',
  coordsError,
  initialLat,
  initialLng,
  onMapAvailabilityChange,
  addressSummary = null,
  street,
  onStreetChange,
  onStreetResolved,
  inputLabel,
  inputPlaceholder = 'Введите улицу и дом',
  inputError,
  onInputBlur,
  inputMaxLength = 200,
  suppressSuggestUntilFocus = false,
  addressCommitted = false,
  inputClassName,
  addressLine: addressLineLegacy = '',
}: Props) {
  const onPickRef = useRef(onPick);
  onPickRef.current = onPick;

  const hasIntegratedInput = onStreetChange != null;
  const streetValue = hasIntegratedInput ? street ?? '' : addressLineLegacy;

  const handleLocationChange = useCallback(
    (next: { address: string; latitude: number; longitude: number }) => {
      onPickRef.current({
        addressLine: next.address,
        lat: next.latitude,
        lng: next.longitude,
      });
    },
    [],
  );

  if (!hasIntegratedInput) {
    return null;
  }

  return (
    <div className="space-y-2">
      {inputLabel ? (
        <p className="text-[13px] font-semibold text-neutral-600">{inputLabel}</p>
      ) : null}

      <LocationPickerModalField
        value={streetValue}
        latitude={initialLat}
        longitude={initialLng}
        city={city}
        onChange={handleLocationChange}
        onInputChange={onStreetChange}
        onAddressResolved={onStreetResolved}
        placeholder={inputPlaceholder}
        error={inputError}
        coordsError={coordsError}
        inputClassName={inputClassName}
        suppressSuggestUntilFocus={suppressSuggestUntilFocus}
        addressCommitted={addressCommitted}
        onInputBlur={onInputBlur}
        inputMaxLength={inputMaxLength}
        onMapAvailabilityChange={onMapAvailabilityChange}
        modalTitle="Адрес на карте"
        modalSubtitle="Введите улицу, выберите подсказку или поставьте метку на карте."
        triggerLabel="Выбрать адрес на карте"
      />

      {addressSummary?.trim() ? (
        <p className="text-[13px] font-medium text-neutral-700">
          Выбрано: <span className="text-neutral-900">{addressSummary.trim()}</span>
        </p>
      ) : null}
    </div>
  );
}
