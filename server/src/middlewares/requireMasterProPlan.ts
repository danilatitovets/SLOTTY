import type { NextFunction, Request, Response } from 'express';
import { assertMasterHasProPlan } from '../modules/billing/billing.service.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

/** Pro-only API: analytics, smart promotions и т.п. */
export const requireMasterProPlan = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      throw ApiError.unauthorized();
    }
    if (req.user.role === 'platform_admin') {
      next();
      return;
    }
    await assertMasterHasProPlan(req.user.id);
    next();
  },
);
