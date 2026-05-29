import { isEmptyDisplayValue } from '../../../shared/lib/emptyDisplayText';
import type { MasterVisitType } from '../model/masterLocation';

export const AT_HOME_ENTRANCE_MAX = 10;
/** Номер квартиры: 45, 12А, 3/2 — не длиннее 6 символов. */
export const AT_HOME_ROOM_MAX = 6;
export const AT_HOME_INTERCOM_MAX = 20;

/** Допустимый формат квартиры: 1–4 цифры, опционально буква или дробь. */
const AT_HOME_ROOM_RE = /^\d{1,4}([а-яА-Яa-zA-Z]|\/\d{1,2})?$/u;

export function sanitizeAtHomeRoomInput(raw: string): string {
  return raw
    .replace(/[^\dа-яА-Яa-zA-Z/-]/gu, '')
    .slice(0, AT_HOME_ROOM_MAX);
}

export function validateAtHomeEntrance(value: string): string | null {
  const t = value.trim();
  if (!t) return 'Укажите подъезд';
  if (t.length > AT_HOME_ENTRANCE_MAX) return `Не длиннее ${AT_HOME_ENTRANCE_MAX} символов`;
  if (!/^[\dа-яА-Яa-zA-Z/-]+$/u.test(t)) return 'Только цифры и буквы';
  return null;
}

export function validateAtHomeFloor(value: string): string | null {
  const t = value.trim();
  if (!t) return 'Укажите этаж';
  if (!/^-?\d{1,2}$/.test(t)) return 'Укажите этаж числом, например 3';
  const n = Number.parseInt(t, 10);
  if (!Number.isFinite(n) || n < -3 || n > 99) return 'Этаж от −3 до 99';
  if (t === '0' || t === '-0') return 'Укажите этаж от −3 до 99';
  return null;
}

export function validateAtHomeRoom(value: string): string | null {
  const t = value.trim();
  if (!t) return 'Укажите квартиру';
  if (t.length > AT_HOME_ROOM_MAX) return `Не длиннее ${AT_HOME_ROOM_MAX} символов`;
  if (!/^[\dа-яА-Яa-zA-Z/-]+$/u.test(t)) return 'Только цифры и буквы';
  if (!AT_HOME_ROOM_RE.test(t)) return 'Например: 45, 12А или 3/2';
  return null;
}

export function validateAtHomeIntercom(value: string): string | null {
  const t = value.trim();
  if (!t) return 'Укажите код домофона';
  if (t.length > AT_HOME_INTERCOM_MAX) return `Не длиннее ${AT_HOME_INTERCOM_MAX} символов`;
  if (!/^[\dа-яА-Яa-zA-Z#*+\s-]+$/u.test(t)) return 'Недопустимые символы в коде';
  return null;
}

export function isAtHomeAddressDetailsComplete(
  entrance: string,
  floor: string,
  room: string,
  intercom: string,
): boolean {
  return (
    validateAtHomeEntrance(entrance) === null &&
    validateAtHomeFloor(floor) === null &&
    validateAtHomeRoom(room) === null &&
    validateAtHomeIntercom(intercom) === null
  );
}

export type MasterAddressFormValues = {
  visitType: MasterVisitType;
  street: string;
  salonName: string;
  buildingDetail: string;
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

export type MasterAddressValidationOptions = {
  /** Карта Яндекса загрузилась — просим метку. */
  mapScriptOk?: boolean;
  /** Адрес подтверждён подсказкой или меткой на карте. */
  addressPinnedToMap?: boolean;
};

export function validateMasterAddressForm(
  values: MasterAddressFormValues,
  opts?: MasterAddressValidationOptions,
): Record<string, string> {
  const errs: Record<string, string> = {};
  const { visitType, street, salonName, buildingDetail, entrance, floor, room, intercom, directions, clientNote, lat, lng } =
    values;

  const streetTrim = street.trim();
  if (isEmptyDisplayValue(streetTrim)) {
    errs.street = visitType === 'studio' ? 'Укажите адрес салона' : 'Укажите адрес приёма';
  } else if (streetTrim.length > 200) {
    errs.street = 'Не длиннее 200 символов';
  }

  if (visitType === 'studio') {
    const sn = salonName.trim();
    if (!sn) errs.salonName = 'Укажите название салона или студии';
    else if (sn.length < 2) errs.salonName = 'Минимум 2 символа';
    else if (sn.length > 120) errs.salonName = 'Не длиннее 120 символов';

    if (entrance.trim().length > 120) errs.entrance = 'Не длиннее 120 символов';
    const studioFloorErr = floor.trim() ? validateAtHomeFloor(floor) : null;
    if (studioFloorErr) errs.floor = studioFloorErr;
    if (room.trim().length > 80) errs.room = 'Не длиннее 80 символов';
    if (intercom.trim().length > 80) errs.intercom = 'Не длиннее 80 символов';
  } else {
    const entranceErr = validateAtHomeEntrance(entrance);
    if (entranceErr) errs.entrance = entranceErr;

    const floorErr = validateAtHomeFloor(floor);
    if (floorErr) errs.floor = floorErr;

    const roomErr = validateAtHomeRoom(room);
    if (roomErr) errs.room = roomErr;

    const intercomErr = validateAtHomeIntercom(intercom);
    if (intercomErr) errs.intercom = intercomErr;

    if (buildingDetail.trim().length > 120) errs.buildingDetail = 'Не длиннее 120 символов';
  }

  if (directions.trim().length > 2000) errs.directions = 'Не длиннее 2000 символов';
  if (clientNote.trim().length > 2000) errs.clientNote = 'Не длиннее 2000 символов';
  if (values.landmark.trim().length > 240) errs.landmark = 'Не длиннее 240 символов';

  const mapScriptOk = opts?.mapScriptOk === true;
  const requirePinnedPoint = mapScriptOk && opts?.addressPinnedToMap === true;
  if (requirePinnedPoint) {
    const hasCoords =
      lat != null && lng != null && Number.isFinite(lat) && Number.isFinite(lng);
    if (!hasCoords) {
      errs.coords = 'Уточните точку на карте';
    }
  }

  return errs;
}
