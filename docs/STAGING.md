# Staging deployment (production-like)

## Environment

| Variable | Required | Notes |
|----------|----------|-------|
| `NODE_ENV` | Yes | `production` |
| `VITE_API_URL` | Yes | HTTPS API URL (build-time) |
| `CLIENT_URL` | Yes | HTTPS SPA origin (CORS) |
| `DATABASE_URL` | Yes | Staging Postgres |
| `JWT_SECRET` | Yes | Unique per environment |
| `GOOGLE_LINK_HANDOFF_STORE` | Multi-instance | `redis` + `REDIS_URL` |
| `API_REPLICA_COUNT` | If >1 | Forces Redis handoff |

## Pre-deploy checks

```bash
node scripts/validate-staging-env.mjs
npm run build
npm run build --prefix server
npm run db:v2:status
npm run db:v2:migrate
```

## Smoke after deploy

```bash
curl -sS "$API/api/health/"
curl -sS "$API/api/health/ready"
curl -sS "$API/api/health/details"
cd server && npm run e2e:hardening-verify
```

## Rules

- No `localhost` in `CLIENT_URL` / `VITE_API_URL` when `NODE_ENV=production`.
- Demo/localStorage flows disabled in frontend production build (`import.meta.env.PROD`).
- CORS allows only `CLIENT_URL`, `WEB_APP_URL`, and static production domains.
