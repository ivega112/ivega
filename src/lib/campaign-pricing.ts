// Note: deliberately no "server-only" guard (unlike most src/lib DB-touching files) —
// the pure functions here (getCampaignStatus, calculateFinalPriceFromPercent,
// calculatePercentFromFinalPrice, resolveEffectivePrice) are unit-tested directly in
// campaign-pricing.test.ts, and vitest can't resolve the "server-only" stub package. The
// DB-touching functions below still can't run client-side regardless — they import
// `prisma`, which has its own guard.
import { prisma } from "@/lib/prisma";
import { toMoney } from "@/lib/pricing";
import type { Campaign, CampaignBrand, CampaignCategory, CampaignProduct, CampaignProductPrice } from "@prisma/client";

export type CampaignStatus = "DRAFT" | "SCHEDULED" | "ACTIVE" | "EXPIRED";

/**
 * Deterministic from timestamps + isEnabled alone — no cron/scheduled job needed to keep
 * this correct (spec §8.2). Draft: saved but not enabled. Scheduled: enabled, start is
 * future. Active: enabled and now is within range. Expired: end has passed.
 */
export function getCampaignStatus(
  campaign: { isEnabled: boolean; startsAt: Date; endsAt: Date },
  now: Date = new Date()
): CampaignStatus {
  if (!campaign.isEnabled) return "DRAFT";
  if (now < campaign.startsAt) return "SCHEDULED";
  if (now > campaign.endsAt) return "EXPIRED";
  return "ACTIVE";
}

/** finalPrice = originalPrice × (1 - percent/100), JOD-rounded (spec §8.6). */
export function calculateFinalPriceFromPercent(basePrice: number, percent: number): number {
  return toMoney(basePrice * (1 - percent / 100));
}

/** discountPercent = ((original - final) / original) × 100, rounded to 2dp (spec §8.7). */
export function calculatePercentFromFinalPrice(basePrice: number, finalPrice: number): number {
  if (basePrice <= 0) return 0;
  return Math.round(((basePrice - finalPrice) / basePrice) * 10000) / 100;
}

export interface EffectivePrice {
  basePrice: number;
  finalPrice: number;
  discountPercent: number;
  savedAmount: number;
  campaignId: string;
  campaignName: string;
}

type ActiveCampaign = Campaign & {
  products: Pick<CampaignProduct, "productId">[];
  categories: Pick<CampaignCategory, "categoryId">[];
  brands: Pick<CampaignBrand, "brandId">[];
  productPrices: Pick<CampaignProductPrice, "productId" | "finalPrice">[];
};

/**
 * One query for every currently-ACTIVE campaign and its (small) target lists — callers
 * resolve prices for as many products as needed against this single result instead of
 * querying per-product (avoids N+1 across a product grid/list).
 */
export async function getActiveCampaignsWithTargets(now: Date = new Date()): Promise<ActiveCampaign[]> {
  return prisma.campaign.findMany({
    where: { isEnabled: true, isArchived: false, startsAt: { lte: now }, endsAt: { gte: now } },
    include: {
      products: { select: { productId: true } },
      categories: { select: { categoryId: true } },
      brands: { select: { brandId: true } },
      productPrices: { select: { productId: true, finalPrice: true } },
    },
  });
}

export interface PriceableProduct {
  id: string;
  categoryId: string;
  brandId: string;
  price: number;
  /** Secondary categories (src/lib/catalog.ts ProductCategory join) — a campaign targeting
   * any of a product's categories, primary or additional, applies to it. */
  additionalCategoryIds?: string[];
}

/**
 * Resolves the single best (lowest final customer price) currently-active campaign price
 * for one product against an already-fetched active-campaign list. Non-stacking: exactly
 * one campaign (or none) ever applies. Deterministic tie-break when two campaigns produce
 * the same final price: higher `priority` first, then earlier `createdAt`, then `id` — see
 * spec §8.9. Returns null (base price applies) when no active campaign targets the product.
 */
export function resolveEffectivePrice(product: PriceableProduct, activeCampaigns: ActiveCampaign[]): EffectivePrice | null {
  const additionalIds = product.additionalCategoryIds ?? [];
  const candidates: (EffectivePrice & { priority: number; createdAt: Date })[] = [];

  for (const c of activeCampaigns) {
    const targeted =
      c.products.some((p) => p.productId === product.id) ||
      c.categories.some((cc) => cc.categoryId === product.categoryId || additionalIds.includes(cc.categoryId)) ||
      c.brands.some((b) => b.brandId === product.brandId);
    if (!targeted) continue;

    let finalPrice: number;
    if (c.discountMode === "PERCENTAGE") {
      if (c.discountPercentage == null) continue;
      finalPrice = calculateFinalPriceFromPercent(product.price, Number(c.discountPercentage));
    } else {
      // FINAL_PRICE mode is snapshot-based — a category/brand match alone is NOT enough;
      // the product must have an explicit resolved-at-configuration-time row, or this
      // campaign silently does nothing for it (never an undefined price — spec §8.4/§8.7).
      const snapshot = c.productPrices.find((p) => p.productId === product.id);
      if (!snapshot) continue;
      finalPrice = toMoney(Number(snapshot.finalPrice));
    }
    if (finalPrice >= product.price) continue; // a campaign can never raise the price

    candidates.push({
      basePrice: product.price,
      finalPrice,
      discountPercent: calculatePercentFromFinalPrice(product.price, finalPrice),
      savedAmount: toMoney(product.price - finalPrice),
      campaignId: c.id,
      campaignName: c.nameAr,
      priority: c.priority,
      createdAt: c.createdAt,
    });
  }

  if (candidates.length === 0) return null;
  candidates.sort((a, b) => {
    if (a.finalPrice !== b.finalPrice) return a.finalPrice - b.finalPrice;
    if (a.priority !== b.priority) return b.priority - a.priority;
    if (a.createdAt.getTime() !== b.createdAt.getTime()) return a.createdAt.getTime() - b.createdAt.getTime();
    return a.campaignId.localeCompare(b.campaignId);
  });
  const { priority: _priority, createdAt: _createdAt, ...winner } = candidates[0]!;
  void _priority;
  void _createdAt;
  return winner;
}

/** Convenience single-product wrapper — fetches active campaigns itself. Prefer
 * `getActiveCampaignsWithTargets` + `resolveEffectivePrice` directly when pricing more than
 * one product (product grids, cart) to avoid repeating the campaign query. */
export async function getEffectivePrice(product: PriceableProduct): Promise<EffectivePrice | null> {
  const activeCampaigns = await getActiveCampaignsWithTargets();
  return resolveEffectivePrice(product, activeCampaigns);
}

/**
 * Batch version of `getEffectivePrice` for a list of products (product grids, cart lines) —
 * one campaign query total, not one per product. Returns a Map keyed by productId; a
 * missing entry means the base price applies (no active campaign matched).
 */
export async function getEffectivePricesForProducts(products: PriceableProduct[]): Promise<Map<string, EffectivePrice>> {
  if (products.length === 0) return new Map();
  const activeCampaigns = await getActiveCampaignsWithTargets();
  const map = new Map<string, EffectivePrice>();
  for (const p of products) {
    const resolved = resolveEffectivePrice(p, activeCampaigns);
    if (resolved) map.set(p.id, resolved);
  }
  return map;
}

/** Resolves the full set of products a campaign's current targeting (product/category/brand
 * selections) matches — deduplicated. Used by the admin editor to show "N منتج متأثر" and,
 * for FINAL_PRICE mode, to build the per-product price table (spec §8.4). */
export async function resolveCampaignTargetProductIds(targeting: {
  productIds: string[];
  categoryIds: string[];
  brandIds: string[];
}): Promise<string[]> {
  if (targeting.productIds.length === 0 && targeting.categoryIds.length === 0 && targeting.brandIds.length === 0) {
    return [];
  }
  const products = await prisma.product.findMany({
    where: {
      isArchived: false,
      OR: [
        targeting.productIds.length > 0 ? { id: { in: targeting.productIds } } : undefined,
        targeting.categoryIds.length > 0
          ? {
              OR: [
                { categoryId: { in: targeting.categoryIds } },
                { additionalCategories: { some: { categoryId: { in: targeting.categoryIds } } } },
              ],
            }
          : undefined,
        targeting.brandIds.length > 0 ? { brandId: { in: targeting.brandIds } } : undefined,
      ].filter((x): x is NonNullable<typeof x> => x !== undefined),
    },
    select: { id: true },
  });
  return [...new Set(products.map((p) => p.id))];
}
