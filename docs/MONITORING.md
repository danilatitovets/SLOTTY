# Monitoring and alerts

## Endpoints

| Endpoint | Purpose |
|----------|---------|
| `GET /api/health/` | Process alive |
| `GET /api/health/ready` | DB + migrations applied |
| `GET /api/health/details` | DB, pending migrations, reminders scheduler, handoff store |

## Sentry

| Env | Side |
|-----|------|
| `SENTRY_DSN` | Backend |
| `VITE_SENTRY_DSN` | Frontend |
| `SENTRY_ENVIRONMENT` / `VITE_SENTRY_ENVIRONMENT` | Optional tag |

If DSN is missing, the app starts with a **console warning** only.

**Never sent to Sentry:** `Authorization`, cookies, passwords, `initData`, OAuth secrets (redacted in `beforeSend`).

## Structured logs

- `X-Request-Id` on every response
- 500 errors log `requestId`, `method`, `path` (body redacted in production)
- Optional: `profileId` on Sentry user context (no email/phone)

## Required alerts (before public launch)

| Alert | Condition |
|-------|-----------|
| API down | Health check fails 2+ min |
| DB down | `/ready` returns 503 `db: error` |
| Migrations pending | `/ready` 503 `migrations: pending` |
| 5xx spike | >N errors / 5 min (Sentry or logs) |
| Failed booking spike | `POST /api/appointments` 5xx rate |
| Reminders stopped | `/health/details` → `lastTickError` or no `lastTickAt` > 2× interval |
| Migration failed | Deploy job / `db:v2:migrate` exit code ≠ 0 |

## Reminders

Backend sends **24h** and **1h** Telegram/in-app reminders only. There is **no 10-minute** reminder.
