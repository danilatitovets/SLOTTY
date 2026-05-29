import { env } from '../../config/env.js';
import {
  consumeGoogleLinkHandoffMemory,
  createGoogleLinkHandoffMemory,
} from './googleLinkHandoff.memory.js';
import {
  consumeGoogleLinkHandoffRedis,
  createGoogleLinkHandoffRedis,
} from './googleLinkHandoff.redis.js';

function storeMode(): 'memory' | 'redis' {
  if (env.GOOGLE_LINK_HANDOFF_STORE === 'redis') return 'redis';
  if (env.NODE_ENV === 'production' && env.API_REPLICA_COUNT > 1) {
    throw new Error('multi_instance_requires_redis_handoff');
  }
  return 'memory';
}

export async function createGoogleLinkHandoff(
  profileId: string,
): Promise<{ jti: string; profileId: string }> {
  if (storeMode() === 'redis') {
    return createGoogleLinkHandoffRedis(profileId);
  }
  if (env.NODE_ENV === 'production') {
    console.warn(
      '[auth] Google link handoff uses in-memory store (single API instance). Set GOOGLE_LINK_HANDOFF_STORE=redis for horizontal scaling.',
    );
  }
  return createGoogleLinkHandoffMemory(profileId);
}

export async function consumeGoogleLinkHandoff(jti: string, profileId: string): Promise<void> {
  if (storeMode() === 'redis') {
    await consumeGoogleLinkHandoffRedis(jti, profileId);
    return;
  }
  consumeGoogleLinkHandoffMemory(jti, profileId);
}
