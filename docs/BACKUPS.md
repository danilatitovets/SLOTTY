# Database backups and restore

## Daily backup plan

1. Enable **automated daily backups** on your Postgres provider (Supabase Pro, Railway Postgres, etc.).
2. Retention: **minimum 7 days**, recommended **30 days**.
3. Store backup exports in a **separate account/region** from production when possible.

## Verify backups

Monthly:

1. Restore latest backup to a **staging** database.
2. Run `npm run db:v2:status` against staging.
3. Run `npm run db:v2:smoke`.
4. Run `npm run e2e:slot-rebook --prefix server` against staging API.

## Restore procedure (operator)

1. Announce incident; stop writes (maintenance mode or scale API to 0).
2. Create new DB instance or use provider “restore point in time”.
3. Update `DATABASE_URL` on API to restored instance.
4. Run `npm run db:v2:status` — all migrations should show applied (or run `db:v2:migrate` if journal intact).
5. `GET /api/health/ready` must return `200`.
6. Smoke: login, catalog, one test booking on staging master.

## Incident roles

| Role | Action |
|------|--------|
| On-call engineer | Confirm outage, check `/api/health/details`, DB panel |
| DBA / infra | Restore backup, verify replication lag |
| Product | Communicate to users if booking unavailable |

## What we do not backup in this guide

- Supabase Storage objects: enable bucket versioning / periodic export separately.
- Redis handoff keys: ephemeral (15 min TTL), no restore needed.
