import { randomUUID } from 'node:crypto';

const TTL_MS = 15 * 60 * 1000;

type HandoffEntry = {
  profileId: string;
  expiresAt: number;
};

const handoffs = new Map<string, HandoffEntry>();

function purgeExpired(): void {
  const now = Date.now();
  for (const [jti, entry] of handoffs) {
    if (entry.expiresAt <= now) handoffs.delete(jti);
  }
}

export function createGoogleLinkHandoffMemory(profileId: string): { jti: string; profileId: string } {
  purgeExpired();
  const jti = randomUUID();
  handoffs.set(jti, { profileId: profileId.trim(), expiresAt: Date.now() + TTL_MS });
  return { jti, profileId: profileId.trim() };
}

export function consumeGoogleLinkHandoffMemory(jti: string, profileId: string): void {
  purgeExpired();
  const key = jti.trim();
  const expectedProfileId = profileId.trim();
  const entry = handoffs.get(key);
  handoffs.delete(key);
  if (!entry || entry.expiresAt <= Date.now() || entry.profileId !== expectedProfileId) {
    throw new Error('handoff_invalid');
  }
}
