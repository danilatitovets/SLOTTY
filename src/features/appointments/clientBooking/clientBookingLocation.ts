import type { MasterLocation } from '../../../features/profile/model/masterLocation';
import type { ClientBookingDetail } from './clientBookingDetailTypes';

const REVEALED_STATUSES = new Set([
  'confirmed',
  'client_arrived',
  'in_progress',
  'master_marked_completed',
  'client_confirmed_completed',
  'completed',
]);

export function isClientBookingAddressRevealed(status: string): boolean {
  return REVEALED_STATUSES.has(status);
}

export function clientBookingDetailToLocation(detail: ClientBookingDetail): MasterLocation {
  return {
    visitType: detail.location_visit_type === 'at_home' ? 'at_home' : 'studio',
    city: detail.location_city?.trim() || '',
    street: detail.location_street?.trim() || '',
    building: detail.location_building?.trim() || '',
    buildingDetail: detail.location_building_detail?.trim() || undefined,
    entrance: detail.location_entrance?.trim() || undefined,
    floor: detail.location_floor?.trim() || undefined,
    room: detail.location_room?.trim() || undefined,
    intercom: detail.location_intercom?.trim() || undefined,
    landmark: detail.location_landmark?.trim() || undefined,
    directions: detail.location_directions?.trim() || undefined,
    clientNote: detail.location_client_note?.trim() || undefined,
    lat: detail.location_lat != null ? Number(detail.location_lat) : undefined,
    lng: detail.location_lng != null ? Number(detail.location_lng) : undefined,
    showExactAddressAfterBooking: detail.location_show_exact_after_booking !== false,
  };
}
