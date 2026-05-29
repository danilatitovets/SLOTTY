import * as Sentry from '@sentry/node';
import { env } from '../config/env.js';

let initialized = false;

export function initSentry(): void {
  const dsn = env.SENTRY_DSN?.trim();
  if (!dsn) {
    if (env.NODE_ENV === 'production') {
      console.warn('[sentry] SENTRY_DSN not set — error monitoring disabled');
    }
    return;
  }

  Sentry.init({
    dsn,
    environment: env.SENTRY_ENVIRONMENT ?? env.NODE_ENV,
    tracesSampleRate: env.NODE_ENV === 'production' ? 0.1 : 0,
    beforeSend(event) {
      if (event.request?.headers) {
        const h = event.request.headers as Record<string, string>;
        if (h.authorization) h.authorization = '[REDACTED]';
        if (h.cookie) h.cookie = '[REDACTED]';
      }
      return event;
    },
  });
  initialized = true;
  console.log('[sentry] backend monitoring enabled');
}

export function captureApiException(err: unknown, context?: {
  requestId?: string;
  profileId?: string;
  path?: string;
}): void {
  if (!initialized) return;
  Sentry.withScope((scope) => {
    if (context?.requestId) scope.setTag('request_id', context.requestId);
    if (context?.profileId) scope.setUser({ id: context.profileId });
    if (context?.path) scope.setExtra('path', context.path);
    Sentry.captureException(err);
  });
}

export { Sentry };
