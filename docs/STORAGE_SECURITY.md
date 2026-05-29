# Storage security audit

## Buckets

| Bucket | Default | Public | Used for |
|--------|---------|--------|----------|
| `profile` (`SUPABASE_PROFILE_BUCKET`) | yes | **Public** | Client avatars, booking reference photos |
| Master media (`SUPABASE_MASTER_MEDIA_BUCKET` or same) | yes | **Public** | Hero, portfolio, certificates |

All uploads go through **backend** with `SUPABASE_SERVICE_ROLE_KEY` (not browser anon upload to arbitrary paths).

## Path layout

| Type | Path pattern | Owner check on upload |
|------|--------------|------------------------|
| Client avatar | `{userId}/avatar.*` | `req.user.id` |
| Reference photo | `{clientId}/booking-references/{uuid}.*` | `req.user.id`; URL must contain `/{clientId}/booking-references/` |
| Master hero | `masters/{userId}/hero.*` | master middleware |
| Portfolio | `masters/{userId}/portfolio/{uuid}.*` | master middleware |
| Certificate | `masters/{userId}/certificates/{uuid}.*` | master middleware |

Service photos in catalog are typically **external URLs** or same master media paths via API — no separate bucket.

## Read access

- **Public URLs** (`getPublicUrl`): anyone with the link can read.
- Portfolio/hero/certs are intended public for published masters.
- **Reference photos** are in a public bucket but paths include random UUID — security by obscurity; **medium risk** for sensitive client images.

## Write access

- Clients cannot upload to another user's path (server enforces `userId`).
- Masters cannot upload to `masters/{otherId}/` (routes use authenticated master id).
- Replacing another master's file requires knowing path + service role (not exposed to browser).

## Recommendations

| Risk | Severity | Fix |
|------|----------|-----|
| Reference photos public | Medium | Move to **private** bucket + short-lived signed URLs in appointments |
| Public portfolio OK | Low | Keep public for catalog |
| No RLS on Storage from browser | Low | Upload only via API (current) |

## Production

- Do not use `localhost` or `file://` URLs in DB for production media.
- Mirror external portraits via `mirrorPortraitToStorage` when configured.
