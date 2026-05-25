import type { NextFunction, Request, Response } from 'express';
import { ApiError } from '../utils/ApiError.js';

export function requirePlatformAdmin(req: Request, _res: Response, next: NextFunction): void {
  if (req.user?.role !== 'platform_admin') {
    return next(ApiError.forbidden('Platform admin access required'));
  }
  next();
}
