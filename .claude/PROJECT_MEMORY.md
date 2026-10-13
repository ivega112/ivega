# iVEGA — Project Memory

Last updated: 2026-08-06 (admin dashboard hardening pass — batch 1 of the full admin-upgrade spec)

## Full campaign pricing engine built (2026-08-09, continuing the final-delivery pass)
The last big deferred item from the original admin-upgrade spec. Clean schema redesign of
`Campaign` (table was empty — 0 real campaigns ever existed — confirmed before making the
migration destructive: `DROP COLUMN discountLabel/displayLocation/isActive`).

**Schema**: `Campaign` gained `promoTextAr`, `badgeText`, `bannerImageUrl`/
`mobileBannerImageUrl`, `ctaLabel`/`ctaUrl`, `placements: CampaignPlacement[]`,
`discountMode` (PERCENTAGE | FINAL_PRICE), `discountPercentage`, `priority`, `isEnabled`
(replaces `isActive` — "enabled for publication", combined with dates to derive
Draft/Scheduled/Active/Expired). New `CampaignBrand` join (brand targeting, was missing)
and `CampaignProductPrice` (per-product final-price snapshot, FINAL_PRICE mode only).

**Shared pricing resolver** (`src/lib/campaign-pricing.ts` — deliberately no `server-only`
guard so its pure functions are unit-tested directly, matching the `slug.ts` precedent):
- `getCampaignStatus()` — pure, derived from `isEnabled` + dates, no cron needed.
- `resolveEffectivePrice(product, activeCampaigns)` — pure, takes an already-fetched
  campaign list (batch-friendly, avoids N+1 across a product grid). Non-stacking: exactly
  one campaign ever applies, lowest final price wins, deterministic tie-break (priority →
  createdAt → id). PERCENTAGE mode re-resolves targeting dynamically (safe — a percentage
  is always well-defined). FINAL_PRICE mode requires an explicit `CampaignProductPrice` row
  per product — a category/brand match alone is never enough, so a category gaining a new
  product later can't silently apply an undefined price to it (spec's exact concern).
  Never lets a campaign raise the price.
- `getActiveCampaignsWithTargets()` / `getEffectivePricesForProducts()` — the DB-touching
  batch entry points; one query per page render regardless of product count.
- 17 unit tests in `campaign-pricing.test.ts` cover status transitions, both discount
  modes, the "campaign never raises price" guard, non-stacking, and both tie-break rules.

**Wired into every price-display surface that touches real money or is customer-visible**:
`checkout.ts` (authoritative — server resolves fresh from DB, never trusts client),
`/api/catalog/by-ids` (cart display), shop/category/brand grids (`catalog-grid.tsx`),
homepage featured products, product detail page + its related-products rail.
`mapProductToCard()` now takes an optional `effectivePrice` that overrides `price`/
`oldPrice` entirely (a campaign doesn't stack with a product's own manually-set
`oldPrice` — avoids an ambiguous double-discount display); existing card UI needed zero
changes since it already renders `oldPrice` as struck-through. **Deliberately not wired
into `/api/search/suggest`** — search suggestions still show base price; a documented,
acceptable simplification, not an oversight.

**Admin UI**: list page (`/admin/campaigns`) shows computed status/discount
summary/placement/target count with View/Edit/Duplicate/Archive/Delete/Toggle. Create
(`/new`) and edit (`/[id]`) share one `CampaignForm` client component. Targeting = products
+ categories + brands (multi-select), resolved via `resolveCampaignTargetProductIds()`.
Percentage mode is a single input. Final-price mode shows a live per-product table
**only on the edit page** (resolving dynamic category/brand targeting needs a server
round-trip this form doesn't do client-side) — a brand-new campaign in FINAL_PRICE mode
must be saved as a draft first, then reopened for editing to set prices; documented in the
UI copy itself, not hidden. Bulk helpers: apply one % to all resolved rows, clear all.
Activation (`isEnabled=true`) is blocked server-side until every resolved FINAL_PRICE
target has a valid price — draft saves are allowed incomplete. `ctaUrl` is validated as a
same-site relative path only (open-redirect/XSS-via-href guard). Banner upload reuses the
existing `getStorageAdapter()`.

**Countdown**: `CampaignCountdown` client component, deliberately renders nothing until
mounted (server/client `Date.now()` would always mismatch — no fake shared initial value).

**Real bugs found and fixed while building this** (all confirmed via actual e2e runs, not
assumed):
1. My own first cleanup pass double-counted inventory restoration for confirm+cancel test-
   order pairs that had already net-zeroed — see the "Rate limiting" section below for the
   full story; same root lesson applied here when writing `_final_delivery_cleanup`-style
   scripts for campaigns.
2. `.first()`/fresh-page-for-absence-checks needed in the new e2e specs — same documented
   Next.js prefetch-cache inert-duplicate artifact as ever, not new.
3. **Genuine leftover-data trap discovered**: repeated failed e2e attempts (while fixing
   `selectOption` regex-vs-string and locator issues) left *multiple* still-`isEnabled`
   "حملة اختبار K800" campaigns in the DB simultaneously. A later test that disabled "the"
   campaign via `.first()` in the admin list correctly disabled *one* of them, but another
   leftover one was still live and still discounting the product — the price never
   reverted, looking exactly like a resolver bug. It wasn't; `SELECT * FROM "Campaign"`
   showed 7 rows all targeting the same 2 products. **Lesson**: when an e2e campaign test
   fails partway (before its own cleanup step runs), always check for and clear leftover
   `Campaign` rows before concluding a *resolver* bug — the non-stacking logic is only as
   correct as the assumption that exactly one matching campaign exists.

Full suite after all of this: **78/78** (72 previous + 3 new percentage/overlap/final-price
campaign tests × ... — campaign-pricing.spec.ts runs once per project like the rest).
`pnpm build`/`lint`/`typecheck`/unit tests (65 total) all clean.

## Rate limiting + category many-to-many (2026-08-08/09, continuing the final-delivery pass)
User confirmed they'll handle actual Vercel deployment themselves; asked to keep solving
the remaining gaps from the earlier security/spec review.

**1. DB-backed rate limiting** (`src/lib/rate-limit.ts`, new `RateLimitEntry` model,
migration `20260808200536_rate_limit_entry`): deliberately NOT in-memory — this app
deploys to Vercel, where each request can land on a different ephemeral function instance
with no shared memory, so an in-memory counter would silently do nothing in production.
Uses one atomic Postgres upsert (`INSERT ... ON CONFLICT DO UPDATE` with a `CASE` for
fixed-window rollover) — race-free without needing `SELECT ... FOR UPDATE`. Applied to:
checkout (`10 req / 10 min` per IP), login (`20 / 15 min` per IP, layered on top of the
pre-existing per-account lockout), `/api/search/suggest` (`60 / min` per IP). Verified the
atomicity directly (rapid-fire script, confirmed exactly 3 allowed then blocked at max=3).

**Important operational gotcha this created**: the e2e suite drives dozens of
logins/checkouts from one IP within minutes — exactly the pattern the limiter exists to
block, so it started failing e2e runs. Fixed with an `E2E_TESTING=1` bypass checked at the
top of `checkRateLimit()`, set automatically by `playwright.config.ts`'s `webServer.env`
**only when Playwright spawns the server itself**. Because this session frequently starts
`pnpm start`/`pnpm dev` manually and points Playwright at it via `E2E_BASE_URL` (to skip
the ~2-3min rebuild-per-invocation), **that manual-server pattern must now also export
`E2E_TESTING=1` before starting**, e.g.:
`E2E_TESTING=1 nohup pnpm start > /tmp/x.log 2>&1 &` — forgetting this makes e2e runs fail
with real (not flaky) rate-limit rejections that look like broken login/checkout, costing
real debugging time once already this pass. Never set `E2E_TESTING` in an actual
deployment.

**2. Categories many-to-many** (spec's earlier-deferred item; brands deliberately stayed
single-FK, per the same original spec's explicit instruction not to introduce a many-to-
many brand relation without real justification): additive schema — new `ProductCategory`
join table (migration `20260808201542_product_category_many_to_many`), `Product.categoryId`
stays the required *primary* category untouched (all existing filtering/breadcrumbs/etc.
keep working unchanged). `src/lib/catalog.ts`'s `getProducts` category filter now matches
primary OR secondary via `where.OR`. Admin surfaces: new `/admin/categories/[id]` detail
page (search + checkbox multi-select product picker, primary-category rows shown locked/
disabled since those are managed from the product's own edit page) using a new
`syncCategoryProductsAction` (full-replace diff, one transaction); product form gained an
"أقسام إضافية" multi-select synced via `syncAdditionalCategories()` in
`products/actions.ts` on both create and update. Category delete-safety
(`deleteCategoryAction`) now also counts secondary links, not just primary, before
deciding archive-vs-hard-delete.

**Real bug found and fixed while testing this**: the category-picker's sync form had no
client-side feedback or redirect on success — `syncCategoryProductsAction` just revalidated
in place. This wasn't just a test-flakiness annoyance (though it did cause one, see below)
— it's a genuine UX gap for the admin using it for real (submit a change, get zero visible
confirmation it worked). Fixed by having the action `redirect()` back to the same page with
`?saved=1`, and the page shows a real success banner on that param. (A second, separate
false alarm during this same debugging: `/category/androidtv` briefly appeared to not
reflect a confirmed-persisted assignment — root-caused to `npx playwright test`'s
`reuseExistingServer` silently reusing a stale already-running server built before later
source edits, not a real bug; a hard `rm -rf .next && pnpm build` proved the code was
correct. Always suspect a stale reused dev/prod server before an application bug when a
test result contradicts a direct DB/Prisma-query check of the same condition.)

Full suite after both features: **72/72** (68 previous + 4 new: the 2 new category tests ×
2 projects). `pnpm build`/`lint`/`typecheck`/unit tests all clean.

**Still not started**: full campaign pricing engine (percentage/final-price modes,
targeting resolution, shared price resolver, overlap rules — by far the largest remaining
item), accessibility audit, full responsive breakpoint audit. See "Known issues" above for
the fuller breakdown; this section only covers what's newly *done*.

## Final delivery pass (2026-08-06, end of session)
1. **Removed the sort-pill row** ("الأنسب/الأحدث/السعر…") from `CatalogFiltersBar` — shared
   by `/shop`, `/category/[slug]`, `/brands/[slug]` — per explicit user request. URL-driven
   sorting (`?sort=price-asc` etc.) still works underneath (untouched, still tested), just
   no UI control to change it publicly anymore. Admin's own product-list sort filter
   (`admin/products/product-filters-bar.tsx`) is a separate component, intentionally left
   alone (different audience/purpose, not mentioned by the user).
2. **Admin accounts consolidated to exactly one**: `iVEGA` / `admin@ivega.com` /
   `SUPER_ADMIN`, created via the project's existing `pnpm admin:create` script (proper
   argon2id hashing, no hardcoded secrets). All 30 other accounts deleted (29 leftover
   `admin-users.spec.ts` test staff accounts + the old `admin@ivega.test`/`ChangeMe123456!`
   dev account — **that old login no longer works, this is intentional**). User initially
   asked for the email literally as `admin@iVEGA`, which fails the app's own
   `z.string().email()` validation (would have permanently locked them out of login) — this
   was surfaced and the user picked `admin@ivega.com` instead via AskUserQuestion.
3. **All test/demo data wiped for handoff**: 0 orders, 0 sessions remain. Along the way,
   found and fixed a real accounting bug in my own first cleanup pass — blindly summing
   every `ORDER_CONFIRM` movement's quantity across all test orders over-restored product
   IV-K100's stock to 38 (correct value, evidenced by the movement history's own
   `balanceAfter` trail before deletion, was 6) because most of those orders were
   confirm+cancel pairs that had already netted to zero; only re-crediting orders that were
   still `inventoryApplied: true` at delete time is correct. Corrected manually this time;
   the final `_final_delivery_cleanup.mjs` pass (script deleted after running, not part of
   the repo) does this net-checking correctly and found zero further drift. **If more test
   data accumulates later**: filter orders by `customerName` patterns used across specs
   (`اختبار`, `عميل موبايل`, `أحمد تجريبي`, `عميل اختبار...`) — no single pattern catches
   all of them, e2e specs don't share a naming convention.
4. **Dependency CVEs patched** (`pnpm audit --prod` was 17 vulnerabilities → 0): added
   `pnpm-workspace.yaml` → `overrides` (package.json's own `pnpm.overrides` field is
   ignored by this pnpm version — moved to the workspace file) forcing `sharp>=0.35.0`
   (libvips CVEs, actually exercised via next/image at request time), `postcss>=8.5.18`
   (path traversal / XSS in sourceMappingURL — build-time only for this app, patched
   anyway), `undici>=6.28.0` (multiple CVEs, only exercised if `STORAGE_PROVIDER=vercel-blob`
   is actually configured). Verified `pnpm build`/`e2e` still pass after the bump (sharp's
   native binary needed a one-time rebuild, added ~90s to the next build the first time
   only).
5. **Real OWASP-relevant fixes found and applied** (manual review, not an automated
   scanner — auth/session/RBAC/checkout/upload code was already solid: argon2id w/
   OWASP-recommended params, hashed session tokens, account lockout, server-revalidated
   checkout pricing, allowlisted file upload MIME+size+server-generated filenames, proper
   RBAC default-deny):
   - **JSON-LD `</script>` breakout** (`src/lib/json-ld.ts`, new — `safeJsonLd()`):
     `JSON.stringify` doesn't escape `</script>`; product/FAQ JSON-LD blocks
     (`dangerouslySetInnerHTML`) could have their script tag closed early by a crafted
     admin-entered name/question containing that literal sequence, injecting real
     HTML/script. All current sources are admin-only input (lower real-world risk) but
     fixed as defense-in-depth regardless — costs nothing. Unit-tested.
   - **Missing `Strict-Transport-Security` header** — added to `next.config.ts` (was
     absent entirely; X-Frame-Options/nosniff/Referrer-Policy/Permissions-Policy/CSP were
     already present).
   - **Unbounded checkout `items` array and login `password` length** in
     `src/lib/validation.ts` — both public, unauthenticated, resource-expensive endpoints
     (DB write; argon2 hash) had no upper bound on attacker-controlled input size. Added
     `.max(50)` / `.max(200)`.
   - **No rate limiting on public write endpoints** (checkout, `/api/search/suggest`) —
     flagged but NOT implemented (needs an infra decision — no Redis/similar in this
     project; account lockout already covers the login brute-force case specifically).
     Recommend for the user to decide before a real production launch: Vercel's built-in
     edge rate limiting if deployed there, or `@upstash/ratelimit`, or a reverse-proxy-level
     limit.
6. Full verification after all of the above: `pnpm build`/`lint`/`typecheck` clean, unit
   tests 48/48 (+3 new for `safeJsonLd`), **e2e 68/68** (chromium-desktop + mobile, run
   twice — once to confirm the old default test credentials now correctly fail, once with
   `E2E_ADMIN_EMAIL=admin@ivega.com E2E_ADMIN_PASSWORD='Ivega+12345@'` to confirm the real
   flow works end-to-end).

## Real root-cause bug found and fixed: CSP blocked dev-mode interactivity (2026-08-06)
User reported (with a screen recording — extracted via `ffmpeg -vf fps=1` since there's no
video-viewing tool, only image `Read`): after selecting one brand filter on `/shop`,
clicking a *different* brand circle did nothing — page stayed stuck on the first brand,
confirmed by mouse hovering visibly over other circles across several frames with zero
navigation. Reproduced 100% reliably with a minimal standalone Playwright script (`import
{ chromium } from "@playwright/test"`, bypassing the test-runner's own build) run directly
against the **currently-running `pnpm dev` server** — `page.on("pageerror")` caught:
`Evaluating a string as JavaScript violates ... script-src 'self' 'unsafe-inline'` (no
`'unsafe-eval'`). **Root cause**: `next.config.ts`'s `headers()` sets a strict
`Content-Security-Policy` unconditionally on every route in every environment — but
`next dev`'s own Fast Refresh/HMR client runtime evaluates code via `eval()`, which that
CSP silently blocks, throwing an uncaught error that kills the click handler's re-render/
`router.push` before it completes. **Production builds are unaffected** (no eval used —
this is exactly why every `pnpm e2e` run against a fresh `next build && next start` looked
fully correct all session, while the live dev server the user was actually testing against
was broken). Fixed: `script-src` now conditionally appends `'unsafe-eval'` only when
`process.env.NODE_ENV !== "production"` (i.e. under `next dev` only) — production keeps
the strict policy.

**This likely explains earlier same-session confusion, not just this report**: the
`/brands/[slug]` brand-switching investigation earlier this session hit an identical
in-pane `pageerror` (attributed at the time to "tool instrumentation using eval" as an
alternative theory) — that fix (routing `/brands/[slug]` switches through a real
`router.push` instead of a query param, since the page reads the route segment not
`?brand=`) was still independently correct and necessary, but the *dev-mode-only*
click failures observed while diagnosing it were probably this same CSP bug all along,
not (only) a pane-visibility artifact. Re-verify anything in this file previously blamed
on "the pane wasn't visible" with this CSP angle in mind if it recurs.

**Verification**: rebuilt `.next` clean, reran the same standalone script — no more
`pageerror`, clicking NOVALINK then ORYX from an initial `?brand=ivega` state correctly
navigated to `?brand=novalink` then `?brand=oryx` each time. Full e2e suite re-run twice
after the fix: 68/68 and 67/68 (one isolated flake, `hiding a review`, confirmed passing
alone in 14.6s — a timing artifact of the config's 180s webServer build timeout being
tight on this machine, not a real failure). `pnpm build`/`lint`/`typecheck`/`test` all
clean.

**New note on `pnpm e2e` timing on this machine**: a full `next build` alone takes ~2m30s
here (mostly Windows "Generating static pages"/"Collecting build traces" I/O, not
compilation — compile itself is ~20s), which is close to `playwright.config.ts`'s 180s
`webServer.timeout`. If `pnpm e2e` fails with `Timed out waiting 180000ms from
config.webServer`, it's very likely just this — retry, or run `pnpm build && pnpm start`
manually once and then `E2E_BASE_URL=http://localhost:3000 npx playwright test` to reuse
that already-built server and skip the slow rebuild-per-invocation entirely.

## Admin dashboard upgrade — batch 1 complete (2026-08-06)
User gave a large (21-section) spec to upgrade the entire admin dashboard: pagination, a
global form-field style system, safe SKU/slug generation, category/company many-to-many
CRUD, a full campaign pricing engine (percentage + per-product final-price modes,
targeting resolution, overlap/conflict rules), complete review CRUD, fixed JOD currency,
delivery CRUD without a disable toggle, and payment methods restricted to COD+CliQ. This
is genuinely multi-session work — implemented and fully verified (real e2e, not just
unit tests) the tractable, well-scoped, non-destructive-migration items below. **Not yet
done**: categories/companies many-to-many relations + bulk-assign UI, the full campaign
engine redesign (§8 of the spec), and the 9-section product-form reorg with SEO/media
subsections. Those are comparable in size to everything below *combined* and need their
own pass — see "Known issues / unresolved" for the prioritized list.

**Completed and verified this pass:**
- **Global admin form styling**: one shared `.input`/`.admin-input` definition in
  `src/app/globals.css` (`@layer components`, new `--color-admin-border*` tokens — a
  visibly-blue border by default, darker+ring on focus, error/disabled states) replacing
  13 separate per-page `<style jsx global>{.input{...}}</style>` blocks that all used the
  near-invisible storefront `--color-border`. Also added shared `.admin-field-error` /
  `.admin-field-help` classes for future per-field validation UI.
- **Safe SKU generation** (`src/lib/sku.ts` + `20260806115133_product_sku_sequence`
  migration): new products get `IV-P-000123` from a real Postgres `SEQUENCE`
  (`product_sku_seq`, `nextval()` is atomic — no `count+1` race), retried on the
  astronomically-unlikely P2002 unique clash. Existing hand-picked SKUs (`IV-K800`,
  `IV-RC-ORG`, …) are untouched — the `IV-P-` prefix keeps the two schemes from ever
  colliding. `sku` was removed from `productFormSchema`/the create+update actions entirely
  — no client input can reach it anymore, not just a disabled UI field.
- **Safe slug generation** (`src/lib/slug.ts` pure helpers + `src/lib/slug-server.ts` for
  the DB-touching uniqueness resolver — split so the pure functions stay unit-testable and
  client-importable without dragging Prisma into the browser bundle). Derives from
  nameEn → model → nameAr (never machine-transliterates Arabic), falls back to
  `product-<ts>` if nothing Latin exists, appends `-2`/`-3`… deterministically on clash.
  Product form (`product-form.tsx`) shows a live preview + an "advanced options" manual
  override *only on create*; slug is locked read-only on edit (update action never reads
  it from formData regardless of what's submitted).
- **Admin product pagination**: real numbered pages (`AdminPagination`, shared component
  at `src/app/admin/(protected)/admin-pagination.tsx`, reusable for other admin tables),
  20/page, Prev/Next with disabled boundary states, category/brand/status/sort filters
  (`ProductFiltersBar`), distinct "no products at all" vs "no results match your filters"
  empty states, filter changes reset to page 1.
- **Currency locked to JOD**: selector removed from `/admin/settings`; `updateStoreSettingsAction`
  hardcodes `"JOD"` server-side regardless of submitted form data. `formatCurrency()` was
  already hardcoded to `"د.أ"` — currency was never actually plumbed through anywhere else.
- **Delivery**: removed the isActive enable/disable toggle from the admin UI entirely;
  added real Edit (via `?editMethodId=`/`?editZoneId=` pre-fill, same page) and Delete.
  "Delete" is a hard `prisma.delete` when unreferenced by any historical `Order`, or a
  silent internal `isActive:false` (excluded from every list/query) when referenced —
  the admin only ever sees Add/Edit/Delete, never a disable control, per spec.
- **Payments restricted to COD + CliQ**: `PaymentMethod` table cleaned of one unsupported
  "bank transfer" row and ~26 accumulated e2e-test rows (verified zero `Order` references
  first). Admin can now only edit each fixed method's instructions text — no create,
  delete, or visibility toggle. CliQ's `nameAr` corrected to exactly "CliQ" per spec.
  WhatsApp order summary already included the payment label correctly (`paymentLabel` in
  `src/lib/whatsapp.ts` — no bug there, just verified).
- **Reviews**: added real edit (`updateReviewAction`) and permanent delete
  (`deleteReviewAction`, distinct from the existing soft-archive) — previously only
  create/approve/reject/visibility/feature/archive existed, no edit or hard-delete at all.
  Added product-link and rating filters to the admin list. No `language` field exists on
  `Review` in the schema — language filtering from the spec was skipped as genuinely
  unsupported, not faked.
- **New shared component**: `ConfirmSubmitButton` (`src/app/admin/(protected)/confirm-submit-button.tsx`)
  — a `window.confirm()`-gated submit button. No confirm-before-delete pattern existed
  anywhere in the admin before this; used by delivery method/zone delete, ready to reuse
  for categories/brands/reviews when those land.

**Gotcha hit and resolved this pass**: while writing e2e coverage for the above, in-pane
`javascript_tool`/`computer` clicks in *this Claude Browser tool* repeatedly appeared not
to register (a button's React state never toggled). Root-caused to the same
`document.visibilityState === "hidden"` pane-not-displayed condition documented earlier in
this file under the Suspense-swap issue — it also stalls click-triggered React scheduler
work, not just streamed-Suspense swaps. Verified by running the *identical* interaction
through real Playwright (which does not have this issue) — it worked correctly first try.
**Lesson reinforced**: never trust an in-pane click/interaction test as proof of a bug
when the pane is backgrounded — check `document.visibilityState` first, and treat
Playwright (`pnpm e2e`) as the authoritative source for interactive behavior, not this
tool's live pane.

**Real e2e test bugs found+fixed while verifying (not app bugs)**: `getByPlaceholder(/product-/)`
assumed the fallback slug pattern, but the test's product name contained Latin text
("E2E" + digits) so `buildSlugBase` derived a real slug from that instead of falling
through to the timestamp fallback — fixed by targeting `input[name="slug"]` directly.
`getByLabel(..., {exact:true})` broke once required-field labels started rendering a
trailing `*` — fixed with a `/^label text/` prefix regex instead of `exact:true`.
`getByText()` can never find text inside an `<input value="...">` (it's not a text node)
— fixed with an attribute-value locator. All genuine test-code mistakes, not product bugs
— each was independently confirmed via manual Playwright debug scripts before "fixing".

Full suite: **67/68 e2e green** (the one failure, `editing a policy` on the `mobile`
project, is the already-documented pre-existing "duplicate element" flakiness — confirmed
by re-running it alone, passed; the test touches nothing changed this pass). Unit tests
45/45. `pnpm build`/`lint`/`typecheck` all clean.

---

Last updated: 2026-08-02 (resumed after host sleep; full re-verification; 1 real bug found+fixed)

## Resume-after-sleep notes
The host machine slept mid-session; both the embedded Postgres process and `next dev` were
killed as a result (OS-level, not app-related). Recovery is just: re-run
`node scripts/db/local-postgres.mjs` (reuses the existing `.data/postgres` cluster and its
generated password from `.env` — no data loss, no reprovisioning) then `pnpm dev`/`pnpm
start`. Re-running the full Playwright suite after this resume caught a real bug (see
below) — always worth doing after any environment interruption, not just trusting prior
"all green" summaries.

**Real bug found this pass**: `src/app/admin/(protected)/reviews/actions.ts` was missing
`revalidatePath("/")` on all six mutations — every other new admin section's actions file
had it, reviews didn't. Effect: hiding/rejecting a review didn't disappear from the public
homepage. Fixed; full suite re-run 44/44 green after the fix. See `VERIFICATION_REPORT.md`
for detail.

## Architecture decisions
- Next.js 15 App Router + TypeScript, `src/app` layout, Tailwind v4 (`@theme` tokens in `src/app/globals.css`), Prisma + PostgreSQL, pnpm.
- **Route groups**: public routes under `src/app/(storefront)/` (own layout: `SiteHeader`/`SiteFooter`/`CartProvider`/skip-link); protected admin routes under `src/app/admin/(protected)/` (own layout: `AdminShell` client component with responsive sidebar); `src/app/admin/login/` is a sibling *outside* `(protected)` — putting it inside caused an infinite redirect loop (found and fixed via e2e in the previous pass). Root `src/app/layout.tsx` is minimal: `<html>`/fonts/metadata only.
- All storefront pages are `force-dynamic` (root layout) — catalog/settings/homepage content is admin-editable and must never be statically cached across deploys.
- **Homepage is section-driven**: `HomepageSection` rows (key/titleAr/isEnabled/displayOrder/config JSON) control which blocks render on `/`, in what order, with what titles, and (for categories/featured/reviews) item limits. Managed via `/admin/homepage`.
- Cart/wishlist/recently-viewed are client-only, versioned localStorage — no customer accounts, per spec.
- Storage is provider-abstracted (`src/lib/storage.ts`): `local` (dev), `vercel-blob`, `r2` — selected via `STORAGE_PROVIDER`.
- Inventory is never decremented on order creation; `src/lib/inventory.ts` decrements/restores only inside a Prisma `$transaction`, guarded by `Order.inventoryApplied`.
- Checkout (`src/lib/checkout.ts`) always re-reads price/stock/visibility/delivery-fee/whatsapp-settings from the DB, idempotent via a client-generated UUID. Empty-string optional selects (`deliveryZoneId`/`paymentMethodId`) are converted to `null` before hitting Postgres — passing `""` causes an FK violation (real bug found via e2e in the previous pass, fixed).
- **RBAC**: 4 roles in `src/lib/auth/permissions.ts` — `SUPER_ADMIN`, `MANAGER`, `CATALOG_EDITOR`, `ORDER_STAFF`. New admin sections reuse existing permissions rather than adding new ones: `homepage:write` covers homepage/campaigns/reviews; `settings:write` covers delivery/payments/whatsapp/contact/policies/faq; `users:manage` (SUPER_ADMIN only) covers `/admin/users`.
- **Activity logging**: `src/lib/activity-log.ts` — `logActivity()` never throws (logging failures shouldn't block the mutation); every new admin action calls it.
- Arabic search remains an in-memory scan over all visible products per query — documented as needing a real index before the catalog grows large.

## Local database provisioning (unchanged from previous pass, still running)
`node scripts/db/local-postgres.mjs` — `embedded-postgres` npm package, real Postgres
binaries, zero Docker/account needed. Windows gotcha: needs `initdbFlags:
["--encoding=UTF8", "--locale=C"]` or the first Arabic insert fails. **New gotcha found
this pass**: `prisma migrate dev` fails with `EPERM` renaming the query-engine `.dll.node`
if `next start` is currently running (file lock) — must stop the running server before
`prisma generate`/`migrate`, then restart it after.

## Completed phases (all 10 previously-missing admin routes now built)
1–13 (previous pass): design extraction, scaffold, schema+seed, core lib, public storefront, checkout→WhatsApp, admin auth, admin dashboard/products/categories/brands/orders, local Postgres provisioning — all unchanged, still verified working.

14. **`/admin/homepage`** — section enable/disable/reorder(↑↓)/title-edit, hero slide CRUD with image upload + schedule dates, banner CRUD with image upload. Public `/` verified to reflect saved config.
15. **`/admin/campaigns`** — create (name/description/discount label/display location/dates/countdown/linked products+categories via multi-select), activate/deactivate/archive. Validates end>start and that linked IDs exist. Public homepage only shows campaigns where `isActive && startsAt<=now<=endsAt`.
16. **`/admin/delivery`** — delivery/pickup methods + zones (fee/estimated time/active), split out of the old consolidated `/admin/settings` page.
17. **`/admin/payments`** — payment method CRUD + visibility toggle, split out similarly.
18. **`/admin/whatsapp`** — number/display-number/template (with `findUnknownTemplatePlaceholders` validation rejecting unknown `{{vars}}`)/quick-replies/button-visibility-locations, live preview via a small client component.
19. **`/admin/reviews`** — approve/reject/show-hide/feature/archive/manual-create. Required schema additions: `Review.isVisible/isFeatured/isArchived` (didn't exist before — only `isApproved` did).
20. **`/admin/policies`** — editor for the 5 fixed slugs, plain-text rendering (no injection surface).
21. **`/admin/faq`** — create/reorder(↑↓ swaps `displayOrder`)/show-hide/delete.
22. **`/admin/contact`** — phone/address/map URL (client component with `useActionState` for validation errors), opening hours (7 fixed rows), social links CRUD. Footer now renders real `SocialLink` rows instead of nothing.
23. **`/admin/users`** — `SUPER_ADMIN`-only (`requirePermission("users:manage")` at the page level, not just nav hiding). List/create/role-change/activate-deactivate/revoke-sessions/password-reset. **Final-super-admin protection**: both role-downgrade and deactivate actions count remaining active super-admins (excluding the target) and refuse at zero — verified by a dedicated e2e test that actually attempts it.
24. Admin sidebar rebuilt as `AdminShell` (client component): grouped nav, active-state via `usePathname`, responsive (hamburger + off-canvas drawer under `md`), permission-gated "المستخدمون" group.
25. Accessibility fixes: skip links (storefront + admin), global `:focus-visible` ring, dialog/drawer `role="dialog"`/`aria-modal`/Escape-close/focus-restoration (search dialog, mobile category drawer), `aria-current` on active nav links, `role="alert"`/`role="status"` on all new form feedback, fixed two real un-associated `<label>`s (admin login, checkout) found via e2e.
26. Responsive: found and fixed a real ~6px horizontal-overflow bug (mobile bottom-nav cart badge) via direct browser DOM inspection at 375px; added a defensive `overflow-x: hidden` on `html, body` as a safety net.
27. Playwright: added `e2e/admin-settings-flow.spec.ts` (6 tests) + `e2e/admin-users.spec.ts` (2 tests) = 22 total, all passing at `workers: 1` (see below for why).

## Investigated and resolved: the "duplicate element" Playwright flakiness
Spent significant effort this pass tracking down why several new tests intermittently saw
`getByText(...)` resolve to 2 elements or a "should be 0, found 1" count. Root-caused (not
just worked around) to **Next.js's own client-side router prefetch cache**: it materializes
an invisible (`offsetParent: null`, zero-size, outside `<main>`) copy of prefetched page
content in the live DOM. Confirmed server sends each thing exactly once (`curl`), confirmed
via direct DOM queries in two independent browser automation tools (Playwright + Claude
Browser tool) that the inert copy is real but harmless (invisible, non-interactive, not
inside `<main>`). `getByText`/`getByRole` count-based assertions don't filter by visibility,
so they see it; under 2+ concurrent workers this becomes more likely to be caught mid-test.
**Fix applied**: `playwright.config.ts` now sets `fullyParallel: false, workers: 1` with a
comment explaining exactly this, and remaining ambiguous assertions use `.first()` or a
fresh `context.newPage()` for absence checks. This is the correct, understood fix — not a
guess.

## Brand logos (resolved 2026-08-02)
User provided 8 brand logo images, saved manually to `public/assets/brands/` (with
descriptive filenames like `Betahomes logo.png`). Copied to the expected lowercase slugs
(`ivega.png`, `qubit.png`, `maxsound.png`, `novalink.png`, `oryx.png`, `betahome.png`,
`sereen.png`, `neotec.png` — matching each `Brand.slug` exactly) and set `Brand.logoUrl`
to `/assets/brands/<slug>.png` for all 8 rows via a one-off Prisma script. Verified via
DOM/network inspection (screenshots unavailable — Browser pane wasn't compositing) that
all 8 render correctly on `/`, `/brands`, and the `/shop` brand filter — all three consume
the shared `BrandCircle` component, so one DB update covered all three surfaces. No further
action needed on this item.

## Animated Hero logo (added 2026-08-02)
User provided `animated_ivega_logo.gif` at Desktop root. Copied to
`public/assets/ivega-animated-logo.gif`, added to the homepage Hero
(`src/app/(storefront)/page.tsx`) via `next/image` with `unoptimized` (required — Next's
image optimizer would otherwise flatten the GIF to a static first frame). Layout: flex
row, text first then logo in DOM order — in the project's RTL layout this puts the logo
on the visual left as requested, text on the right, both within the same existing blue
Hero background (no separate section). On mobile it stacks (`flex-col`): text above,
logo below. Verified: GIF served raw (`image/gif`, 200) not run through `/_next/image`,
no horizontal overflow at 375px, full Playwright suite (62/62) and unit tests (36/36)
still green after the change, `pnpm build`/`lint`/`typecheck` all clean.

**Gotcha hit and resolved this pass**: running `pnpm e2e` while `pnpm dev` was still bound
to port 3000 corrupted the dev server's `.next` (Playwright's `webServer` ran `next build`
concurrently, clobbering the dev build cache mid-request → dev server started 500ing).
Fix: always stop `next dev` before running `pnpm e2e` (which does its own `next build && next
start` on the same port), then restart `pnpm dev` afterward.

## Hero reorder + brand-click verification (2026-08-02, same pass)
Moved the Hero section (with the animated logo) to be the *first* section on the homepage,
ahead of categories — supersedes the earlier "categories first" decision per explicit user
request. Enlarged Hero vertical padding and logo size slightly (`h-48/w-48` → `md:h-64/w-64`,
was `h-40/w-40` → `md:h-56/w-56`).

User then asked to confirm every brand icon actually navigates to that brand's real
products "wherever it appears." Verified empirically (not assumed) via direct fetch of
rendered HTML for all 8 brand slugs through `/shop?brand=<slug>`: product counts matched
`/brands` exactly (ivega 10, qubit 2, maxsound 2, novalink 3, oryx 3, betahome 3, sereen 2,
neotec 1) — filtering was already correct in all three surfaces (homepage `BrandScroller`,
`/brands` grid → `/brands/[slug]`, shop filter bar).

**Re-discovered the e2e-leftover-data issue** (previously fixed once, item 8 in the older
"last session" list): running `pnpm e2e` during this pass reseeded two `9.99`-price test
products (`e2e-test-product-*`) tied to the `ivega` brand, which briefly inflated its count
from 10 to 12. Deleted both (verified zero referencing `OrderItem` rows first). **Any time
`pnpm e2e` is run against this local DB, re-check for `price: 9.99` / `slug contains
"e2e-test"` products afterward** — the admin-creation e2e test writes real rows to the
shared local Postgres, it doesn't roll back.

## Offers merged into Shop as a filter chip (2026-08-03)
Per explicit user request, removed the standalone `/offers` page/nav item and folded it
into `/shop` as an "العروض" toggle chip using the existing real `Product.badge = OFFER`
enum value (not invented — same enum already backing the old page). `/shop` now accepts
`?badge=OFFER` (validated against the real `ProductBadge` enum in
`src/app/(storefront)/shop/page.tsx`), `CatalogGrid`'s pagination links preserve it, and
`CatalogFiltersBar` renders the chip with `aria-pressed`. `/offers` itself is now a
redirect to `/shop?badge=OFFER` (same pattern as the earlier `/contact` → `/support`
redirect) so old links/bookmarks don't 404. Footer's "العروض" link updated to point at the
new URL. Nav item removed from `site-nav.tsx`. Updated the existing nav-active-state e2e
test (`public-site-fixes.spec.ts`) which had hardcoded an assertion against the old
`/offers` page, and added a new test for the redirect + chip toggle. Full suite: 64/64
green (added 1 test to the previous 62 + 1 already-existing offers/nav test updated, not
duplicated).

## Debugging note: this session's automated browser pane was intermittently unreliable
Mid-session, direct in-pane checks (`javascript_tool`, `read_page`) repeatedly showed
`/shop`, `/`, and other pages stuck rendering only the route's `loading.tsx` skeleton,
even after a full dev-server + `.next` wipe restart and in a brand-new tab — looked like a
real product bug at first. Root-caused it to the pane itself: `document.visibilityState`
was `"hidden"` (the pane wasn't actively displayed/composited to the user at the time,
same condition that makes `computer` screenshot calls fail with "not compositing frames").
React's streamed-Suspense-swap runtime (`$RC`/`$RV` in the page's inline scripts) is
gated on `requestAnimationFrame`, which browsers never fire for a hidden/non-composited
document — so the already-ready content sat queued in `window.$RB` forever. Confirmed by
manually calling `window.$RV(window.$RB)` from `javascript_exec`, which instantly
resolved the "stuck" page to its full real content. **If this recurs**: don't conclude
the app is broken from in-pane checks alone — check `document.visibilityState` first, and
if it's `"hidden"`, either ask the user to keep the pane visible/foregrounded during the
check, or fall back to Playwright (`pnpm e2e`) / direct `fetch()`/`curl` against the
dev server, both of which are unaffected and remain the authoritative verification path.
Real user browser tabs in normal foreground use are not subject to this.

## Real bug found and fixed: brand switching inside /brands/[slug] (2026-08-03)
User reported: clicking a brand from the homepage or /brands correctly filters to that
brand's products — but once already on that filtered page, clicking a *different* brand
circle did nothing. Root cause: `/brands/[slug]/page.tsx` filters products by its own
**route segment** (`params.slug`), while the shared `CatalogFiltersBar`'s brand-circle
click handler only knew how to toggle a `?brand=` **query param** (correct on `/shop` and
`/category/[slug]`, which do read `sp.brand` — but `/brands/[slug]` never looked at the
query string, so clicking another circle just appended a useless `?brand=` to the same
URL and nothing changed). Fixed in `catalog-filters-bar.tsx`: detect when `basePath`
matches `/brands/[slug]` and route brand-circle clicks through `router.push("/brands/" +
slug)` instead (a real route change), with "مسح التصفية" linking to `/brands` in that case.
Added a regression e2e test verifying the product list and page heading actually change
when switching brands from within `/brands/[slug]`. Full suite: 66/66 green.

## Known issues / unresolved (updated 2026-08-09)
- **Categories many-to-many** (spec §6) — DONE, see the dedicated section above. **Brands
  deliberately stayed single-FK** per the same original spec's own instruction not to add
  a many-to-many brand relation without real justification — this is intentional, not a gap.
- **Full campaign pricing engine** (spec §8) — DONE, see the dedicated section above.
- **Still not done**: product form 9-section reorg with a dedicated SEO sub-form and
  multi-image media section (spec §5) — current form groups fields into fieldsets already
  but doesn't split out a dedicated SEO section or support multiple images per product from
  the create/edit form (multi-image exists in the `ProductImage` model already, just not
  exposed as a multi-upload UI here).
- No full responsive audit (8 breakpoints × every route) — targeted spot-check only, one real bug found and fixed.
- No automated accessibility tool (axe) — targeted manual fixes only, not a WCAG audit.
- Drag-and-drop reordering nowhere in admin — up/down buttons used instead (FAQ, homepage sections).
- No bulk product actions, product duplication, dedicated SEO sub-form, or `ProductCard` `horizontal` variant.
- In-memory Arabic search still unindexed (unchanged from previous pass).
- Production deployment against a real managed Postgres not performed — needs a hosting-provider account only the user can create (see `DEPLOYMENT.md`).

## Environment requirements for the next session
- `node scripts/db/local-postgres.mjs` running in the background before any DB-touching command.
- **Admin login (current, since the 2026-08-06/09 final-delivery pass): `admin@ivega.com` /
  `Ivega+12345@`** — the old `admin@ivega.test`/`ChangeMe123456!` account was deliberately
  deleted as part of "one real admin account only" cleanup and no longer exists. If the
  local DB is ever wiped and needs a fresh admin, don't just run bare `pnpm admin:create`
  (it prompts for env vars) — run
  `ADMIN_EMAIL=admin@ivega.com ADMIN_PASSWORD='Ivega+12345@' ADMIN_NAME=iVEGA pnpm admin:create`.
- Remember the Windows `EPERM` gotcha: stop `next start` before `prisma generate`/`migrate`.
- **When running `pnpm e2e` (or pointing Playwright at a manually-started server via
  `E2E_BASE_URL`) also pass `E2E_ADMIN_EMAIL=admin@ivega.com
  E2E_ADMIN_PASSWORD='Ivega+12345@'`** — the e2e specs' `login()` helpers default to the
  now-deleted old test credentials.
- **If manually starting `pnpm start`/`pnpm dev` to point Playwright at via
  `E2E_BASE_URL`, also export `E2E_TESTING=1` first** (e.g.
  `E2E_TESTING=1 nohup pnpm start > /tmp/x.log 2>&1 &`) — otherwise the DB-backed rate
  limiter (`src/lib/rate-limit.ts`) will genuinely throttle the suite's rapid-fire logins/
  checkouts (this bypass is set automatically by `playwright.config.ts`'s `webServer.env`
  only when Playwright spawns the server itself, not for a manually-started one).
- **After any `pnpm e2e` run, check for leftover `Campaign` rows** before trusting a
  campaign-pricing e2e result — a test that fails partway (before its own cleanup step)
  can leave still-`isEnabled` campaigns that silently keep discounting products in the next
  run, which looks exactly like a pricing-resolver bug but isn't (see the campaign-engine
  section above for the exact incident this happened in).

## Next actions (recommended order)
1. Full responsive/accessibility audit if still desired (a dedicated pass, not a spot-check).
2. Drag-and-drop reordering for categories/brands/product images if the up/down-button UX isn't sufficient.
3. Bulk admin actions / product duplication / SEO sub-form.
4. Move Arabic search off the in-memory scan once the catalog grows.
5. Production deployment: provision a real managed Postgres (Neon/Supabase/Railway/RDS — requires the user to create/authenticate that account) and run `db:deploy`/`db:seed`/`admin:create` against it per `DEPLOYMENT.md`.
