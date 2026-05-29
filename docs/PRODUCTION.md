# SLOTTY — Production setup

## Required environment

### Frontend (build-time)

| Variable | Required | Notes |
|----------|----------|-------|
| `VITE_API_URL` | **Yes** in production | Public HTTPS API base URL |
| `VITE_SUPABASE_URL` | If using Storage uploads | Project URL |
| `VITE_GOOGLE_CLIENT_ID` | For Google Sign-In | OAuth Web client id |

### Backend (runtime)

| Variable | Required | Notes |
|----------|----------|-------|
| `NODE_ENV` | **Yes** | `production` |
| `DATABASE_URL` | **Yes** | Postgres connection string |
| `JWT_SECRET` | **Yes** | Min 16 chars; rotate with care |
| `CLIENT_URL` | **Yes** | HTTPS SPA origin (CORS) |
| `GOOGLE_CLIENT_ID` | For Google auth | |
| `GOOGLE_CLIENT_SECRET` | For OAuth redirect / Telegram link | |
| `TELEGRAM_BOT_TOKEN` | For Telegram login & notifications | |
| `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` | For file uploads | Server-only |
| `RESEND_API_KEY` | For email auth / notifications | |
| `PUBLIC_API_URL` or `RAILWAY_PUBLIC_DOMAIN` | Google OAuth callback | |

`ALLOW_SUBSCRIPTION_MOCK=true` is **off** by default in production. Demo billing must stay explicitly labeled in UI.

## Deploy checklist

1. Apply migrations: `npm run db:v2:migrate` (see `docs/DATABASE_V2.md`).
2. Build frontend with `VITE_API_URL` set.
3. Build & start API: `npm run build --prefix server` → `npm start --prefix server`.
4. Verify `GET /api/health/` and `GET /api/health/ready`.
5. Run `npm run e2e:hardening-verify --prefix server` against staging.

## Database backups

- Enable daily automated backups on your Postgres provider (Railway, Supabase, etc.).
- Retain 7–30 days; store backups in a separate account/region.
- Quarterly: restore backup to a staging DB and run `npm run db:v2:smoke`.

## Staging validation

```bash
node scripts/validate-staging-env.mjs
```

See [STAGING.md](./STAGING.md), [MONITORING.md](./MONITORING.md), [BACKUPS.md](./BACKUPS.md), [STORAGE_SECURITY.md](./STORAGE_SECURITY.md), [LOAD_TEST.md](./LOAD_TEST.md).

## Monitoring (before public launch)

- **Errors**: Sentry (or similar) on frontend + backend; scrub tokens and `initData`.
- **Logs**: structured JSON with `requestId`, `profileId` (no passwords/tokens).
- **Alerts**: API down, DB `ready` failing, migration failures, 5xx spike, reminder cron stalled.

## Google link handoff (multi-instance)

Handoff tokens are stored in **process memory** (single-use, 15 min). For horizontal scaling, replace `googleLinkHandoff.store.ts` with Redis/DB.

## Load testing (recommended)

- 100 / 500 / 1000 concurrent catalog reads
- Concurrent booking on the same slot (expect one success)
- Cancel → rebook same slot (expect success after migration `043`)
