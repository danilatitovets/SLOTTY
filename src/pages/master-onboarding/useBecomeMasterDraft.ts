import { useCallback, useEffect, useRef } from 'react';
import { fallbackCategoryCodeById } from '../../features/master-onboarding/onboardingFallbackCategories';
import type { MasterOnboardingService } from '../../features/profile/lib/demoMasterStorage';
import type { MasterVisitType } from '../../features/profile/model/masterLocation';
import type { MasterContactRow } from '../../features/master-onboarding/model/masterContacts';
import type { MasterPlanSelection } from '../../features/master-onboarding/model/masterOnboardingPlanTypes';
import type { MasterCertificate } from '../../features/master-onboarding/model/masterCertificate';
import type { OnboardingEducationItem } from './onboardingEducation';

const DRAFT_VERSION = 1;

export type BecomeMasterDraftData = {
  step: number;
  /** Максимальный шаг, до которого пользователь дошёл (для восстановления после F5). */
  furthestStep: number;
  selectedCategoryId: string | null;
  selectedCategoryCode: string | null;
  name: string;
  description: string;
  phone: string;
  clientContacts: MasterContactRow[];
  visitType: MasterVisitType;
  street: string;
  building: string;
  lat?: number;
  lng?: number;
  entrance: string;
  floor: string;
  room: string;
  intercom: string;
  directions: string;
  clientNote: string;
  salonName: string;
  houseDetail: string;
  showExactAddressAfterBooking: boolean;
  services: MasterOnboardingService[];
  certificates: MasterCertificate[];
  educationItems: OnboardingEducationItem[];
  tariffSelection: MasterPlanSelection;
};

type DraftEnvelope = {
  version: number;
  updatedAt: number;
  data: BecomeMasterDraftData;
};

export function buildBecomeMasterDraftKey(userId: string | null | undefined): string {
  return `slotty:become-master:draft:v1:${userId ?? 'local'}`;
}

function pickLongerString(a: string, b: string): string {
  return a.trim().length >= b.trim().length ? a : b;
}

function pickRicherArray<T>(a: T[], b: T[]): T[] {
  return a.length >= b.length ? a : b;
}

function certificateHasPersistedImage(c: MasterCertificate): boolean {
  const u = c.imageUrl?.trim();
  return Boolean(u && !u.startsWith('blob:'));
}

function pickMergedCertificate(
  existing: MasterCertificate,
  incoming: MasterCertificate,
  incomingIsPreferred: boolean,
): MasterCertificate {
  const exImg = certificateHasPersistedImage(existing);
  const inImg = certificateHasPersistedImage(incoming);
  const base =
    exImg && !inImg
      ? existing
      : inImg && !exImg
        ? incoming
        : incomingIsPreferred
          ? incoming
          : existing;
  return {
    ...base,
    imageUrl: base.imageUrl ?? incoming.imageUrl ?? existing.imageUrl,
  };
}

function mergeCertificates(preferred: MasterCertificate[], other: MasterCertificate[]): MasterCertificate[] {
  const byId = new Map<string, MasterCertificate>();
  const ingest = (list: MasterCertificate[], isPreferred: boolean) => {
    for (const cert of list) {
      const existing = byId.get(cert.id);
      if (!existing) byId.set(cert.id, cert);
      else byId.set(cert.id, pickMergedCertificate(existing, cert, isPreferred));
    }
  };
  ingest(other, false);
  ingest(preferred, true);

  const merged = [...byId.values()];
  const base = preferred.length >= other.length ? preferred : other;
  if (merged.length >= base.length) return merged;

  const seen = new Set(merged.map((c) => c.id));
  for (const cert of base) {
    if (!seen.has(cert.id)) merged.push(cert);
  }
  return merged;
}

/** Насколько черновик «заполнен» — чтобы не затирать данные пустым сохранением. */
export function draftCompletionScore(d: BecomeMasterDraftData): number {
  let score = d.furthestStep * 20 + d.step;
  if (d.selectedCategoryId) score += 50;
  if (d.selectedCategoryCode) score += 10;
  if (d.name.trim().length > 1) score += 15;
  if (d.description.trim().length > 3) score += 10;
  if (d.phone.replace(/\D/g, '').length > 6) score += 10;
  if (d.street.trim()) score += 15;
  if (d.salonName.trim()) score += 8;
  if (d.services.length > 0) score += 30 + d.services.length * 8;
  if (d.certificates.length > 0) score += 10;
  if (d.clientContacts.some((c) => c.value.trim())) score += 8;
  return score;
}

export function isSubstantiveOnboardingDraft(d: BecomeMasterDraftData | null | undefined): boolean {
  if (!d) return false;
  if (draftCompletionScore(d) >= 35) return true;
  return Boolean(d.selectedCategoryId) || d.furthestStep >= 2 || d.name.trim().length > 1;
}

export function mergeBecomeMasterDraftData(
  preferred: BecomeMasterDraftData,
  other: BecomeMasterDraftData,
): BecomeMasterDraftData {
  return {
    step: Math.max(preferred.step, other.step),
    furthestStep: Math.max(preferred.furthestStep, other.furthestStep),
    selectedCategoryId: preferred.selectedCategoryId ?? other.selectedCategoryId,
    selectedCategoryCode:
      preferred.selectedCategoryCode ??
      other.selectedCategoryCode ??
      (preferred.selectedCategoryId
        ? fallbackCategoryCodeById(preferred.selectedCategoryId)
        : other.selectedCategoryId
          ? fallbackCategoryCodeById(other.selectedCategoryId)
          : null),
    name: pickLongerString(preferred.name, other.name),
    description: pickLongerString(preferred.description, other.description),
    phone: pickLongerString(preferred.phone, other.phone),
    clientContacts: pickRicherArray(preferred.clientContacts, other.clientContacts),
    visitType: preferred.visitType ?? other.visitType,
    street: pickLongerString(preferred.street, other.street),
    building: pickLongerString(preferred.building, other.building),
    lat: preferred.lat ?? other.lat,
    lng: preferred.lng ?? other.lng,
    entrance: pickLongerString(preferred.entrance, other.entrance),
    floor: pickLongerString(preferred.floor, other.floor),
    room: pickLongerString(preferred.room, other.room),
    intercom: pickLongerString(preferred.intercom, other.intercom),
    directions: pickLongerString(preferred.directions, other.directions),
    clientNote: pickLongerString(preferred.clientNote, other.clientNote),
    salonName: pickLongerString(preferred.salonName, other.salonName),
    houseDetail: pickLongerString(preferred.houseDetail, other.houseDetail),
    showExactAddressAfterBooking:
      preferred.showExactAddressAfterBooking ?? other.showExactAddressAfterBooking,
    services: pickRicherArray(preferred.services, other.services),
    certificates: mergeCertificates(preferred.certificates, other.certificates),
    educationItems: pickRicherArray(preferred.educationItems, other.educationItems),
    tariffSelection: preferred.tariffSelection ?? other.tariffSelection,
  };
}

function deserializeDraft(raw: string | null): BecomeMasterDraftData | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as DraftEnvelope;
    if (!parsed || parsed.version !== DRAFT_VERSION || !parsed.data) return null;
    const data = parsed.data as BecomeMasterDraftData & { selectedCategoryCode?: string | null };
    const step = Math.max(1, Math.trunc(data.step || 1));
    const furthestStep = Math.max(step, Math.trunc(data.furthestStep ?? step));
    const selectedCategoryCode =
      data.selectedCategoryCode ??
      (data.selectedCategoryId ? fallbackCategoryCodeById(data.selectedCategoryId) : null);
    return { ...data, step, furthestStep, selectedCategoryCode };
  } catch {
    return null;
  }
}

function serializeDraft(data: BecomeMasterDraftData): string {
  const envelope: DraftEnvelope = {
    version: DRAFT_VERSION,
    updatedAt: Date.now(),
    data,
  };
  return JSON.stringify(envelope);
}

export function readBecomeMasterDraft(storageKey: string): BecomeMasterDraftData | null {
  if (typeof window === 'undefined') return null;
  return deserializeDraft(window.localStorage.getItem(storageKey));
}

export function writeBecomeMasterDraft(storageKey: string, data: BecomeMasterDraftData): void {
  if (typeof window === 'undefined') return;
  if (!isSubstantiveOnboardingDraft(data)) return;
  window.localStorage.setItem(storageKey, serializeDraft(data));
}

/** Слияние черновиков из нескольких ключей (local / user / legacy) — объединяем все найденные. */
export function loadMergedOnboardingDraft(...keys: string[]): BecomeMasterDraftData | null {
  const unique = [...new Set(keys.filter(Boolean))];
  let merged: BecomeMasterDraftData | null = null;

  for (const key of unique) {
    const draft = readBecomeMasterDraft(key);
    if (!draft) continue;
    merged = merged ? mergeBecomeMasterDraftData(merged, draft) : draft;
  }

  return merged;
}

/** Переносит черновик при появлении id пользователя — не затирает более полный черновик. */
export function migrateBecomeMasterDraft(fromKey: string, toKey: string): boolean {
  if (fromKey === toKey) return false;
  const from = readBecomeMasterDraft(fromKey);
  if (!from) return false;

  const to = readBecomeMasterDraft(toKey);
  if (!to) {
    writeBecomeMasterDraft(toKey, from);
    window.localStorage.removeItem(fromKey);
    return true;
  }

  const fromScore = draftCompletionScore(from);
  const toScore = draftCompletionScore(to);
  const merged =
    fromScore >= toScore
      ? mergeBecomeMasterDraftData(from, to)
      : mergeBecomeMasterDraftData(to, from);

  writeBecomeMasterDraft(toKey, merged);
  if (fromScore >= toScore || !isSubstantiveOnboardingDraft(to)) {
    window.localStorage.removeItem(fromKey);
  }
  return true;
}

export function useBecomeMasterDraft({
  storageKey,
  data,
  enabled,
  debounceMs = 400,
}: {
  storageKey: string;
  data: BecomeMasterDraftData;
  enabled: boolean;
  debounceMs?: number;
}) {
  const saveTimerRef = useRef<number | null>(null);
  const dataRef = useRef(data);
  dataRef.current = data;

  const flushDraft = useCallback(() => {
    if (!enabled || typeof window === 'undefined') return;
    if (!isSubstantiveOnboardingDraft(dataRef.current)) return;
    if (saveTimerRef.current) {
      window.clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    window.localStorage.setItem(storageKey, serializeDraft(dataRef.current));
  }, [enabled, storageKey]);

  const clearDraft = useCallback(() => {
    if (typeof window === 'undefined') return;
    if (saveTimerRef.current) {
      window.clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    window.localStorage.removeItem(storageKey);
  }, [storageKey]);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;
    if (!isSubstantiveOnboardingDraft(dataRef.current)) return;

    if (saveTimerRef.current) {
      window.clearTimeout(saveTimerRef.current);
    }

    saveTimerRef.current = window.setTimeout(() => {
      if (isSubstantiveOnboardingDraft(dataRef.current)) {
        window.localStorage.setItem(storageKey, serializeDraft(dataRef.current));
      }
      saveTimerRef.current = null;
    }, debounceMs);

    return () => {
      if (saveTimerRef.current) {
        window.clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }
    };
  }, [data, debounceMs, enabled, storageKey]);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;
    const onPageHide = () => flushDraft();
    window.addEventListener('pagehide', onPageHide);
    return () => window.removeEventListener('pagehide', onPageHide);
  }, [enabled, flushDraft]);

  return { flushDraft, clearDraft };
}
