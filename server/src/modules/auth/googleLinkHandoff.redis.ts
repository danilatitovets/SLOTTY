import { randomUUID } from 'node:crypto';
import { createClient } from 'redis';
import { env } from '../../config/env.js';

const TTL_SEC = 15 * 60;
const KEY_PREFIX = 'slotty:google_link_handoff:';

type RedisClient = ReturnType<typeof createClient>;

let client: RedisClient | null = null;
let connectPromise: Promise<RedisClient> | null = null;

async function getRedis(): Promise<RedisClient> {
  const url = env.REDIS_URL?.trim();
  if (!url) throw new Error('REDIS_URL missing');

  if (client?.isOpen) return client;

  if (!connectPromise) {
    const next = createClient({ url });
    next.on('error', (err) => {
      console.warn('[redis-handoff]', err instanceof Error ? err.message : err);
    });
    connectPromise = next.connect().then(() => {
      client = next;
      return next;
    });
  }
  return connectPromise;
}

export async function createGoogleLinkHandoffRedis(
  profileId: string,
): Promise<{ jti: string; profileId: string }> {
  const redis = await getRedis();
  const jti = randomUUID();
  const pid = profileId.trim();
  const key = `${KEY_PREFIX}${jti}`;
  await redis.set(key, pid, { EX: TTL_SEC, NX: true });
  return { jti, profileId: pid };
}

export async function consumeGoogleLinkHandoffRedis(jti: string, profileId: string): Promise<void> {
  const redis = await getRedis();
  const key = `${KEY_PREFIX}${jti.trim()}`;
  const stored = await redis.getDel(key);
  if (!stored || stored !== profileId.trim()) {
    throw new Error('handoff_invalid');
  }
}

export async function closeGoogleLinkHandoffRedis(): Promise<void> {
  if (client?.isOpen) {
    await client.quit().catch(() => undefined);
  }
  client = null;
  connectPromise = null;
}
