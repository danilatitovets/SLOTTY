import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { query } from '../../config/db.js';
import { env } from '../../config/env.js';
import { getMigrationsHealth, getRuntimeHealth } from './health.service.js';

export const healthRouter = Router();

healthRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    res.json({ ok: true, service: 'slotty-backend' });
  }),
);

healthRouter.get(
  '/ready',
  asyncHandler(async (_req, res) => {
    try {
      await query('select 1 as ok');
      if (!env.JWT_SECRET || !env.DATABASE_URL) {
        res.status(503).json({ status: 'error', db: 'error', env: 'missing_critical' });
        return;
      }
      const migrations = await getMigrationsHealth();
      if (!migrations.ok) {
        res.status(503).json({
          status: 'error',
          db: 'ok',
          migrations: 'pending',
          pendingCount: migrations.pending.length,
        });
        return;
      }
      res.json({ status: 'ok', db: 'ok', migrations: 'ok' });
    } catch {
      res.status(503).json({ status: 'error', db: 'error' });
    }
  }),
);

/** Extended diagnostics for operators (no secrets). */
healthRouter.get(
  '/details',
  asyncHandler(async (_req, res) => {
    let db: 'ok' | 'error' = 'error';
    try {
      await query('select 1');
      db = 'ok';
    } catch {
      db = 'error';
    }
    const migrations = await getMigrationsHealth().catch(() => ({
      ok: false,
      applied: 0,
      expected: 0,
      pending: ['unavailable'],
    }));
    res.json({
      status: db === 'ok' && migrations.ok ? 'ok' : 'degraded',
      db,
      migrations,
      runtime: getRuntimeHealth(),
    });
  }),
);
