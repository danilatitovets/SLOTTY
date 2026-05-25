/**
 * Подключение к Postgres для e2e: тот же DATABASE_URL, что и API (server/.env).
 * Fallback — pooler с перебором регионов, как scripts/apply-migrations-v2.mjs.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import pg from 'pg';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const e2eServerRoot = path.join(__dirname, '..', '..');
export const e2eRepoRoot = path.join(e2eServerRoot, '..');

const POOLER_REGIONS = [
  'eu-west-1',
  'eu-west-2',
  'eu-central-1',
  'eu-central-2',
  'eu-north-1',
  'us-east-1',
  'us-east-2',
  'us-west-1',
  'us-west-2',
  'ca-central-1',
  'ap-south-1',
  'ap-southeast-1',
  'ap-southeast-2',
  'ap-northeast-1',
  'ap-northeast-2',
  'sa-east-1',
];

/** Как server/src/config/env.ts */
export function loadE2eEnv(): void {
  dotenv.config({ path: path.join(e2eServerRoot, '.env') });
  dotenv.config({ path: path.join(e2eRepoRoot, '.env') });
  if (!process.env.DATABASE_URL?.trim()) {
    const fromRoot = process.env.DATABASE_URL;
    if (fromRoot) process.env.DATABASE_URL = fromRoot;
  }
}

function resolveDbPassword(): string {
  const fromEnv = process.env.SUPABASE_DB_PASSWORD?.trim();
  if (fromEnv) return fromEnv;
  const fp = path.join(e2eRepoRoot, 'dbpass.txt');
  if (fs.existsSync(fp)) {
    const line = fs.readFileSync(fp, 'utf8').split(/\r?\n/)[0]?.trim();
    if (line) return line;
  }
  throw new Error('Нет пароля БД: задайте DATABASE_URL в server/.env или SUPABASE_DB_PASSWORD / dbpass.txt');
}

async function connectWithConfig(config: pg.ClientConfig): Promise<pg.Client> {
  const c = new pg.Client({
    ...config,
    ssl: config.ssl ?? { rejectUnauthorized: false },
    connectionTimeoutMillis: 15_000,
  });
  await c.connect();
  await c.query('select 1');
  return c;
}

async function connectViaDatabaseUrl(): Promise<pg.Client | null> {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) return null;
  try {
    const c = await connectWithConfig({ connectionString: url });
    console.log('[e2e-db] Подключение через DATABASE_URL (как API)');
    return c;
  } catch (e) {
    const msg = String((e as Error)?.message ?? e);
    console.warn(`[e2e-db] DATABASE_URL не сработал: ${msg}`);
    return null;
  }
}

async function connectViaPooler(): Promise<pg.Client> {
  const pw = resolveDbPassword();
  const projectRef = process.env.SUPABASE_PROJECT_REF ?? 'gspnsnzdchuigbbdteqz';

  if (process.env.SUPABASE_DB_HOST) {
    const c = await connectWithConfig({
      host: process.env.SUPABASE_DB_HOST,
      port: Number(process.env.SUPABASE_DB_PORT ?? 5432),
      user: process.env.SUPABASE_DB_USER ?? 'postgres',
      password: pw,
      database: process.env.SUPABASE_DB_NAME ?? 'postgres',
    });
    console.log('[e2e-db] Подключение через SUPABASE_DB_HOST');
    return c;
  }

  const fixedRegion = process.env.SUPABASE_POOLER_REGION;
  const regions = fixedRegion ? [fixedRegion] : POOLER_REGIONS;
  const user = `postgres.${projectRef}`;
  let lastErr: unknown = null;

  for (const region of regions) {
    try {
      const c = await connectWithConfig({
        host: `aws-0-${region}.pooler.supabase.com`,
        port: 5432,
        user,
        password: pw,
        database: 'postgres',
      });
      console.log(`[e2e-db] Pooler подключён (регион ${region})`);
      return c;
    } catch (e) {
      lastErr = e;
      const msg = String((e as Error)?.message ?? e);
      if (/tenant or user not found/i.test(msg)) continue;
      if (/password authentication failed/i.test(msg)) {
        throw new Error('Ошибка аутентификации к БД (проверьте пароль).', { cause: e });
      }
    }
  }

  throw new Error(
    'Не удалось подключиться к pooler. Задайте DATABASE_URL в server/.env (как для API).',
    { cause: lastErr },
  );
}

export async function connectE2ePg(): Promise<pg.Client> {
  loadE2eEnv();
  const viaUrl = await connectViaDatabaseUrl();
  if (viaUrl) return viaUrl;
  return connectViaPooler();
}
