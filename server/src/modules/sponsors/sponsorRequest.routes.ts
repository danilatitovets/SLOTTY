import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { authMiddleware } from '../../middlewares/auth.js';
import { requireMasterDbAccess } from '../../middlewares/requireMasterAccess.js';
import { requireMasterPlatformWrite } from '../../middlewares/profileAccountAccess.js';
import {
  createSponsorRequest,
  getActiveSponsorRequestForMaster,
  getSponsorRequestCabinetState,
} from './sponsorRequest.service.js';

export const sponsorRequestRouter = Router();

const createBody = z.object({
  contactName: z.string().min(2).max(120),
  phone: z.string().min(5).max(40),
  email: z.string().max(200).optional().nullable(),
  companyName: z.string().max(200).optional().nullable(),
  city: z.string().max(120).optional().nullable(),
  message: z.string().min(10).max(4000),
});

sponsorRequestRouter.post(
  '/me/sponsor-request',
  authMiddleware,
  requireMasterDbAccess,
  requireMasterPlatformWrite,
  asyncHandler(async (req, res) => {
    const body = createBody.parse(req.body);
    const request = await createSponsorRequest(req.user!.id, body);
    res.status(201).json({ request });
  }),
);

sponsorRequestRouter.get(
  '/me/sponsor-request/active',
  authMiddleware,
  requireMasterDbAccess,
  asyncHandler(async (req, res) => {
    res.json(await getActiveSponsorRequestForMaster(req.user!.id));
  }),
);

sponsorRequestRouter.get(
  '/me/sponsor-request/state',
  authMiddleware,
  requireMasterDbAccess,
  asyncHandler(async (req, res) => {
    res.json(await getSponsorRequestCabinetState(req.user!.id));
  }),
);
