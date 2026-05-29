/**
 * Validate production-like staging env before deploy.
 * Usage: NODE_ENV=production node scripts/validate-staging-env.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function readEnv(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const out = {};
  for (const line of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const eq = t.indexOf('=');
    if (eq === -1) continue;
    out[t.slice(0, eq).trim()] = t.slice(eq + 1).trim();
  }
  return out;
}

const server = readEnv(path.join(root, 'server', '.env'));
const rootEnv = readEnv(path.join(root, '.env'));
const env = { ...rootEnv, ...server, ...process.env };

const errors = [];
const nodeEnv = env.NODE_ENV ?? 'development';

function isLocalhost(url) {
  try {
    const h = new URL(url).hostname;
    return h === 'localhost' || h === '127.0.0.1';
  } catch {
    return true;
  }
}

if (!env.VITE_API_URL?.trim()) errors.push('VITE_API_URL is required for frontend build');
if (!env.VITE_API_URL?.trim() && nodeEnv === 'production') {
  errors.push('VITE_API_URL is required for production frontend build');
}
if (env.VITE_API_URL && isLocalhost(env.VITE_API_URL) && nodeEnv === 'production') {
  errors.push('VITE_API_URL must not be localhost in production/staging');
}
if (env.VITE_API_URL?.startsWith('http://') && nodeEnv === 'production') {
  errors.push('VITE_API_URL should use HTTPS in production/staging');
}
if (env.CLIENT_URL?.startsWith('http://') && nodeEnv === 'production') {
  errors.push('CLIENT_URL should use HTTPS in production/staging');
}

if (!env.CLIENT_URL?.trim()) errors.push('CLIENT_URL is required on API');
if (env.CLIENT_URL && isLocalhost(env.CLIENT_URL) && nodeEnv === 'production') {
  errors.push('CLIENT_URL must not be localhost in production/staging');
}

if (!env.DATABASE_URL?.trim()) errors.push('DATABASE_URL is required');
if (!env.JWT_SECRET || env.JWT_SECRET.length < 16) errors.push('JWT_SECRET must be at least 16 chars');

const replicas = Number(env.API_REPLICA_COUNT ?? 1);
if (nodeEnv === 'production' && replicas > 1) {
  if ((env.GOOGLE_LINK_HANDOFF_STORE ?? 'memory') !== 'redis') {
    errors.push('API_REPLICA_COUNT>1 requires GOOGLE_LINK_HANDOFF_STORE=redis');
  }
  if (!env.REDIS_URL?.trim()) errors.push('REDIS_URL required for multi-instance handoff');
}

if (errors.length) {
  console.error('Staging/production env validation failed:\n');
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}

console.log('Staging/production env validation OK');
