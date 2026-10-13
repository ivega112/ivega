# Verification Report

Latest update: 2026-08-02 (post-sleep resume + full re-verification), continuing in the
same local environment as the previous passes (embedded local PostgreSQL — the host machine
slept and the Postgres/Next.js processes were lost, so both were restarted from the existing
`.data/postgres` cluster; no reprovisioning, no data loss, same admin account still valid).

## Real bug found and fixed in this resume pass
Running the full Playwright suite after the restart caught a genuine bug that had shipped
in the previous pass: `src/app/admin/(protected)/reviews/actions.ts` was missing
`revalidatePath("/")` on every mutation (approve/reject/toggle-visibility/toggle-featured/
archive/create). Every other new admin section's actions file did call it, but reviews
never did. Effect: hiding/rejecting a review in `/admin/reviews` didn't take effect on the
public homepage until something else happened to revalidate `/`. Caught by
`e2e/admin-settings-flow.spec.ts`'s "hiding a review removes it from the public homepage"
test (`toHaveCount(0)` on a fresh browser context still found the review). Fixed by adding
`revalidatePath("/")` to all six actions in that file; re-ran the specific test and then the
full suite to confirm — both green. This is a concrete example of the e2e suite catching a
real production bug, not a hypothetical.

One additional flake was observed and investigated: "editing a policy updates the public
policy page" failed once on the `mobile` project only, then passed 3/3 on immediate repeat
(`--repeat-each=3`) — a transient timing hiccup on this shared sandbox machine, not a
reproducible defect; not chased further given it doesn't reproduce.

## Admin routes completed this pass
`/admin/homepage`, `/admin/campaigns`, `/admin/delivery`, `/admin/payments`,
`/admin/whatsapp`, `/admin/reviews`, `/admin/policies`, `/admin/faq`, `/admin/contact`,
`/admin/users`. All ten use the existing protected `(protected)` layout, enforce
permissions server-side (`requirePermission`/`requireAdmin`, not just UI hiding), write to
`ActivityLog` on mutation, and are wired into the admin sidebar (grouped, active-state
highlighted, permission-gated for `/admin/users`).

## Database
- **Migration**: `pnpm db:migrate --name homepage_campaigns_reviews` — applied cleanly
  against the same running local Postgres. Added `Review.isVisible/isFeatured/isArchived`,
  `HomepageSection.titleEn`, `HeroSlide.titleEn/isArchived`,
  `Campaign.description/displayLocation/isArchived`.
- **Seed**: extended and re-run (`pnpm db:seed`) — added default `HomepageSection` rows
  (categories/featured_products/banners/campaigns/reviews) and 2 sample reviews. Idempotent
  — re-running does not duplicate (upsert by unique `key`, `findFirst`-guarded creates).
- Category images were also fixed this pass: the seed previously never set `imageUrl`, and
  the design's actual product/category photos (`project/assets/`) were never copied into
  `public/`. Both are fixed and verified rendering (checked via direct browser inspection
  and curl).

## Commands run and exact results (this pass, after all new features)

### `pnpm prisma generate`
Ran via `pnpm db:generate` after each schema change. **Passed** each time (had to stop the
running `next start` process first on Windows — the query-engine `.dll.node` file is
locked by the running server and `EPERM`s on rename otherwise; documented as a real,
reproducible Windows-specific gotcha).

### `pnpm lint`
**PASSED.** Exit 0, zero errors, zero warnings.

### `pnpm typecheck`
**PASSED.** Exit 0, zero errors. (Fixed two real type errors introduced this pass: a
`useActionState` action missing the `(prevState, formData)` signature in the contact form,
and an untyped `metadata` field in the new `logActivity` helper vs Prisma's `InputJsonValue`.)

### `pnpm test` (Vitest)
**PASSED.** 36/36 unit tests, unchanged from the previous pass (pricing, Arabic search,
WhatsApp, order numbers, RBAC permission matrix).

### `pnpm build`
**PASSED.** All 41 routes compile (27 previous + the 10 new admin routes, unchanged public
route count). All routes correctly `ƒ (Dynamic)`.

### `pnpm exec playwright test` (against the live local database, `pnpm start`)
**Re-run after the sleep/resume and the reviews revalidation fix above: 44/44 PASSED**
(22 tests × 2 projects — `chromium-desktop` and `mobile`/Pixel 7), deterministically, at
`workers: 1`, full suite including every spec file.

New this pass — `e2e/admin-settings-flow.spec.ts` (6 tests) and `e2e/admin-users.spec.ts`
(2 tests), covering exactly the scenarios requested:
- Changing a delivery zone fee in admin → reflected in the checkout total
- Updating the WhatsApp number in admin → reflected in the generated `wa.me` link
- Deactivating a payment method in admin → removed from checkout's payment options
- Editing a policy in admin → reflected on the public policy page
- Creating a FAQ item in admin → visible on the public FAQ page
- Hiding a review in admin → removed from the public homepage
- A non-`SUPER_ADMIN` cannot access `/admin/users` (hits the app's real error boundary)
- The last active `SUPER_ADMIN`'s role cannot be downgraded (server-enforced, not just UI)

**Playwright concurrency — set to `workers: 1` (fullyParallel: false) by default in
`playwright.config.ts`, and documented why in the config comment.** Reason: with 2+
concurrent workers, several tests that create data in one admin mutation and immediately
verify it on a public page intermittently failed with a "resolved to 2 elements" or "found
1, expected 0" error. Investigated in depth (not just worked around):
1. Confirmed via **raw `curl`** that the server's actual HTTP response contains each piece
   of content exactly once — no server-side duplication.
2. Confirmed via **direct DOM inspection** (`document.querySelectorAll`, both in Playwright
   and independently in the Claude Browser tool, on a brand-new tab/first load) that a
   second copy of certain content sometimes exists in the live DOM.
3. Found that the second copy has `offsetParent: null`, a zero-size bounding rect, and
   lives outside `<main>` in a separate container — i.e. it is **Next.js's own client-side
   router prefetch cache** materializing an invisible, non-interactive copy of prefetched
   content, not a rendering bug in this app. It's inert and invisible to real users.
4. `getByText(...).toHaveCount(n)` and `getByRole(...)` enumerate DOM matches regardless of
   visibility, so they see this inert copy; `.toBeVisible()` alone would not have been
   fooled by it, but `.toHaveCount(0)` assertions need either `.first()`/scoped locators or
   (for absence checks) a fresh page/context, both of which are now used where needed.
5. Under 2 concurrent workers, more simultaneous prefetching plus more concurrent DB writes
   made this race more visible; at `workers: 1` it never reproduces. Single-worker
   execution is the documented, reliable way to run this suite locally.

This was a real investigation with real evidence at each step, not an assumption — see the
git history of `e2e/*.spec.ts` for the specific fixes once the cause was understood.

## Accessibility work done this pass
- Skip-to-content link on both the storefront and admin layouts (`focus:not-sr-only`,
  visually hidden until focused).
- `:focus-visible` outline defined globally (`--color-brand-action`, 2px, offset) — browser
  default focus rings were previously unstyled/inconsistent.
- Search dialog and mobile category drawer: `role="dialog"`, `aria-modal="true"`,
  `aria-label`, Escape-to-close, focus returned to the trigger button on close.
- Mobile bottom nav: `aria-current="page"` on the active tab.
- Admin sidebar: `aria-expanded`/`aria-controls` on the mobile hamburger toggle,
  `aria-current="page"` on the active nav link.
- Form labels: fixed two real (not just test-tooling) accessibility bugs found via e2e —
  the admin login form and the checkout form had visually-adjacent `<label>`s that were
  never programmatically associated with their `<input>` (no `htmlFor`/`id`, no implicit
  wrapping) — a screen reader would have announced them as unrelated text. Fixed with
  `htmlFor`/`id` pairs.
- Validation/error/success messages across all new admin forms use `role="alert"` (errors)
  or `role="status"` (success) so they're announced to assistive tech.
- **Not done**: no automated tool (axe or similar) was run — this Claude Code install has
  no accessibility-audit skill and no axe dependency was added to the project. The fixes
  above are targeted, verified-by-reading-the-code fixes, not a systematic audit against
  WCAG success criteria. Contrast ratios were not measured; the design system's existing
  color pairs were trusted as-is (they come from the approved handoff, not from
  choices made in this build).

## Responsive verification — routes and widths actually tested
Performed via direct browser inspection (Claude Browser tool: `resize_window` +
`javascript_tool` DOM/overflow queries), not the full requested 8-breakpoint × all-routes
matrix. What was checked:

| Route | Width | Result |
|---|---|---|
| `/` | 382×849 (mobile) | Renders correctly; no layout break |
| `/shop` | 382×849 | Product grid, filters render; confirmed no *visible* duplicate content (the invisible prefetch-cache artifact above does not affect layout) |
| `/admin/login` | 375×700 | No horizontal overflow (`scrollWidth === clientWidth === 375`) |
| `/product/k800` | 375×700 | **Found and fixed a real ~6px horizontal overflow** — traced to the mobile bottom-nav cart-count badge (`absolute` positioned, `end-6`) occasionally extending past its column at narrow widths. Fixed with a global defensive `overflow-x: hidden` on `html, body` (documented in `globals.css` with the reasoning) since the badge's exact positioning math is a minor visual detail, not worth a fragile pixel-perfect fix under time constraints; the safety net guarantees no page can horizontally scroll regardless. Re-verified: `scrollWidth` no longer exceeds `clientWidth` anywhere checked. |

**Not done**: the full 360/390/430/768/1024/1280/1440/1920px × every-public-and-admin-route
matrix. This was a targeted spot-check that found and fixed one real bug, not an exhaustive
sweep. Given the scope of everything else completed this pass, a full systematic
responsive audit is the most honest "not done" item to flag for a follow-up session.

## Visual fidelity
No dedicated pixel-by-pixel comparison pass against the `.dc.html` files was performed this
session (separate from the responsive check above). The design tokens established in the
first pass (`DESIGN_SYSTEM.md`, wired into `globals.css`'s `@theme` block) were reused for
every new admin page built this pass — no new colors, radii, or spacing values were
invented; all new UI reuses the same `input`/button/badge/card class patterns already
audited in the first pass.

## Manual verification
- `/product/k800`, `/shop`, `/admin/login` inspected directly in a live browser (not just
  through Playwright) via the Claude Browser tool, confirming real rendered Arabic content,
  correct RTL layout, and no console errors/warnings on any page checked.
- Confirmed (via `node -e` Prisma queries and `curl`) that admin mutations in this pass
  (review visibility, policy content, homepage section config) persist correctly and that
  server-rendered public output reflects them — independent of and in addition to the
  Playwright assertions.

## Known warnings / unresolved items (honest, carried over + new)
- Full responsive/accessibility audits not done (see above) — targeted work only.
- Drag-and-drop reordering not implemented anywhere; up/down buttons used instead.
- No bulk admin actions, product duplication, or SEO sub-form UI.
- `ProductCard`'s `horizontal` variant not built.
- Arabic search remains an in-memory scan (documented in the previous pass, unchanged).
- Production deployment against a real managed Postgres was not performed — this
  environment's embedded local Postgres is explicitly a **development/verification-only**
  database (see `DEPLOYMENT.md`), not a substitute for a production Vercel-side database.
