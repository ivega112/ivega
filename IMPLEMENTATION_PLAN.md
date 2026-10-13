# Implementation Plan / Status

Retrospective checklist tracking the Smart Line production build against the master spec.
For narrative history and architecture decisions, see `.claude/PROJECT_MEMORY.md`.

## Phase 1 — Foundation (done)
- [x] Next.js 15 App Router + TypeScript + Tailwind v4 scaffold
- [x] Prisma schema (26+ models) + migrations against a real local Postgres
- [x] Idempotent seed script (categories, brands, products, delivery, payments, hours, policies, FAQs, homepage sections, sample reviews)
- [x] Core lib: pricing, Arabic search normalization, WhatsApp message/URL builder + placeholder validation, storage provider abstraction, activity logging

## Phase 2 — Public storefront (done)
- [x] All required public routes, RTL, mobile bottom nav + drawer, search dialog
- [x] Catalog filter/sort/pagination via URL params
- [x] Cart/wishlist/recently-viewed (versioned localStorage)
- [x] Server-validated checkout → WhatsApp order flow, idempotent
- [x] Homepage is section-driven from `HomepageSection` config (hero/categories/banners/campaigns/featured/reviews)

## Phase 3 — Admin core (done)
- [x] Argon2id auth, DB-backed sessions, RBAC, login lockout
- [x] Dashboard, products (CRUD + image upload), categories, brands
- [x] Orders with transactional inventory confirm/cancel

## Phase 4 — Remaining admin sections (done this pass)
- [x] `/admin/homepage` — sections + hero slides + banners
- [x] `/admin/campaigns` — campaign CRUD with product/category linking, date validation
- [x] `/admin/delivery` — methods + zones (split out of the old consolidated settings page)
- [x] `/admin/payments` — payment method CRUD + visibility
- [x] `/admin/whatsapp` — number/template/quick-replies/button-visibility + live preview
- [x] `/admin/reviews` — moderation (approve/reject/feature/hide/archive)
- [x] `/admin/policies` — 5 fixed policy pages
- [x] `/admin/faq` — CRUD + reorder + visibility
- [x] `/admin/contact` — contact info + opening hours + social links
- [x] `/admin/users` — `SUPER_ADMIN`-only, RBAC-enforced server-side, final-super-admin protection

## Phase 5 — Verification (done this pass)
- [x] Route-group refactor fixing a real admin-login redirect loop and public-chrome leaking onto admin pages (found via e2e, not theoretical)
- [x] Accessibility pass: skip links, focus-visible ring, dialog/drawer `role`/`aria-modal`, label association fixes, `aria-current`, `role="alert"`/`role="status"` on form feedback
- [x] Responsive spot-check via direct browser inspection (not exhaustive — see `VERIFICATION_REPORT.md`)
- [x] Expanded Playwright coverage: delivery-fee→checkout, WhatsApp-settings→checkout, payment-visibility→checkout, policy/FAQ public rendering, review moderation, RBAC + final-super-admin protection — 22 e2e tests total, all passing deterministically at `workers: 1`
- [x] Full pipeline green: lint, typecheck, 36 unit tests, build, 22 e2e tests

## Not done (honest)
- Drag-and-drop reordering (up/down buttons used instead)
- Bulk product actions / product duplication / dedicated SEO sub-form
- `ProductCard` `horizontal` variant
- Automated accessibility tooling (e.g. axe) — manual/targeted fixes only
- Exhaustive responsive sweep (all 8 requested breakpoints × every route)
- Production deployment (requires a managed Postgres account — see `DEPLOYMENT.md`)
