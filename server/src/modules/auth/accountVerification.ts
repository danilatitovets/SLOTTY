import { query } from '../../config/db.js';
import type { AuthIdentityPublic } from './authIdentities.types.js';
import { listAuthIdentitiesForProfile } from './authIdentities.service.js';

export const ACCOUNT_VERIFICATION_METHOD_COUNT = 3;

function hasProvider(identities: AuthIdentityPublic[], provider: AuthIdentityPublic['provider']): boolean {
  return identities.some((i) => i.provider === provider);
}

export function isAccountFullyVerifiedIdentities(identities: AuthIdentityPublic[]): boolean {
  const emailIdentity = identities.find((i) => i.provider === 'email');
  return (
    hasProvider(identities, 'telegram') &&
    hasProvider(identities, 'google') &&
    Boolean(emailIdentity?.emailVerified)
  );
}

/** Синхронизирует `master_profiles.is_verified` с привязками в «Способы входа». */
export async function syncMasterAccountVerified(profileId: string): Promise<boolean> {
  const identities = await listAuthIdentitiesForProfile(profileId);
  const verified = isAccountFullyVerifiedIdentities(identities);
  await query(
    `update public.master_profiles
        set is_verified = $2,
            updated_at = now()
      where master_id = $1`,
    [profileId, verified],
  );
  return verified;
}
