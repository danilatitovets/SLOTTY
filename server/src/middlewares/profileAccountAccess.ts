import type { NextFunction, Request, Response } from 'express';
import {
  assertProfileCanCreateBooking,
  assertProfileCanManageMasterContent,
  assertProfileCanUsePlatform,
} from '../modules/profiles/profileAccount.service.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

function isReadMethod(method: string): boolean {
  return method === 'GET' || method === 'HEAD' || method === 'OPTIONS';
}

/** Мутации мастера: услуги, окна, профиль, записи и т.д. GET остаётся доступным при restricted. */
export const requireMasterPlatformWrite = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction) => {
    if (isReadMethod(req.method)) {
      next();
      return;
    }
    if (!req.user) {
      throw ApiError.unauthorized();
    }
    if (req.user.role === 'platform_admin') {
      next();
      return;
    }
    await assertProfileCanManageMasterContent(req.user.id);
    next();
  },
);

export const requireClientBookingCreate = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      throw ApiError.unauthorized();
    }
    await assertProfileCanCreateBooking(req.user.id);
    next();
  },
);

/** Мутации профиля клиента/мастера (не публичный каталог). */
export const requireProfileMutation = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction) => {
    if (isReadMethod(req.method)) {
      next();
      return;
    }
    if (!req.user) {
      throw ApiError.unauthorized();
    }
    await assertProfileCanUsePlatform(req.user.id);
    next();
  },
);
