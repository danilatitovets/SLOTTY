import type { MasterDraft } from '../../../../features/profile/lib/demoMasterStorage';
import {
  validateMasterAddressForm,
  type MasterAddressFormValues,
} from '../../../../features/profile/lib/masterAddressValidation';
import type { MasterLocation, MasterVisitType } from '../../../../features/profile/model/masterLocation';
import {
  buildLocationAfterBookingPreview,
  buildLocationDisplayParts,
  catalogLineWithoutVisitPrefix,
  formatHomePublicBeforeBooking,
  formatStoredPublicAddress,
  isHomeAddressHiddenUntilBooking,
  masterVisitTypeLabel,
} from '../../../../features/profile/model/masterLocation';
import { isEmptyDisplayValue } from '../../../../shared/lib/emptyDisplayText';

export const MASTER_CABINET_CITY = 'Минск';

/** Административные районы города Минска. */
export const MINSK_DISTRICTS = [
  'Центральный',
  'Советский',
  'Первомайский',
  'Партизанский',
  'Заводской',
  'Ленинский',
  'Октябрьский',
  'Московский',
  'Фрунзенский',
] as const;

export type MinskDistrict = (typeof MINSK_DISTRICTS)[number];

const MINSK_DISTRICT_LOOKUP = new Map<string, MinskDistrict>(
  MINSK_DISTRICTS.flatMap((name) => [
    [name.toLowerCase(), name],
    [`${name.toLowerCase()} район`, name],
    [`${name.toLowerCase()} р-н`, name],
  ]),
);

/** Приводит сохранённое значение к одному из районов Минска или к пустой строке. */
export function normalizeMinskDistrict(value: string | undefined | null): string {
  const raw = value?.trim() ?? '';
  if (!raw) return '';
  const exact = MINSK_DISTRICT_LOOKUP.get(raw.toLowerCase());
  if (exact) return exact;
  const partial = MINSK_DISTRICTS.find((name) => raw.toLowerCase().includes(name.toLowerCase()));
  return partial ?? '';
}

/** UI-формат: «выезд» пока не поддерживается бэкендом. */
export type AddressVisitFormat = MasterVisitType | 'client_visit';

export type AddressFormState = {
  visitType: AddressVisitFormat;
  street: string;
  building: string;
  salonName: string;
  buildingDetail: string;
  district: string;
  showExactAddressAfterBooking: boolean;
  entrance: string;
  floor: string;
  room: string;
  intercom: string;
  landmark: string;
  directions: string;
  clientNote: string;
  lat?: number;
  lng?: number;
};

export type MapPointStatus = 'verified' | 'needs_check' | 'not_found';

export type AddressChecklistItem = {
  id: string;
  label: string;
  done: boolean;
  hint?: string;
};

export function locationFingerprint(loc: MasterLocation): string {
  return [
    loc.visitType,
    loc.street,
    loc.building,
    loc.buildingDetail ?? '',
    loc.salonName ?? '',
    loc.district ?? '',
    loc.entrance ?? '',
    loc.floor ?? '',
    loc.room ?? '',
    loc.intercom ?? '',
    loc.landmark ?? '',
    loc.directions ?? '',
    loc.clientNote ?? '',
    loc.lat ?? '',
    loc.lng ?? '',
    loc.showExactAddressAfterBooking !== false ? '1' : '0',
  ].join('\x1e');
}

export function formStateFromLocation(loc: MasterLocation): AddressFormState {
  return {
    visitType: loc.visitType ?? 'studio',
    street: loc.street ?? '',
    building: loc.building ?? 'б/н',
    salonName: loc.salonName?.trim() ?? '',
    buildingDetail: loc.buildingDetail?.trim() ?? '',
    district: normalizeMinskDistrict(loc.district),
    showExactAddressAfterBooking: loc.showExactAddressAfterBooking !== false,
    entrance: loc.entrance ?? '',
    floor: loc.floor ?? '',
    room: loc.room ?? '',
    intercom: loc.intercom ?? '',
    landmark: loc.landmark ?? '',
    directions: loc.directions ?? '',
    clientNote: loc.clientNote ?? '',
    lat: loc.lat,
    lng: loc.lng,
  };
}

export function formFingerprint(form: AddressFormState): string {
  return JSON.stringify(form);
}

export function buildLocationFromForm(
  base: MasterLocation,
  form: AddressFormState,
): MasterLocation {
  if (form.visitType === 'client_visit') {
    return base;
  }
  const isHome = form.visitType === 'at_home';
  const hasCoords =
    typeof form.lat === 'number' &&
    Number.isFinite(form.lat) &&
    typeof form.lng === 'number' &&
    Number.isFinite(form.lng);

  return {
    ...base,
    visitType: form.visitType,
    city: MASTER_CABINET_CITY,
    street: form.street.trim(),
    building: form.building.trim() || 'б/н',
    salonName: !isHome ? form.salonName.trim() || undefined : undefined,
    buildingDetail: isHome ? form.buildingDetail.trim() || undefined : undefined,
    district: form.district.trim() || undefined,
    showExactAddressAfterBooking: isHome ? form.showExactAddressAfterBooking : false,
    entrance: form.entrance.trim() || undefined,
    floor: form.floor.trim() || undefined,
    room: form.room.trim() || undefined,
    intercom: form.intercom.trim() || undefined,
    landmark: form.landmark.trim() || undefined,
    directions: form.directions.trim() || undefined,
    clientNote: form.clientNote.trim() || undefined,
    ...(hasCoords ? { lat: form.lat, lng: form.lng } : { lat: undefined, lng: undefined }),
  };
}

export function toValidationValues(form: AddressFormState): MasterAddressFormValues {
  const visitType: MasterVisitType = form.visitType === 'client_visit' ? 'studio' : form.visitType;
  return {
    visitType,
    street: form.street,
    salonName: form.salonName,
    buildingDetail: form.buildingDetail,
    entrance: form.entrance,
    floor: form.floor,
    room: form.room,
    intercom: form.intercom,
    landmark: form.landmark,
    directions: form.directions,
    clientNote: form.clientNote,
    lat: form.lat,
    lng: form.lng,
  };
}

export function hasVerifiedMapPoint(form: AddressFormState): boolean {
  return (
    typeof form.lat === 'number' &&
    Number.isFinite(form.lat) &&
    typeof form.lng === 'number' &&
    Number.isFinite(form.lng)
  );
}

export function resolveMapPointStatus(
  form: AddressFormState,
  mapScriptOk: boolean,
  addressPinnedToMap: boolean,
): MapPointStatus {
  if (hasVerifiedMapPoint(form) && addressPinnedToMap) return 'verified';
  if (isEmptyDisplayValue(form.street.trim())) return 'not_found';
  if (mapScriptOk && !hasVerifiedMapPoint(form)) return 'needs_check';
  if (hasVerifiedMapPoint(form)) return 'verified';
  return 'needs_check';
}

export function buildPublicPreviewLine(loc: MasterLocation | null): string {
  if (!loc) return '';
  const visitType = loc.visitType ?? 'studio';
  const parts = buildLocationDisplayParts(loc);
  const visitLabel = parts?.visitLabel ?? masterVisitTypeLabel(visitType);
  const hiddenUntilBooking = isHomeAddressHiddenUntilBooking(loc);

  if (hiddenUntilBooking) {
    const publicLine = formatHomePublicBeforeBooking(loc);
    if (publicLine?.trim()) return publicLine.trim();
  }
  if (parts) return catalogLineWithoutVisitPrefix(parts.catalogLine, visitLabel);
  return formatStoredPublicAddress(loc);
}

export function hasAfterBookingDetails(form: AddressFormState): boolean {
  return Boolean(
    form.entrance.trim() ||
      form.floor.trim() ||
      form.room.trim() ||
      form.intercom.trim() ||
      form.directions.trim() ||
      form.clientNote.trim() ||
      form.landmark.trim() ||
      form.buildingDetail.trim(),
  );
}

export function isPublicAddressFilled(form: AddressFormState): boolean {
  if (form.visitType === 'client_visit') return true;
  if (isEmptyDisplayValue(form.street.trim())) return false;
  if (form.visitType === 'studio' && !form.salonName.trim()) return false;
  return true;
}

export function computeAddressChecklist(
  form: AddressFormState,
  opts: {
    mapScriptOk: boolean;
    addressPinnedToMap: boolean;
  },
): AddressChecklistItem[] {
  const mapOk = hasVerifiedMapPoint(form) && opts.addressPinnedToMap;
  const publicFilled = isPublicAddressFilled(form);
  const detailsFilled = hasAfterBookingDetails(form);
  const visitChosen = form.visitType === 'studio' || form.visitType === 'at_home';
  const ready =
    visitChosen &&
    publicFilled &&
    mapOk &&
    (form.visitType === 'studio' || detailsFilled);

  return [
    {
      id: 'visit',
      label: 'Формат приёма выбран',
      done: visitChosen,
      hint: visitChosen ? undefined : 'Выберите, где вы принимаете клиентов',
    },
    {
      id: 'city',
      label: 'Город указан',
      done: Boolean(MASTER_CABINET_CITY.trim()),
    },
    {
      id: 'street',
      label: 'Улица и дом указаны',
      done: !isEmptyDisplayValue(form.street.trim()),
      hint: 'Укажите улицу и дом в блоке «Публичный адрес»',
    },
    {
      id: 'map',
      label: 'Точка на карте найдена',
      done: mapOk,
      hint: mapOk ? undefined : 'Поставьте метку на карте или найдите адрес',
    },
    {
      id: 'details',
      label: 'Детали после записи заполнены',
      done: form.visitType === 'studio' ? true : detailsFilled,
      hint:
        form.visitType === 'at_home' && !detailsFilled
          ? 'Добавьте подъезд, этаж и другие подсказки для клиента'
          : undefined,
    },
    {
      id: 'ready',
      label: 'Адрес готов для клиентов',
      done: ready,
    },
  ];
}

export function previewLocationFromForm(
  base: MasterLocation,
  form: AddressFormState,
): MasterLocation {
  return buildLocationFromForm(base, form);
}

export function afterBookingPreviewRows(loc: MasterLocation) {
  const hiddenUntilBooking = isHomeAddressHiddenUntilBooking(loc);
  const parts = buildLocationDisplayParts(loc);
  if (hiddenUntilBooking) {
    return buildLocationAfterBookingPreview(loc).filter((row) => row.value?.trim());
  }
  if (!parts) return [];
  return [
    ...(parts.addressLine && !isEmptyDisplayValue(parts.addressLine)
      ? [{ label: 'Адрес', value: parts.addressLine }]
      : []),
    ...parts.access,
    ...parts.wayfinding,
  ].filter((row) => row.value?.trim());
}

export function validateAddressForm(
  form: AddressFormState,
  opts: { mapScriptOk: boolean; addressPinnedToMap: boolean },
): Record<string, string> {
  if (form.visitType === 'client_visit') {
    return {};
  }
  return validateMasterAddressForm(toValidationValues(form), opts);
}

export function streetDisplayLine(form: AddressFormState): string {
  const s = form.street.trim();
  const b = form.building.trim();
  if (s && b && b !== 'б/н') return `${s}, ${b}`;
  return s || (b !== 'б/н' ? b : '');
}

export type AddressFormStateFromDraft = {
  form: AddressFormState;
  fingerprint: string;
};

export function initialFormFromDraft(draft: MasterDraft): AddressFormStateFromDraft {
  const form = formStateFromLocation(draft.location);
  return { form, fingerprint: formFingerprint(form) };
}
