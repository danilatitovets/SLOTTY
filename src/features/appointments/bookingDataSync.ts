import { queryClient } from '../../app/providers';

const listeners = new Set<() => void>();

export const bookingQueryKeys = {
  clientAppointments: ['client', 'appointments'] as const,
  clientDetail: (code: string) => ['client', 'appointment', code] as const,
  masterAppointments: ['master', 'appointments'] as const,
  masterDetail: (code: string) => ['master', 'appointment', code] as const,
  masterStats: ['master', 'stats'] as const,
  notifications: ['notifications'] as const,
  platformBookings: ['platform-admin', 'bookings'] as const,
  platformBooking: (id: string) => ['platform-admin', 'booking', id] as const,
};

export function subscribeBookingDataRefresh(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function refreshBookingData(): void {
  for (const fn of listeners) {
    try {
      fn();
    } catch {
      /* ignore listener errors */
    }
  }
}

/** После любого lifecycle-действия: invalidate React Query + подписчики списков. */
export function afterBookingMutation(): void {
  void queryClient.invalidateQueries({ queryKey: ['client'] });
  void queryClient.invalidateQueries({ queryKey: ['master'] });
  void queryClient.invalidateQueries({ queryKey: ['notifications'] });
  void queryClient.invalidateQueries({ queryKey: ['platform-admin'] });
  refreshBookingData();
}
