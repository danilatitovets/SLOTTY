# Load test plan

## Goals

| Tier | Concurrent users | Focus |
|------|------------------|-------|
| 1 | 100 | Catalog browse |
| 2 | 500 | Catalog + master profile |
| 3 | 1000 | Catalog search + slot list |

## Scenarios

1. **Catalog** — `GET /api/catalog/listings?limit=24` (paginated).
2. **Master public** — `GET /api/masters/:id`.
3. **Slots** — `GET /api/slots?masterId=&serviceId=`.
4. **Booking concurrency** — 20× `POST /api/appointments` same `slotId` → expect 1×201, rest 409.
5. **Cancel → rebook** — under load, run `npm run e2e:slot-rebook --prefix server` after soak.

## Metrics to capture

- Average latency
- p95 / p99
- Error rate (4xx/5xx)
- Postgres connections / pool saturation
- Slow queries (`appointments`, `catalog` RPC)

## Tooling

- Script: `scripts/load/catalog-hammer.mjs` (lightweight Node fetch).
- Optional: [k6](https://k6.io/) for staging with `K6_API_URL` and auth tokens.

## Indexes (already in migrations)

- `037_appointments_list_indexes`
- `030_overview_performance_indexes`
- `038_catalog_search_rpc`

## Bottlenecks to watch

- Supabase pooler `max clients` (session mode) — use transaction pooler port 6543.
- N+1 in cabinet refresh — prefer silent reload limits.
- Large JSON catalog responses — keep pagination `limit` ≤ 50.

## Pass criteria (staging)

- p95 catalog < 800ms at 100 VUs
- p95 catalog < 1500ms at 500 VUs
- 0% 5xx on read paths
- Booking concurrency: exactly one success per slot
