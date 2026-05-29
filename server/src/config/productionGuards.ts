export type ProductionEnvSlice = {
  NODE_ENV: string;
  CLIENT_URL: string;
  API_REPLICA_COUNT: number;
  GOOGLE_LINK_HANDOFF_STORE: 'memory' | 'redis';
  REDIS_URL?: string;
};

function isLocalhostUrl(url: string): boolean {
  try {
    const { hostname } = new URL(url);
    return hostname === 'localhost' || hostname === '127.0.0.1';
  } catch {
    return false;
  }
}

/** Fail fast when production/staging is misconfigured. */
export function assertProductionEnvironment(cfg: ProductionEnvSlice): void {
  if (cfg.NODE_ENV !== 'production') return;

  if (isLocalhostUrl(cfg.CLIENT_URL)) {
    console.error('[env] CLIENT_URL must not be localhost in production');
    process.exit(1);
  }

  if (cfg.API_REPLICA_COUNT > 1 && cfg.GOOGLE_LINK_HANDOFF_STORE === 'memory') {
    console.error(
      '[env] API_REPLICA_COUNT > 1 requires GOOGLE_LINK_HANDOFF_STORE=redis and REDIS_URL',
    );
    process.exit(1);
  }
  if (cfg.GOOGLE_LINK_HANDOFF_STORE === 'redis' && !cfg.REDIS_URL?.trim()) {
    console.error('[env] GOOGLE_LINK_HANDOFF_STORE=redis requires REDIS_URL');
    process.exit(1);
  }
}
