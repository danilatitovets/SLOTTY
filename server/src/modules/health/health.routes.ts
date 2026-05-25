import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { query } from '../../config/db.js';
import { env } from '../../config/env.js';

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
      res.json({ status: 'ok', db: 'ok' });
    } catch {
      res.status(503).json({ status: 'error', db: 'error' });
    }
  }),
);
