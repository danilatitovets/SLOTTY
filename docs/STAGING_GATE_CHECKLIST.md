# Staging gate checklist (operator)

Run on **staging** with `NODE_ENV=production`, HTTPS `VITE_API_URL` and `CLIENT_URL`.

## Automated

```bash
node scripts/validate-staging-env.mjs
npm run e2e:hardening --prefix server
npm run e2e:booking --prefix server
npm run e2e:google-dedup --prefix server
npm run e2e:slot-rebook --prefix server
E2E_API_URL=https://api.staging.example E2E_BASE_URL=https://app.staging.example npm run e2e:smoke
API=https://api.staging.example CONCURRENCY=100 DURATION_SEC=30 npm run load:catalog
```

## Manual (required before public launch)

- [ ] Client: catalog → master → service → book → success only after API 201
- [ ] Master: sees appointment, confirm/cancel
- [ ] Client: appointment in profile
- [ ] Client: review after completed visit; master one reply only
- [ ] Telegram → Google link (handoff with Redis if multi-instance)
- [ ] Google → Telegram link
- [ ] Sentry: trigger test error on FE/BE, verify in dashboard
- [ ] Uptime monitor on `/api/health/ready`
- [ ] DB backup job enabled + restore drill documented
