/**
 * Публичный адрес мастера (демо + будущий Supabase).
 * TODO: подключить геокодинг адреса.
 * TODO: сохранять location в Supabase masters_metadata.
 * TODO: добавить координаты lat/lng для карты.
 * TODO: добавить проверку адреса через внешний API.
 * TODO: скрывать sensitive-инструкции до подтверждения записи, если потребуется.
 */

import { EMPTY_ADDRESS, LOCATION_EMPTY_SENTINEL } from '../../../shared/lib/emptyDisplayText';

/** «В салоне» или «На дому» (у клиента / домашний формат — уточняется в описании). */
export type MasterVisitType = 'studio' | 'at_home';

export type MasterLocation = {
  visitType: MasterVisitType;
  /** @deprecated оставлено для старых JSON; в UI не используем */
  city?: string;
  /** Основная строка адреса (поиск / карта / геокодер). */
  street: string;
  /** Доп. уточнение (подъезд, корпус) — опционально */
  building: string;
  /** Дом / корпус (деталь), опционально */
  buildingDetail?: string;
  /** Название салона / студии (studio) */
  salonName?: string;
  entrance?: string;
  floor?: string;
  room?: string;
  intercom?: string;
  landmark?: string;
  directions?: string;
  clientNote?: string;
  district?: string;
  /** Для at_home: точный адрес в каталоге только после записи */
  showExactAddressAfterBooking?: boolean;
  homeVisitMinPriceByn?: number;
  homeVisitComment?: string;
  onlineChannel?: string;
  onlineComment?: string;
  otherNote?: string;
  lat?: number;
  lng?: number;
  /** Координаты для расстояния, если lat/lng скрыты (приватный адрес). */
  distanceLat?: number;
  distanceLng?: number;
};

const VISIT_LABEL: Record<MasterVisitType, string> = {
  studio: 'Салон',
  at_home: 'На дому',
};

export function masterVisitTypeLabel(t: MasterVisitType): string {
  return VISIT_LABEL[t] ?? t;
}

function baseAddressLine(loc: MasterLocation): string {
  const s = loc.street.trim();
  const b = loc.building.trim();
  if (s && b && b !== 'б/н') return `${s}, ${b}`;
  return s || (b !== 'б/н' ? b : '');
}

function cityLabel(loc: MasterLocation): string {
  return (loc.city ?? '').trim() || 'Минск';
}

function normalizeAddrPart(s: string): string {
  return s.trim().toLowerCase().replace(/ё/g, 'е');
}

/** Минск по умолчанию — в карточках не дублируем название города. */
function isDefaultMinskCity(city: string): boolean {
  const c = normalizeAddrPart(city);
  return !c || c === 'минск' || c === 'minsk';
}

function isCityAddressPart(part: string, city: string): boolean {
  const pl = normalizeAddrPart(part);
  const cityKey = normalizeAddrPart(city);
  if (pl === cityKey || pl === 'минск' || pl === 'minsk') return true;
  if (pl === 'город минск') return true;
  if (pl.startsWith('город ') && cityKey && pl.includes(cityKey)) return true;
  return false;
}

/** Убирает «Минск», «город Минск» и повторы города из строки геокодера. */
export function stripCityFromAddressLine(line: string, city: string): string {
  const parts = line
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean);
  if (!parts.length) return line.trim();
  const filtered = parts.filter((p) => !isCityAddressPart(p, city));
  if (filtered.length) return filtered.join(', ');
  const withoutLead = parts.filter((p, i) => !(i === 0 && isCityAddressPart(p, city)));
  return withoutLead.join(', ') || line.trim();
}

function withCityPrefixIfNeeded(city: string, line: string): string {
  const cleaned = line.trim();
  const c = (city ?? '').trim() || 'Минск';
  if (!cleaned) return isDefaultMinskCity(c) ? '' : c;
  if (isDefaultMinskCity(c)) return cleaned;
  const cityNorm = normalizeAddrPart(c);
  if (normalizeAddrPart(cleaned).includes(cityNorm)) return cleaned;
  return `${c}, ${cleaned}`;
}

function streetBuildingLine(loc: MasterLocation, streetRaw: string): string {
  const street = stripCityFromAddressLine(streetRaw, cityLabel(loc));
  const building = loc.building.trim();
  if (street && building && building !== 'б/н' && !buildingRedundantWithStreet(street, building)) {
    return `${street}, ${building}`;
  }
  return street || (building !== 'б/н' ? building : '');
}

function buildAtHomeAddressLine(loc: MasterLocation, includeBuilding: boolean): string {
  const c = cityLabel(loc);
  const line = includeBuilding
    ? streetBuildingLine(loc, loc.street.trim())
    : stripCityFromAddressLine(loc.street.trim(), c);
  return withCityPrefixIfNeeded(c, line);
}

/** Адрес для API / БД без префикса «На дому». */
export function formatStoredPublicAddress(loc: MasterLocation | null | undefined): string {
  if (!loc) return '';
  if (loc.visitType === 'at_home') {
    if (isHomeAddressHiddenUntilBooking(loc)) {
      return buildAtHomeAddressLine(loc, false);
    }
    return buildAtHomeAddressLine(loc, true);
  }
  const c = cityLabel(loc);
  const line = streetBuildingLine(loc, loc.street.trim());
  const core = withCityPrefixIfNeeded(c, line);
  const salon = loc.salonName?.trim();
  if (salon && core) return `${salon}, ${core}`;
  return salon || core;
}

/** Дом/корпус уже есть в строке улицы (часто после геокодера). */
function buildingRedundantWithStreet(street: string, building: string): boolean {
  const b = building.trim();
  if (!b || b === 'б/н') return true;
  const s = street.trim().toLowerCase();
  if (!s) return false;
  if (s === b.toLowerCase()) return true;
  if (s.endsWith(`, ${b.toLowerCase()}`)) return true;
  if (s.includes(b.toLowerCase())) return true;
  return false;
}

/** Короткая строка для карточек */
export function formatPublicAddress(loc: MasterLocation | null | undefined): string {
  if (!loc) return '';
  const base = baseAddressLine(loc);
  if (loc.visitType === 'at_home') {
    const visit = masterVisitTypeLabel('at_home');
    if (isHomeAddressHiddenUntilBooking(loc)) {
      const publicLine = formatHomePublicBeforeBooking(loc);
      return publicLine ? `${visit}, ${publicLine}` : visit;
    }
    const line = formatHomeAfterBookingMainLine(loc);
    return line ? `${visit}, ${line}` : visit;
  }
  if (!base) return 'Адрес пока не указан';
  const c = cityLabel(loc);
  const street = stripCityFromAddressLine(loc.street.trim(), c);
  const line = baseAddressLine({ ...loc, street });
  const core = line || base;
  const salon = loc.salonName?.trim();
  return salon ? `${salon}, ${core}` : core;
}

/**
 * Строка «до записи» для at_home: город + поле «Адрес приёма» (улица/район),
 * без дома, подъезда и прочих деталей из «Дополнительно».
 */
export function formatHomePublicBeforeBooking(loc: MasterLocation | null | undefined): string {
  if (!loc || loc.visitType !== 'at_home') return '';
  const line = buildAtHomeAddressLine(loc, false);
  if (line) return line;
  const d = loc.district?.trim();
  if (!d) return isDefaultMinskCity(cityLabel(loc)) ? '' : cityLabel(loc);
  return withCityPrefixIfNeeded(cityLabel(loc), d);
}

/** Основная строка адреса с городом (салон или полный адрес без режима скрытия). */
export function formatCityWithAddressLine(loc: MasterLocation | null | undefined): string {
  if (!loc) return '';
  if (loc.visitType === 'at_home') return buildAtHomeAddressLine(loc, true);
  return formatStoredPublicAddress(loc);
}

/** Полная строка «после записи» для at_home: улица и дом без дубля города. */
export function formatHomeAfterBookingMainLine(loc: MasterLocation | null | undefined): string {
  if (!loc || loc.visitType !== 'at_home') return formatCityWithAddressLine(loc);
  return buildAtHomeAddressLine(loc, true);
}

/** Детали приёма на дому — только из «Дополнительно», после записи. */
export function homeAfterBookingDetailLines(loc: MasterLocation | null | undefined): string[] {
  if (!loc || loc.visitType !== 'at_home') return [];
  const lines: string[] = [];
  if (loc.buildingDetail?.trim()) lines.push(loc.buildingDetail.trim());
  if (loc.entrance?.trim()) lines.push(`подъезд ${loc.entrance.trim()}`);
  if (loc.floor?.trim()) lines.push(`этаж ${loc.floor.trim()}`);
  if (loc.room?.trim()) lines.push(`квартира ${loc.room.trim()}`);
  if (loc.intercom?.trim()) lines.push(`код домофона ${loc.intercom.trim()}`);
  if (loc.directions?.trim()) lines.push(loc.directions.trim());
  if (loc.clientNote?.trim()) lines.push(`Комментарий: ${loc.clientNote.trim()}`);
  return lines;
}

/** Адрес в карточке записи клиента (уже после бронирования). */
export function formatClientAppointmentAddress(loc: MasterLocation | null | undefined): string {
  return formatFullAddress(loc);
}

export type LocationDetailField = { label: string; value: string };

export type LocationDisplayParts = {
  visitLabel: string;
  /** Строка для каталога (как formatPublicAddress). */
  catalogLine: string;
  /** Основной адрес после записи. */
  addressLine: string;
  access: LocationDetailField[];
  wayfinding: LocationDetailField[];
};

/** Структурированные части адреса для карточек и кабинета мастера. */
export function buildLocationDisplayParts(loc: MasterLocation | null | undefined): LocationDisplayParts | null {
  if (!loc) return null;

  const visitLabel = masterVisitTypeLabel(loc.visitType);
  const catalogLine = formatPublicAddress(loc);
  const addressLine =
    loc.visitType === 'at_home'
      ? formatHomeAfterBookingMainLine(loc)
      : baseAddressLine(loc) || formatCityWithAddressLine(loc) || EMPTY_ADDRESS;

  const access: LocationDetailField[] = [];
  if (loc.buildingDetail?.trim()) {
    access.push({ label: 'Дом / корпус', value: loc.buildingDetail.trim() });
  }
  if (loc.entrance?.trim()) access.push({ label: 'Подъезд', value: loc.entrance.trim() });
  if (loc.floor?.trim()) access.push({ label: 'Этаж', value: loc.floor.trim() });
  if (loc.room?.trim()) {
    access.push({
      label: loc.visitType === 'at_home' ? 'Квартира' : 'Кабинет',
      value: loc.room.trim(),
    });
  }
  if (loc.intercom?.trim()) access.push({ label: 'Домофон', value: loc.intercom.trim() });

  const wayfinding: LocationDetailField[] = [];
  if (loc.salonName?.trim() && loc.visitType === 'studio') {
    wayfinding.push({ label: 'Салон', value: loc.salonName.trim() });
  }
  if (loc.district?.trim()) wayfinding.push({ label: 'Район / метро', value: loc.district.trim() });
  if (loc.landmark?.trim()) wayfinding.push({ label: 'Ориентир', value: loc.landmark.trim() });
  if (loc.directions?.trim()) wayfinding.push({ label: 'Как пройти', value: loc.directions.trim() });
  if (loc.clientNote?.trim()) wayfinding.push({ label: 'Комментарий', value: loc.clientNote.trim() });

  return { visitLabel, catalogLine, addressLine, access, wayfinding };
}

/** Детали адреса для блока «После записи» в кабинете мастера. */
export function buildLocationAfterBookingPreview(
  loc: MasterLocation | null | undefined,
): LocationDetailField[] {
  if (!loc) return [];
  const rows: LocationDetailField[] = [];
  const mainLine =
    loc.visitType === 'at_home'
      ? formatHomeAfterBookingMainLine(loc)
      : baseAddressLine(loc) || formatCityWithAddressLine(loc);
  if (mainLine?.trim()) rows.push({ label: 'Адрес', value: mainLine.trim() });
  const parts = buildLocationDisplayParts(loc);
  if (!parts) return rows;
  return [...rows, ...parts.access, ...parts.wayfinding];
}

/** «На дому» + режим «после записи» (по умолчанию для at_home). */
export function isHomeAddressHiddenUntilBooking(loc: MasterLocation | null | undefined): boolean {
  return loc?.visitType === 'at_home' && loc.showExactAddressAfterBooking !== false;
}

const AT_HOME_SENSITIVE_ACCESS_LABELS = new Set([
  'подъезд',
  'этаж',
  'квартира',
  'домофон',
  'дом / корпус',
]);

/** Подъезд, этаж, квартира, домофон — не показываем до записи. */
export function filterAtHomeSensitiveAccessRows(
  rows: LocationDetailField[],
  loc: MasterLocation | null | undefined,
): LocationDetailField[] {
  if (!loc || loc.visitType !== 'at_home' || !isHomeAddressHiddenUntilBooking(loc)) return rows;
  return rows.filter((row) => !AT_HOME_SENSITIVE_ACCESS_LABELS.has(row.label.trim().toLowerCase()));
}

export function catalogLineWithoutVisitPrefix(catalogLine: string, visitLabel: string): string {
  const prefix = `${visitLabel}, `;
  if (catalogLine.startsWith(prefix)) return catalogLine.slice(prefix.length);
  return catalogLine;
}

/** Полная строка для подтверждений (многострочно, с подписями полей). */
export function formatFullAddress(loc: MasterLocation | null | undefined): string {
  const parts = buildLocationDisplayParts(loc);
  if (!parts) return '';
  const lines: string[] = [];
  if (parts.addressLine && parts.addressLine !== EMPTY_ADDRESS && parts.addressLine !== LOCATION_EMPTY_SENTINEL) {
    lines.push(parts.addressLine);
  }
  for (const row of [...parts.access, ...parts.wayfinding]) {
    lines.push(`${row.label}: ${row.value}`);
  }
  return lines.join('\n');
}

/** Текст блока «Как пройти» на экране записи (компактно). */
export function formatBookingHowToFind(loc: MasterLocation | null | undefined): string {
  if (!loc) return '';
  const parts: string[] = [];
  if (loc.floor?.trim()) parts.push(loc.floor.trim());
  if (loc.room?.trim()) parts.push(loc.room.trim());
  if (loc.entrance?.trim()) parts.push(`вход ${loc.entrance.trim()}`);
  if (loc.directions?.trim()) parts.push(loc.directions.trim());
  return parts.join('. ') || baseAddressLine(loc);
}

/** Строка для поиска по адресу */
export function masterLocationSearchHaystack(loc: MasterLocation | null | undefined): string {
  if (!loc) return '';
  const bits = [
    loc.city,
    loc.street,
    loc.building,
    loc.buildingDetail,
    loc.salonName,
    loc.district,
    loc.landmark,
    loc.entrance,
    loc.room,
    loc.floor,
    loc.intercom,
    loc.directions,
    loc.clientNote,
    loc.onlineChannel,
    loc.homeVisitComment,
    loc.otherNote,
    formatPublicAddress(loc),
    masterVisitTypeLabel(loc.visitType),
  ];
  return bits.map((s) => (s ?? '').trim().toLowerCase()).filter(Boolean).join(' ');
}

/** Строки для UI «Подробнее» / профиль / детали записи */
export function masterLocationDetailRows(
  loc: MasterLocation | null | undefined,
  opts?: { revealed?: boolean },
): { label: string; value: string }[] {
  if (!loc) return [];
  const revealed = opts?.revealed === true;
  const rows: { label: string; value: string }[] = [];
  rows.push({ label: 'Формат', value: masterVisitTypeLabel(loc.visitType) });
  if (loc.salonName?.trim()) rows.push({ label: 'Салон', value: loc.salonName.trim() });
  const hideHomeUntilBooking = isHomeAddressHiddenUntilBooking(loc);
  const addressValue =
    loc.visitType === 'at_home' && hideHomeUntilBooking && !revealed
      ? stripCityFromAddressLine(loc.street.trim(), cityLabel(loc)) || EMPTY_ADDRESS
      : loc.visitType === 'at_home'
        ? formatHomeAfterBookingMainLine(loc)
        : baseAddressLine(loc) || EMPTY_ADDRESS;
  rows.push({ label: 'Адрес', value: addressValue });

  if (loc.visitType === 'at_home' && hideHomeUntilBooking && !revealed) {
    return rows;
  }

  if (loc.visitType === 'at_home' && revealed && hideHomeUntilBooking) {
    for (const line of homeAfterBookingDetailLines(loc)) {
      rows.push({ label: ' ', value: line });
    }
    return rows;
  }

  if (loc.buildingDetail?.trim()) rows.push({ label: 'Дом / корпус', value: loc.buildingDetail.trim() });
  if (loc.district?.trim()) rows.push({ label: 'Район / метро', value: loc.district.trim() });
  if (loc.entrance?.trim()) rows.push({ label: 'Вход', value: loc.entrance.trim() });
  if (loc.floor?.trim()) rows.push({ label: 'Этаж', value: loc.floor.trim() });
  if (loc.room?.trim()) rows.push({ label: 'Кабинет', value: loc.room.trim() });
  if (loc.intercom?.trim()) rows.push({ label: 'Домофон / ресепшен', value: loc.intercom.trim() });
  if (loc.landmark?.trim()) rows.push({ label: 'Ориентир', value: loc.landmark.trim() });
  if (loc.directions?.trim()) rows.push({ label: 'Как пройти', value: loc.directions.trim() });
  if (loc.clientNote?.trim()) rows.push({ label: 'Комментарий мастера', value: loc.clientNote.trim() });
  return rows;
}
