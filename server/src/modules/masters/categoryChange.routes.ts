import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { authMiddleware } from '../../middlewares/auth.js';
import { requireMasterDbAccess } from '../../middlewares/requireMasterAccess.js';
import { requireMasterPlatformWrite } from '../../middlewares/profileAccountAccess.js';
import {
  createCategoryChangeRequest,
  getActiveCategoryChangeRequestForMaster,
} from './categoryChangeRequest.service.js';

export const categoryChangeRouter = Router();

const createBody = z.object({
  requestedCategoryId: z.string().uuid(),
  reason: z.string().min(10).max(2000),
});

categoryChangeRouter.post(
  '/me/category-change-request',
  authMiddleware,
  requireMasterDbAccess,
  requireMasterPlatformWrite,
  asyncHandler(async (req, res) => {
    const body = createBody.parse(req.body);
    const request = await createCategoryChangeRequest(req.user!.id, body);
    res.status(201).json({ request });
  }),
);

categoryChangeRouter.get(
  '/me/category-change-request/active',
  authMiddleware,
  requireMasterDbAccess,
  asyncHandler(async (req, res) => {
    const out = await getActiveCategoryChangeRequestForMaster(req.user!.id);
    res.json(out);
  }),
);
