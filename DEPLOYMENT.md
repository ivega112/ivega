# Deployment (Vercel + PostgreSQL + persistent storage)

## Local development database
For local dev only, this repo can provision a real Postgres cluster with no Docker and no
account: `node scripts/db/local-postgres.mjs` (see README). **This is not for production.**
The section below is about the production database.

## 1. Provision infrastructure
- **PostgreSQL**: any managed Postgres (Neon, Supabase, Railway, RDS). Grab the connection
  string as `DATABASE_URL`. Provisioning a production instance requires creating/logging
  into an account with one of these providers — that's a real external-authentication step
  only you can do; nothing in this repo can create billing/hosting accounts on your behalf.
- **Object storage**: Vercel Blob (`STORAGE_PROVIDER=vercel-blob`, needs
  `BLOB_READ_WRITE_TOKEN` from the Vercel dashboard) or Cloudflare R2
  (`STORAGE_PROVIDER=r2`, needs `R2_ENDPOINT`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`,
  `R2_BUCKET`, `R2_PUBLIC_BASE_URL`). **Do not use `local` in production** — Vercel's
  filesystem is ephemeral and per-instance.

## 2. Environment variables (Vercel project settings)
Copy every key from `.env.example`:
`DATABASE_URL`, `SESSION_SECRET` (32+ random chars — `openssl rand -base64 32`),
`STORAGE_PROVIDER` and its matching provider keys, `NEXT_PUBLIC_SITE_URL` (your production
domain, used for canonical URLs / `metadataBase`).

## 3. Migrations
Run once against the production database (from CI or locally with the prod `DATABASE_URL`,
never from a client machine with a cached/stale schema):

```bash
pnpm db:deploy   # prisma migrate deploy — applies committed migrations, no prompts
```

## 4. Seed (first deploy only, idempotent)

```bash
DATABASE_URL=<prod> pnpm db:seed
```

## 5. First admin

```bash
DATABASE_URL=<prod> ADMIN_EMAIL=you@company.com ADMIN_PASSWORD='<strong-password>' \
  ADMIN_NAME="Your Name" pnpm admin:create
```

Run this from a trusted machine or a one-off CI job — never commit the password, and rotate
it via the same command (it upserts by email) if it leaks.

## 6. Build & deploy
Standard Vercel Next.js deployment — `vercel --prod`, or connect the GitHub repo and let
Vercel's Git integration build on push. Build command is `pnpm build` (already the default
Next.js detection); no special output config needed since all data-driven routes are
`force-dynamic`.

## 7. Domain configuration
Point your domain at the Vercel project, set `NEXT_PUBLIC_SITE_URL` to match, redeploy so
`metadataBase`/canonical URLs pick it up.

## 8. Post-deployment verification
- [ ] `/` loads with real seeded categories/products
- [ ] `/admin/login` works with the admin created in step 5
- [ ] Create a test product with an image upload, confirm it persists after a redeploy
      (proves object storage, not local disk, is being used)
- [ ] Place a test order through checkout, confirm the WhatsApp link opens with the correct
      number and message
- [ ] Confirm the test order in `/admin/orders`, verify stock decremented; cancel it, verify
      stock restored
- [ ] Check response headers include the CSP/security headers from `next.config.ts`

## What has and hasn't been exercised
Steps 3–5 above (`prisma migrate deploy`, seed, admin creation) were run and verified
successfully — against a real **local** Postgres cluster (provisioned per "Local
development database" above), not yet against an actual **production** managed Postgres
instance, since that requires an account with a hosting provider that only you can create.
The commands and their behavior are identical either way (same Prisma migration files, same
seed script) — only the target `DATABASE_URL` differs. See `VERIFICATION_REPORT.md` for the
exact local-run results, including real bugs this verification found and fixed (an admin
login redirect loop, a checkout foreign-key crash, missing category images, and
unassociated form labels).
