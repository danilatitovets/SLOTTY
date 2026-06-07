import type { MasterSubscriptionDto } from '../../features/admin/api/adminBillingApi';
import type { MasterPublicationStatus } from '../../features/admin/lib/profileCompletion';
import type { DemoMasterAppointment } from '../../features/master/model/demoMasterAppointments';
import type { MasterDraft } from '../../features/profile/lib/demoMasterStorage';

export type CabinetProfileMeta = {
  rating: number;
  reviewsCount: number;
  completedBookingsCount: number;
};

export type AdminCabinetSessionCache = {
  masterId: string;
  draft: MasterDraft;
  appointments: DemoMasterAppointment[];
  publicationStatus: MasterPublicationStatus | null;
  cabinetProfileMeta: CabinetProfileMeta | null;
  subscription: MasterSubscriptionDto | null;
};

const STORAGE_KEY = 'slotty_admin_cabinet_session_v1';

let memoryCache: AdminCabinetSessionCache | null = null;

function readStorage(masterId: string): AdminCabinetSessionCache | null {
  if (typeof sessionStorage === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AdminCabinetSessionCache;
    if (!parsed?.masterId || parsed.masterId !== masterId) return null;
    if (!parsed.draft || !Array.isArray(parsed.appointments)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeStorage(next: AdminCabinetSessionCache): void {
  if (typeof sessionStorage === 'undefined') return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* quota / private mode */
  }
}

export function readAdminCabinetSessionCache(masterId: string): AdminCabinetSessionCache | null {
  if (memoryCache?.masterId === masterId) return memoryCache;
  const stored = readStorage(masterId);
  if (stored) memoryCache = stored;
  return stored;
}

export function writeAdminCabinetSessionCache(next: AdminCabinetSessionCache): void {
  memoryCache = next;
  writeStorage(next);
}

export function clearAdminCabinetSessionCache(): void {
  memoryCache = null;
  if (typeof sessionStorage !== 'undefined') {
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }
}
