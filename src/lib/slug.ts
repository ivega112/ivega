// Pure, framework-agnostic slug helpers — safe to import from client components (e.g. the
// live slug preview in the product form) since this file never touches Prisma or the DB.
// The DB-dependent uniqueness resolver lives in slug-server.ts.

const SLUG_PATTERN = /^[a-z0-9-]+$/;

export function slugify(text: string): string {
  return text
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // strip diacritics
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function isValidSlug(slug: string): boolean {
  return slug.length > 0 && slug.length <= 80 && SLUG_PATTERN.test(slug);
}

/**
 * Best-effort Latin base for a product slug. Prefers nameEn, then model (both are already
 * Latin-script in this catalog), then nameAr (harmless if it produces nothing usable — the
 * empty-base fallback below covers that). Never machine-translates/transliterates Arabic:
 * that would produce misleading, unreviewed URLs.
 */
export function buildSlugBase(input: { nameEn?: string | null; nameAr?: string | null; model?: string | null }): string {
  for (const candidate of [input.nameEn, input.model, input.nameAr]) {
    if (!candidate) continue;
    const s = slugify(candidate);
    if (s) return s;
  }
  // No usable Latin text anywhere — fall back to a short, still-readable timestamp slug
  // rather than leaving the product without one. Documented in DESIGN spec §4 as the
  // "only if required for uniqueness/validity" escape hatch.
  return `product-${Date.now().toString(36)}`;
}
