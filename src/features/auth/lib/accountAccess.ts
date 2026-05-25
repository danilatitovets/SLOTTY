import type { BackendProfile } from '../types';

export type ProfileAccountStatus = 'active' | 'restricted' | 'blocked' | 'deleted';

export const MASTER_WRITE_BLOCKED_TITLE =
  'Действие недоступно из-за ограничения аккаунта';

export type AccountAccessState = {
  status: ProfileAccountStatus;
  canUsePlatform: boolean;
  canCreateBooking: boolean;
  canMutateMaster: boolean;
  showRestrictedBanner: boolean;
  showBlockedScreen: boolean;
  showDeletedScreen: boolean;
  restrictionReason: string | null;
  blockedReason: string | null;
  accessRestrictedUntil: string | null;
};

function effectiveStatus(profile: BackendProfile): ProfileAccountStatus {
  const raw = profile.account_status ?? 'active';
  if (raw === 'restricted' && profile.access_restricted_until) {
    const until = new Date(profile.access_restricted_until);
    if (!Number.isNaN(until.getTime()) && until.getTime() <= Date.now()) {
      return 'active';
    }
  }
  return raw;
}

export function resolveAccountAccess(profile: BackendProfile | null): AccountAccessState {
  if (!profile) {
    return {
      status: 'active',
      canUsePlatform: true,
      canCreateBooking: true,
      canMutateMaster: true,
      showRestrictedBanner: false,
      showBlockedScreen: false,
      showDeletedScreen: false,
      restrictionReason: null,
      blockedReason: null,
      accessRestrictedUntil: null,
    };
  }

  const status = effectiveStatus(profile);
  const restrictionReason = profile.access_restriction_reason?.trim() || null;
  const blockedReason = profile.blocked_reason?.trim() || null;
  const accessRestrictedUntil = profile.access_restricted_until ?? null;

  const showBlockedScreen = status === 'blocked';
  const showDeletedScreen = status === 'deleted';
  const showRestrictedBanner = status === 'restricted';
  const canUsePlatform = !showBlockedScreen && !showDeletedScreen;
  const canCreateBooking = canUsePlatform && status !== 'restricted';
  const canMutateMaster = canUsePlatform && status !== 'restricted';

  return {
    status,
    canUsePlatform,
    canCreateBooking,
    canMutateMaster,
    showRestrictedBanner,
    showBlockedScreen,
    showDeletedScreen,
    restrictionReason,
    blockedReason,
    accessRestrictedUntil,
  };
}

export function formatRestrictionUntil(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}
