/**
 * Единая политика видимости адреса мастера (at_home / studio, до/после записи).
 */

export type MasterLocationSource = {
  id?: string;
  visitType: string;
  city: string;
  street: string;
  building: string;
  buildingDetail?: string | null;
  salonName?: string | null;
  entrance?: string | null;
  floor?: string | null;
  room?: string | null;
  intercom?: string | null;
  landmark?: string | null;
  directions?: string | null;
  clientNote?: string | null;
  publicAddress: string;
  lat?: number | null;
  lng?: number | null;
  showExactAddressAfterBooking?: boolean;
  isPrimary?: boolean;
};

export type SanitizeLocationContext = {
  viewerProfileId?: string;
  /** confirmed | completed — полный адрес клиенту этой записи */
  appointmentStatus?: string | null;
  isPublicCatalog?: boolean;
};

export type SanitizedMasterLocation = {
  id?: string;
  visitType: string;
  city: string;
  street: string;
  building: string;
  buildingDetail: string | null;
  salonName: string | null;
  entrance: string | null;
  floor: string | null;
  room: string | null;
  intercom: string | null;
  landmark: string | null;
  directions: string | null;
  clientNote: string | null;
  publicAddress: string;
  isPrimary?: boolean;
  lat: number | null;
  lng: number | null;
  /** Округлённые координаты для расчёта расстояния без раскрытия точного адреса. */
  distanceLat: number | null;
  distanceLng: number | null;
  showExactAddressAfterBooking: boolean;
};

/** ~1 км — достаточно для «от вас», без точного адреса. */
function roundCoordForDistance(v: number | null | undefined): number | null {
  if (v == null || !Number.isFinite(Number(v))) return null;
  return Math.round(Number(v) * 100) / 100;
}

function isStudioVisit(visitType: string): boolean {
  return visitType === 'studio';
}

/** Клиент записи видит точный адрес только после подтверждения или завершения визита. */
export function clientMaySeeExactAddress(appointmentStatus?: string | null): boolean {
  return appointmentStatus === 'confirmed' || appointmentStatus === 'completed';
}

function shouldHideExactDetails(location: MasterLocationSource, context: SanitizeLocationContext): boolean {
  if (isStudioVisit(location.visitType)) {
    return false;
  }
  if (location.visitType === 'at_home' && !location.showExactAddressAfterBooking) {
    return false;
  }
  if (context.isPublicCatalog) {
    return true;
  }
  if (clientMaySeeExactAddress(context.appointmentStatus)) {
    return false;
  }
  return true;
}

export function sanitizeMasterLocationForViewer(
  location: MasterLocationSource,
  context: SanitizeLocationContext,
): SanitizedMasterLocation {
  const hide = shouldHideExactDetails(location, context);
  const rawLat = location.lat != null && Number.isFinite(Number(location.lat)) ? Number(location.lat) : null;
  const rawLng = location.lng != null && Number.isFinite(Number(location.lng)) ? Number(location.lng) : null;
  const distanceLat = roundCoordForDistance(rawLat);
  const distanceLng = roundCoordForDistance(rawLng);
  return {
    id: location.id,
    visitType: location.visitType,
    city: location.city,
    street: location.street,
    building: hide ? '' : location.building,
    buildingDetail: hide ? null : (location.buildingDetail ?? null),
    salonName: location.salonName ?? null,
    entrance: hide ? null : (location.entrance ?? null),
    floor: hide ? null : (location.floor ?? null),
    room: hide ? null : (location.room ?? null),
    intercom: hide ? null : (location.intercom ?? null),
    landmark: hide ? null : (location.landmark ?? null),
    directions: hide ? null : (location.directions ?? null),
    clientNote: hide ? null : (location.clientNote ?? null),
    publicAddress: location.publicAddress,
    isPrimary: location.isPrimary,
    lat: hide ? null : rawLat,
    lng: hide ? null : rawLng,
    distanceLat,
    distanceLng,
    showExactAddressAfterBooking: location.showExactAddressAfterBooking === true,
  };
}
