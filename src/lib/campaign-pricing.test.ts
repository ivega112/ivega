import { describe, expect, it } from "vitest";
import {
  getCampaignStatus,
  calculateFinalPriceFromPercent,
  calculatePercentFromFinalPrice,
  resolveEffectivePrice,
  type PriceableProduct,
} from "./campaign-pricing";
import type { CampaignDiscountMode } from "@prisma/client";

describe("getCampaignStatus", () => {
  const now = new Date("2026-06-15T12:00:00Z");

  it("is DRAFT when not enabled, regardless of dates", () => {
    expect(getCampaignStatus({ isEnabled: false, startsAt: new Date("2026-01-01"), endsAt: new Date("2026-12-31") }, now)).toBe("DRAFT");
  });

  it("is SCHEDULED when enabled but start is in the future", () => {
    expect(getCampaignStatus({ isEnabled: true, startsAt: new Date("2026-07-01"), endsAt: new Date("2026-12-31") }, now)).toBe("SCHEDULED");
  });

  it("is ACTIVE when enabled and now is within range", () => {
    expect(getCampaignStatus({ isEnabled: true, startsAt: new Date("2026-01-01"), endsAt: new Date("2026-12-31") }, now)).toBe("ACTIVE");
  });

  it("is EXPIRED when end has passed", () => {
    expect(getCampaignStatus({ isEnabled: true, startsAt: new Date("2026-01-01"), endsAt: new Date("2026-06-01") }, now)).toBe("EXPIRED");
  });
});

describe("calculateFinalPriceFromPercent", () => {
  it("applies finalPrice = original × (1 - percent/100)", () => {
    expect(calculateFinalPriceFromPercent(100, 20)).toBe(80);
    expect(calculateFinalPriceFromPercent(15.5, 10)).toBe(13.95);
  });
});

describe("calculatePercentFromFinalPrice", () => {
  it("computes the implied discount percent", () => {
    expect(calculatePercentFromFinalPrice(100, 80)).toBe(20);
    expect(calculatePercentFromFinalPrice(20, 15)).toBe(25);
  });

  it("returns 0 for a non-positive base price rather than dividing by zero", () => {
    expect(calculatePercentFromFinalPrice(0, 0)).toBe(0);
  });
});

function makeCampaign(overrides: Record<string, unknown> = {}) {
  return {
    id: "camp-1",
    nameAr: "حملة اختبار",
    description: null,
    promoTextAr: null,
    badgeText: null,
    bannerImageUrl: null,
    mobileBannerImageUrl: null,
    ctaLabel: null,
    ctaUrl: null,
    placements: [],
    discountMode: "PERCENTAGE" as CampaignDiscountMode,
    discountPercentage: null,
    startsAt: new Date("2026-01-01"),
    endsAt: new Date("2026-12-31"),
    isEnabled: true,
    isArchived: false,
    showCountdown: false,
    priority: 0,
    createdAt: new Date("2026-01-01T00:00:00Z"),
    updatedAt: new Date("2026-01-01T00:00:00Z"),
    products: [],
    categories: [],
    brands: [],
    productPrices: [],
    ...overrides,
  };
}

const product: PriceableProduct = { id: "p1", categoryId: "cat1", brandId: "brand1", price: 100 };

describe("resolveEffectivePrice", () => {
  it("returns null when no campaign targets the product", () => {
    expect(resolveEffectivePrice(product, [makeCampaign({ products: [{ productId: "other" }] })] as never)).toBeNull();
  });

  it("applies a direct product-targeted percentage campaign", () => {
    const campaigns = [makeCampaign({ discountPercentage: 20, products: [{ productId: "p1" }] })];
    const result = resolveEffectivePrice(product, campaigns as never);
    expect(result).toEqual({ basePrice: 100, finalPrice: 80, discountPercent: 20, savedAmount: 20, campaignId: "camp-1", campaignName: "حملة اختبار" });
  });

  it("applies a category-targeted campaign, including via an additional (secondary) category", () => {
    const campaigns = [makeCampaign({ discountPercentage: 10, categories: [{ categoryId: "cat9" }] })];
    const productWithSecondary: PriceableProduct = { ...product, additionalCategoryIds: ["cat9"] };
    const result = resolveEffectivePrice(productWithSecondary, campaigns as never);
    expect(result?.finalPrice).toBe(90);
  });

  it("applies a brand-targeted campaign", () => {
    const campaigns = [makeCampaign({ discountPercentage: 15, brands: [{ brandId: "brand1" }] })];
    const result = resolveEffectivePrice(product, campaigns as never);
    expect(result?.finalPrice).toBe(85);
  });

  it("FINAL_PRICE mode only applies with an explicit per-product snapshot row — a category/brand match alone is not enough", () => {
    const campaigns = [
      makeCampaign({
        discountMode: "FINAL_PRICE",
        categories: [{ categoryId: "cat1" }],
        productPrices: [], // no snapshot for p1
      }),
    ];
    expect(resolveEffectivePrice(product, campaigns as never)).toBeNull();
  });

  it("FINAL_PRICE mode applies when the product has a snapshot row", () => {
    const campaigns = [
      makeCampaign({
        discountMode: "FINAL_PRICE",
        products: [{ productId: "p1" }],
        productPrices: [{ productId: "p1", finalPrice: 60 }],
      }),
    ];
    const result = resolveEffectivePrice(product, campaigns as never);
    expect(result?.finalPrice).toBe(60);
    expect(result?.discountPercent).toBe(40);
  });

  it("never applies a campaign that would raise the price", () => {
    const campaigns = [
      makeCampaign({ discountMode: "FINAL_PRICE", products: [{ productId: "p1" }], productPrices: [{ productId: "p1", finalPrice: 150 }] }),
    ];
    expect(resolveEffectivePrice(product, campaigns as never)).toBeNull();
  });

  it("does not stack two matching campaigns — picks the single lowest final price", () => {
    const campaigns = [
      makeCampaign({ id: "camp-a", discountPercentage: 10, products: [{ productId: "p1" }] }),
      makeCampaign({ id: "camp-b", discountPercentage: 30, products: [{ productId: "p1" }] }),
    ];
    const result = resolveEffectivePrice(product, campaigns as never);
    expect(result?.campaignId).toBe("camp-b");
    expect(result?.finalPrice).toBe(70);
  });

  it("breaks a tie on identical final price using higher priority first", () => {
    const campaigns = [
      makeCampaign({ id: "camp-low-priority", discountPercentage: 20, priority: 0, products: [{ productId: "p1" }] }),
      makeCampaign({ id: "camp-high-priority", discountPercentage: 20, priority: 5, products: [{ productId: "p1" }] }),
    ];
    const result = resolveEffectivePrice(product, campaigns as never);
    expect(result?.campaignId).toBe("camp-high-priority");
  });

  it("breaks a tie on identical final price and priority using earlier createdAt", () => {
    const campaigns = [
      makeCampaign({ id: "camp-newer", discountPercentage: 20, createdAt: new Date("2026-03-01") }),
      makeCampaign({ id: "camp-older", discountPercentage: 20, createdAt: new Date("2026-01-01") }),
    ].map((c) => ({ ...c, products: [{ productId: "p1" }] }));
    const result = resolveEffectivePrice(product, campaigns as never);
    expect(result?.campaignId).toBe("camp-older");
  });
});
