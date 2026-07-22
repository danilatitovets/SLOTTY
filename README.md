# SLOTTY

Online booking SaaS for service professionals — client scheduling, master workspace, subscriptions, payments, and Telegram integration.

**Live:** [slotty.of.by](https://slotty.of.by)

---

## Purpose

SLOTTY helps independent masters and service businesses publish profiles, accept bookings, manage schedules, and run day-to-day operations from a web app and Telegram Mini App surface.

---

## Main features

- Public catalog and master landing pages
- Booking flows with slot availability
- Master cabinet: schedule, services, appointments, profile, settings
- Client auth (Telegram + Google OAuth where configured)
- Subscription / Pro billing (manual payment + bePaid online payments)
- Notifications (email via Resend, Telegram reminders)
- Platform admin tools
- SEO prerender + sitemap support
- Playwright e2e coverage for critical booking and master flows

---

## Architecture

- **Web:** React + TypeScript + Vite + Tailwind CSS
- **API:** Express (Node) in `server/`
- **Data:** PostgreSQL via Supabase (migrations under `supabase/`)
- **Storage:** Supabase Storage (avatars / exports)
- **Realtime product surface:** Telegram Bot + Mini App SDK
- **Observability:** optional Sentry (web + API)
- **Deploy:** Railway / Vercel-oriented configs present in repo

```
Vite React app  ──HTTP──►  Express API  ──►  PostgreSQL (Supabase)
        │                      │
        └──── Telegram Mini App / Bot webhooks
```

---

## Stack

| Area | Technologies |
| --- | --- |
| Frontend | React, TypeScript, Vite, Tailwind, React Query, React Router |
| Backend | Express, Zod, JWT, bcrypt, rate limiting |
| Data | PostgreSQL, Supabase JS, `pg` |
| Integrations | Telegram, Google OAuth, Resend, bePaid, Redis (optional multi-instance) |
| Quality | Playwright e2e, server test scripts |

---

## Security & data

- JWT auth with server-side secrets (`JWT_SECRET`)
- Supabase service role key used only on the backend
- Payment secrets (`BEPAID_*`) stay on the API — never in `VITE_*`
- Rate limiting and proxy/IP hardening options for production
- CORS allowlists for production frontends
- `.env` files are gitignored; templates live in `.env.example` and `server/.env.example`

---

## Local setup

```bash
npm install
npm install --prefix server
cp .env.example .env
cp server/.env.example server/.env
# fill DATABASE_URL, JWT_SECRET, Supabase keys, etc.
npm run dev
```

This starts API + web via `concurrently`.

### Environment variables (names only)

**Web (`.env.example`):**  
`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_API_URL`, `VITE_PUBLIC_APP_URL`, `VITE_TELEGRAM_BOT_USERNAME`, `VITE_TELEGRAM_WEBAPP_SHORT_NAME`, `VITE_GOOGLE_CLIENT_ID`, `VITE_SENTRY_DSN`, analytics IDs, map provider keys.

**API (`server/.env.example`):**  
`PORT`, `DATABASE_URL`, `JWT_SECRET`, `TELEGRAM_BOT_TOKEN`, `CLIENT_URL`, `WEB_APP_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `BEPAID_*`, `REDIS_URL`, Sentry, billing/notification worker flags.

Do not commit real secrets or personal payment credentials.

---

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | API + web development |
| `npm run build` | Typecheck, Vite build, prerender |
| `npm run preview` | Preview web build |
| `npm start` | Serve static build |
| `npm run db:apply` / `db:v2:*` | Schema / migration helpers |
| `npm run make:admin` | Promote admin user |
| `npm run e2e:smoke` | Playwright smoke suite |
| `npm run e2e:booking-lifecycle` | Booking lifecycle e2e |

Additional server scripts live under `server/package.json` (billing, notifications, staging verify, etc.).

---

## Status

**Deployed product** with a live domain (`slotty.of.by`). Treat payment/billing and Telegram webhook configuration as environment-dependent — verify staging/production env before release.
