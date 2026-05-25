import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';

const SENSITIVE_KEYS = /^(authorization|password|token|code|initdata|credential|secret)$/i;

export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const incoming = req.get('X-Request-Id')?.trim();
  const requestId = incoming && incoming.length <= 128 ? incoming : randomUUID();
  req.requestId = requestId;
  res.setHeader('X-Request-Id', requestId);
  next();
}

/** Безопасный фрагмент тела для логов (без секретов). */
export function redactBodyForLog(body: unknown): unknown {
  if (body == null || typeof body !== 'object') return body;
  if (Array.isArray(body)) return body.map(redactBodyForLog);
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(body as Record<string, unknown>)) {
    if (SENSITIVE_KEYS.test(k)) {
      out[k] = '[REDACTED]';
    } else if (v && typeof v === 'object') {
      out[k] = redactBodyForLog(v);
    } else {
      out[k] = v;
    }
  }
  return out;
}
