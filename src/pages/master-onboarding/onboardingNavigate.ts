import type { MasterContactRow } from '../../features/master-onboarding/model/masterContacts';
import type { MasterVisitType } from '../../features/profile/model/masterLocation';

const PROFILE_ERROR_ORDER = ['name', 'description', 'phone', 'contactReachability'] as const;

const ADDRESS_ERROR_ORDER_STUDIO = [
  'salonName',
  'street',
  'coords',
  'entrance',
  'floor',
  'room',
  'intercom',
  'buildingDetail',
  'directions',
  'clientNote',
  'landmark',
] as const;

const ADDRESS_ERROR_ORDER_AT_HOME = [
  'street',
  'coords',
  'entrance',
  'floor',
  'room',
  'intercom',
  'buildingDetail',
  'directions',
  'clientNote',
  'landmark',
] as const;

const AT_HOME_DETAIL_FIELDS = new Set(['entrance', 'floor', 'room', 'intercom', 'houseDetail']);

export function scrollToOnboardingField(fieldId: string): void {
  requestAnimationFrame(() => {
    const el = document.querySelector(`[data-onboarding-field="${fieldId}"]`);
    if (!el) return;

    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el.setAttribute('data-onboarding-highlight', '');
    window.setTimeout(() => el.removeAttribute('data-onboarding-highlight'), 2400);

    const focusable = el.querySelector<HTMLElement>(
      'input:not([type="hidden"]):not([disabled]), textarea:not([disabled]), select:not([disabled]), button:not([disabled])',
    );
    focusable?.focus({ preventScroll: true });
  });
}

export function touchAllErrorKeys(
  setTouched: (updater: (prev: Record<string, boolean>) => Record<string, boolean>) => void,
  errs: Record<string, string>,
): void {
  const keys = Object.keys(errs);
  if (keys.length === 0) return;
  setTouched((prev) => {
    const next = { ...prev };
    for (const k of keys) next[k] = true;
    return next;
  });
}

export function pickFirstProfileErrorField(
  errs: Record<string, string>,
  contacts: MasterContactRow[],
): string {
  for (const key of PROFILE_ERROR_ORDER) {
    if (errs[key]) {
      return key === 'contactReachability' ? 'contacts' : key;
    }
  }
  for (const row of contacts) {
    if (errs[row.id]) return row.id;
  }
  return 'name';
}

export function pickFirstAddressErrorField(
  errs: Record<string, string>,
  visitType: MasterVisitType,
): string {
  const order = visitType === 'studio' ? ADDRESS_ERROR_ORDER_STUDIO : ADDRESS_ERROR_ORDER_AT_HOME;
  for (const key of order) {
    if (errs[key]) return key === 'coords' ? 'street' : key;
  }
  const first = Object.keys(errs)[0];
  return first ?? 'street';
}

export function firstErrorMessage(errs: Record<string, string>, preferredField?: string): string {
  if (preferredField && errs[preferredField]) return errs[preferredField];
  const firstKey = Object.keys(errs)[0];
  return firstKey ? errs[firstKey] : 'Проверьте поля выше';
}

export function addressNeedsMoreSection(errs: Record<string, string>, visitType: MasterVisitType): boolean {
  if (visitType !== 'at_home') return false;
  return Object.keys(errs).some((k) => AT_HOME_DETAIL_FIELDS.has(k));
}
