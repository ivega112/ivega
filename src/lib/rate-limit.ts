import "server-only";
import { randomUUID } from "node:crypto";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";

export class RateLimitError extends Error {
  constructor(message = "طلبات كثيرة جداً، يرجى المحاولة لاحقاً") {
    super(message);
    this.name = "RateLimitError";
  }
}

/**
 * Atomic fixed-window rate limiter backed by Postgres (not in-memory — this app deploys to
 * Vercel, where each request may land on a different ephemeral function instance with no
 * shared memory; an in-memory counter would silently do nothing there). The upsert's
 * CASE-based window rollover happens in one round-trip, so concurrent requests can't race
 * past the limit the way a naive "read count, then write count+1" would.
 *
 * Returns true if the request is allowed, false if it should be rejected.
 */
export async function checkRateLimit(key: string, opts: { windowMs: number; max: number }): Promise<boolean> {
  // The e2e suite intentionally builds+runs a real production server (`next build && next
  // start`, same NODE_ENV=production as a genuine deploy) and drives dozens of checkouts/
  // logins from one machine within minutes — exactly the traffic pattern this limiter
  // exists to block. E2E_TESTING is set only by playwright.config.ts's webServer, never in
  // a real deployment, so this bypass can't leak into production.
  if (process.env.E2E_TESTING === "1") return true;

  const windowSeconds = Math.max(1, Math.ceil(opts.windowMs / 1000));
  const id = randomUUID();
  const rows = await prisma.$queryRaw<{ count: number }[]>`
    INSERT INTO "RateLimitEntry" (id, key, count, "windowStart")
    VALUES (${id}, ${key}, 1, now())
    ON CONFLICT (key) DO UPDATE SET
      count = CASE
        WHEN "RateLimitEntry"."windowStart" < now() - (${windowSeconds}::text || ' seconds')::interval
        THEN 1
        ELSE "RateLimitEntry".count + 1
      END,
      "windowStart" = CASE
        WHEN "RateLimitEntry"."windowStart" < now() - (${windowSeconds}::text || ' seconds')::interval
        THEN now()
        ELSE "RateLimitEntry"."windowStart"
      END
    RETURNING count;
  `;
  const count = rows[0]?.count ?? 1;
  return count <= opts.max;
}

/** Best-effort client IP from the standard proxy header Vercel (and most hosts) set. Falls
 * back to a shared bucket for local dev / environments that don't set it — acceptable since
 * rate limiting is meaningless against yourself on localhost anyway. */
export async function getClientIp(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return h.get("x-real-ip") ?? "unknown";
}

/** Throws RateLimitError if the given action+IP combination is over its limit. */
export async function enforceRateLimit(action: string, opts: { windowMs: number; max: number }): Promise<void> {
  const ip = await getClientIp();
  const allowed = await checkRateLimit(`${action}:${ip}`, opts);
  if (!allowed) throw new RateLimitError();
}
