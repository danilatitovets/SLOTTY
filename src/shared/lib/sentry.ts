import * as Sentry from '@sentry/react';

let initialized = false;

export function initSentryBrowser(): void {
  const dsn = import.meta.env.VITE_SENTRY_DSN?.trim();
  if (!dsn) {
    if (import.meta.env.PROD) {
      console.warn('[sentry] VITE_SENTRY_DSN not set — frontend error monitoring disabled');
    }
    return;
  }

  Sentry.init({
    dsn,
    environment: import.meta.env.VITE_SENTRY_ENVIRONMENT ?? import.meta.env.MODE,
    tracesSampleRate: import.meta.env.PROD ? 0.05 : 0,
    beforeSend(event) {
      if (event.request?.headers) {
        const h = event.request.headers as Record<string, string>;
        if (h.Authorization) h.Authorization = '[REDACTED]';
      }
      return event;
    },
  });
  initialized = true;
}

export function captureUiException(err: unknown, context?: Record<string, string>): void {
  if (!initialized) return;
  Sentry.withScope((scope) => {
    if (context) {
      for (const [k, v] of Object.entries(context)) {
        scope.setTag(k, v);
      }
    }
    Sentry.captureException(err);
  });
}

export { Sentry };
