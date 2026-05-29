import type { Request, Response } from 'express';
import rateLimit, { ipKeyGenerator, type Options } from 'express-rate-limit';
import { env } from '../config/env.js';
import { resolveClientIp, resolveClientIpDebug } from '../lib/clientIp.js';

function rateLimitIpKey(req: Request): string {
  return ipKeyGenerator(resolveClientIp(req));
}

function clientKey(req: Request): string {
  const ip = rateLimitIpKey(req);
  const uid = req.user?.id;
  return uid ? `${ip}:${uid}` : ip;
}

/** Публичный каталог: только IP, чтобы не дробить лимит по userId. */
function catalogIpKey(req: Request): string {
  return rateLimitIpKey(req);
}

function rateLimitMessage(windowLabel: string): string {
  return `Слишком много запросов. Повторите позже (${windowLabel}).`;
}

function createLimiter(opts: {
  windowMs: number;
  maxProd: number;
  label: string;
  skipSuccessfulRequests?: boolean;
  keyGenerator?: Options['keyGenerator'];
}) {
  const multiplier = env.NODE_ENV === 'production' ? 1 : 4;
  const max = Math.max(1, Math.round(opts.maxProd * multiplier));
  return rateLimit({
    windowMs: opts.windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: opts.keyGenerator ?? clientKey,
    skipSuccessfulRequests: opts.skipSuccessfulRequests ?? false,
    handler: (_req, res) => {
      res.status(429).json({
        error: {
          message: rateLimitMessage(opts.label),
          code: 'RATE_LIMITED',
        },
      });
    },
  });
}

function logCatalogRateLimit(req: Request, max: number, windowMs: number): void {
  if (env.NODE_ENV === 'production') return;
  const ip = resolveClientIpDebug(req);
  console.warn('[rate-limit:catalog]', {
    clientIp: ip.clientIp,
    reqIp: ip.reqIp,
    socketIp: ip.socketIp,
    usedHeader: ip.usedHeader,
    path: req.originalUrl,
    method: req.method,
    limit: max,
    windowMs,
    userId: req.user?.id ?? null,
  });
}

function createPublicCatalogRateLimit(): ReturnType<typeof rateLimit> {
  const isProd = env.NODE_ENV === 'production';
  const windowMs = 60 * 1000;
  const max = isProd ? 1000 : 5000;

  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: catalogIpKey,
    handler: (req: Request, res: Response) => {
      logCatalogRateLimit(req, max, windowMs);
      res.status(429).json({
        error: {
          message: rateLimitMessage('1 мин'),
          code: 'RATE_LIMITED',
        },
      });
    },
  });
}

/** Email send-verification: 5 / 15 min (prod) */
export const authEmailSendLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  maxProd: 5,
  label: '15 мин',
});

/** Login, register, verify, forgot, reset, telegram, google: 10 / 15 min (prod) */
export const authCredentialLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  maxProd: 10,
  label: '15 мин',
});

/** POST /api/appointments */
export const bookingCreateLimiter = createLimiter({
  windowMs: 60 * 1000,
  maxProd: 10,
  label: '1 мин',
});

/**
 * GET /api/catalog/listings, GET /api/masters (list), GET /api/slots
 * prod: 1000 / min / IP · dev/test: 5000 / min / IP
 */
export const publicCatalogRateLimit = createPublicCatalogRateLimit();

/** @deprecated Используйте publicCatalogRateLimit */
export const publicCatalogLimiter = publicCatalogRateLimit;

/** Platform-admin POST mutations */
export const platformAdminMutationLimiter = createLimiter({
  windowMs: 60 * 1000,
  maxProd: 60,
  label: '1 мин',
});

/** POST /api/masters/:id/report */
export const masterProfileReportLimiter = createLimiter({
  windowMs: 60 * 60 * 1000,
  maxProd: 5,
  label: '1 ч',
});

/** GET /api/geo/search, /api/geo/reverse */
export const geoRateLimit = createLimiter({
  windowMs: 60 * 1000,
  maxProd: 40,
  label: '1 мин',
  keyGenerator: catalogIpKey,
});
