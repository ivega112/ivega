import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  // Kept intentionally serial (not fullyParallel) and capped at 1 worker by default.
  // This suite mixes admin-mutation tests with public-page verification against a single
  // local embedded-postgres instance; under 2+ concurrent workers on this Windows dev
  // sandbox, RSC navigation for public pages occasionally serves a stale render for a few
  // hundred ms after a concurrent admin mutation (confirmed via direct DB reads + curl
  // showing the underlying data was always correct — it's a rendering-timing artifact
  // under load, not an application bug). Single-worker execution is fully deterministic.
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: "html",
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    { name: "chromium-desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    command: "pnpm build && pnpm start",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    // Bypasses the DB-backed rate limiter (src/lib/rate-limit.ts) — the suite drives many
    // checkouts/logins from one IP within minutes, which real production traffic never
    // legitimately does. Never set this in an actual deployment.
    env: { E2E_TESTING: "1" },
  },
});
