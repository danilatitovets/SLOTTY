import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { getPublicStatusPage } from './systemStatus.service.js';

export const systemStatusPublicRouter = Router();

systemStatusPublicRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    res.json(await getPublicStatusPage());
  }),
);

systemStatusPublicRouter.get(
  '/incidents',
  asyncHandler(async (_req, res) => {
    const page = await getPublicStatusPage();
    res.json({ incidents: page.activeIncidents, history: page.incidentHistory });
  }),
);

systemStatusPublicRouter.get(
  '/history',
  asyncHandler(async (_req, res) => {
    const page = await getPublicStatusPage();
    res.json({ history: page.incidentHistory });
  }),
);
