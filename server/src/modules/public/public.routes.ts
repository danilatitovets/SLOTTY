import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { getPublicAppConfig } from './public.appConfig.js';

export const publicRouter = Router();

publicRouter.get(
  '/config',
  asyncHandler(async (req, res) => {
    const config = await getPublicAppConfig(req);
    res.json({ ok: true, ...config });
  }),
);
