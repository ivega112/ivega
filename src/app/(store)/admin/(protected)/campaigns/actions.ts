"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/guard";
import { logActivity } from "@/lib/activity-log";
import { getStorageAdapter } from "@/lib/storage";
import { resolveCampaignTargetProductIds } from "@/lib/campaign-pricing";
import { toMoney } from "@/lib/pricing";
import type { CampaignPlacement } from "@prisma/client";

export interface CampaignFormState {
  ok: boolean;
  error?: string;
}

const VALID_PLACEMENTS: CampaignPlacement[] = [
  "HOMEPAGE_HERO",
  "HOMEPAGE_SECTION",
  "SHOP",
  "CATEGORY_PAGE",
  "BRAND_PAGE",
  "PRODUCT_PAGE",
  "BANNER",
];

/** Same-site relative path only — blocks `javascript:`/`data:` and any external host
 * (open-redirect / XSS-via-href guard on an admin-entered field, spec §8.3). */
function assertSafeCtaUrl(url: string): string {
  if (!url.startsWith("/") || url.startsWith("//")) {
    throw new Error("رابط الزر (CTA) يجب أن يكون مساراً داخلياً يبدأ بـ /");
  }
  return url;
}

interface Targeting {
  productIds: string[];
  categoryIds: string[];
  brandIds: string[];
}

function extractTargeting(formData: FormData): Targeting {
  return {
    productIds: formData.getAll("productIds").map(String).filter(Boolean),
    categoryIds: formData.getAll("categoryIds").map(String).filter(Boolean),
    brandIds: formData.getAll("brandIds").map(String).filter(Boolean),
  };
}

async function validateTargeting(targeting: Targeting): Promise<string | null> {
  const [productCount, categoryCount, brandCount] = await Promise.all([
    targeting.productIds.length ? prisma.product.count({ where: { id: { in: targeting.productIds } } }) : 0,
    targeting.categoryIds.length ? prisma.category.count({ where: { id: { in: targeting.categoryIds } } }) : 0,
    targeting.brandIds.length ? prisma.brand.count({ where: { id: { in: targeting.brandIds } } }) : 0,
  ]);
  if (productCount !== targeting.productIds.length) return "أحد المنتجات المحددة غير موجود";
  if (categoryCount !== targeting.categoryIds.length) return "أحد الأقسام المحددة غير موجود";
  if (brandCount !== targeting.brandIds.length) return "إحدى الشركات المحددة غير موجودة";
  return null;
}

/** Reads `finalPrice_<productId>` fields for the given resolved target set. */
function extractFinalPrices(formData: FormData, targetProductIds: string[]): Map<string, number | null> {
  const map = new Map<string, number | null>();
  for (const productId of targetProductIds) {
    const raw = formData.get(`finalPrice_${productId}`);
    if (raw == null || raw === "") {
      map.set(productId, null);
      continue;
    }
    const n = Number(raw);
    map.set(productId, Number.isFinite(n) ? toMoney(n) : null);
  }
  return map;
}

async function validateFinalPrices(
  finalPrices: Map<string, number | null>,
  targetProductIds: string[],
  requireComplete: boolean
): Promise<string | null> {
  if (targetProductIds.length === 0) return requireComplete ? "لا توجد منتجات مستهدفة لتفعيل الحملة" : null;

  const products = await prisma.product.findMany({ where: { id: { in: targetProductIds } }, select: { id: true, price: true, nameAr: true } });
  for (const p of products) {
    const finalPrice = finalPrices.get(p.id);
    if (finalPrice == null) {
      if (requireComplete) return `يجب تحديد سعر نهائي للمنتج "${p.nameAr}" قبل تفعيل الحملة`;
      continue;
    }
    if (finalPrice < 0) return `السعر النهائي لـ "${p.nameAr}" يجب أن يكون صفراً أو أكثر`;
    if (finalPrice >= Number(p.price)) return `السعر النهائي لـ "${p.nameAr}" يجب أن يكون أقل من السعر الأصلي`;
  }
  return null;
}

interface CampaignInput {
  nameAr: string;
  description: string | null;
  promoTextAr: string | null;
  badgeText: string | null;
  ctaLabel: string | null;
  ctaUrl: string | null;
  placements: CampaignPlacement[];
  discountMode: "PERCENTAGE" | "FINAL_PRICE";
  discountPercentage: number | null;
  startsAt: Date;
  endsAt: Date;
  priority: number;
  showCountdown: boolean;
  isEnabled: boolean;
}

function extractCampaignInput(formData: FormData): CampaignInput | { error: string } {
  const nameAr = String(formData.get("nameAr") ?? "").trim();
  if (!nameAr) return { error: "اسم الحملة مطلوب" };

  const startsAtRaw = String(formData.get("startsAt") ?? "");
  const endsAtRaw = String(formData.get("endsAt") ?? "");
  if (!startsAtRaw || !endsAtRaw) return { error: "تاريخ ووقت البدء والانتهاء مطلوبان" };
  const startsAt = new Date(startsAtRaw);
  const endsAt = new Date(endsAtRaw);
  if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime())) return { error: "تواريخ غير صالحة" };
  if (endsAt <= startsAt) return { error: "تاريخ الانتهاء يجب أن يكون بعد تاريخ البدء" };

  const placements = formData.getAll("placements").map(String).filter((p): p is CampaignPlacement => VALID_PLACEMENTS.includes(p as CampaignPlacement));
  if (placements.length === 0) return { error: "اختر مكان ظهور واحداً على الأقل" };

  const discountMode = String(formData.get("discountMode") ?? "PERCENTAGE") === "FINAL_PRICE" ? "FINAL_PRICE" : "PERCENTAGE";

  let discountPercentage: number | null = null;
  if (discountMode === "PERCENTAGE") {
    const raw = Number(formData.get("discountPercentage"));
    if (!Number.isFinite(raw) || raw <= 0 || raw >= 100) return { error: "نسبة الخصم يجب أن تكون بين 0 و100" };
    discountPercentage = raw;
  }

  let ctaUrl: string | null = null;
  const ctaUrlRaw = String(formData.get("ctaUrl") ?? "").trim();
  if (ctaUrlRaw) {
    try {
      ctaUrl = assertSafeCtaUrl(ctaUrlRaw);
    } catch (err) {
      return { error: err instanceof Error ? err.message : "رابط غير صالح" };
    }
  }

  return {
    nameAr,
    description: String(formData.get("description") ?? "").trim() || null,
    promoTextAr: String(formData.get("promoTextAr") ?? "").trim() || null,
    badgeText: String(formData.get("badgeText") ?? "").trim() || null,
    ctaLabel: String(formData.get("ctaLabel") ?? "").trim() || null,
    ctaUrl,
    placements,
    discountMode,
    discountPercentage,
    startsAt,
    endsAt,
    priority: Number(formData.get("priority") ?? 0) || 0,
    showCountdown: formData.get("showCountdown") === "on",
    isEnabled: formData.get("isEnabled") === "on",
  };
}

async function handleBannerUpload(formData: FormData, field: "banner" | "bannerMobile"): Promise<string | undefined> {
  const file = formData.get(field);
  if (!(file instanceof File) || file.size === 0) return undefined;
  const buffer = Buffer.from(await file.arrayBuffer());
  const adapter = getStorageAdapter();
  const result = await adapter.upload(buffer, file.type);
  return result.url;
}

export async function createCampaignAction(_prev: CampaignFormState, formData: FormData): Promise<CampaignFormState> {
  const user = await requirePermission("homepage:write");

  const input = extractCampaignInput(formData);
  if ("error" in input) return { ok: false, error: input.error };

  const targeting = extractTargeting(formData);
  const targetingError = await validateTargeting(targeting);
  if (targetingError) return { ok: false, error: targetingError };

  const targetProductIds = await resolveCampaignTargetProductIds(targeting);
  const finalPrices = input.discountMode === "FINAL_PRICE" ? extractFinalPrices(formData, targetProductIds) : new Map();
  if (input.discountMode === "FINAL_PRICE") {
    const priceError = await validateFinalPrices(finalPrices, targetProductIds, input.isEnabled);
    if (priceError) return { ok: false, error: priceError };
  }

  const [bannerImageUrl, mobileBannerImageUrl] = await Promise.all([
    handleBannerUpload(formData, "banner"),
    handleBannerUpload(formData, "bannerMobile"),
  ]);

  const campaign = await prisma.campaign.create({
    data: {
      ...input,
      bannerImageUrl,
      mobileBannerImageUrl,
      products: { create: targeting.productIds.map((productId) => ({ productId })) },
      categories: { create: targeting.categoryIds.map((categoryId) => ({ categoryId })) },
      brands: { create: targeting.brandIds.map((brandId) => ({ brandId })) },
      productPrices:
        input.discountMode === "FINAL_PRICE"
          ? {
              create: [...finalPrices.entries()]
                .filter((entry): entry is [string, number] => entry[1] != null)
                .map(([productId, finalPrice]) => ({ productId, finalPrice })),
            }
          : undefined,
    },
  });

  await logActivity({ adminUserId: user.id, action: "CAMPAIGN_CREATE", entityType: "Campaign", entityId: campaign.id });
  revalidatePath("/admin/campaigns");
  revalidatePath("/");
  redirect("/admin/campaigns");
}

export async function updateCampaignAction(campaignId: string, _prev: CampaignFormState, formData: FormData): Promise<CampaignFormState> {
  const user = await requirePermission("homepage:write");

  const input = extractCampaignInput(formData);
  if ("error" in input) return { ok: false, error: input.error };

  const targeting = extractTargeting(formData);
  const targetingError = await validateTargeting(targeting);
  if (targetingError) return { ok: false, error: targetingError };

  const targetProductIds = await resolveCampaignTargetProductIds(targeting);
  const finalPrices = input.discountMode === "FINAL_PRICE" ? extractFinalPrices(formData, targetProductIds) : new Map();
  if (input.discountMode === "FINAL_PRICE") {
    const priceError = await validateFinalPrices(finalPrices, targetProductIds, input.isEnabled);
    if (priceError) return { ok: false, error: priceError };
  }

  const [bannerImageUrl, mobileBannerImageUrl] = await Promise.all([
    handleBannerUpload(formData, "banner"),
    handleBannerUpload(formData, "bannerMobile"),
  ]);

  await prisma.$transaction([
    prisma.campaign.update({
      where: { id: campaignId },
      data: {
        ...input,
        ...(bannerImageUrl ? { bannerImageUrl } : {}),
        ...(mobileBannerImageUrl ? { mobileBannerImageUrl } : {}),
      },
    }),
    prisma.campaignProduct.deleteMany({ where: { campaignId } }),
    prisma.campaignCategory.deleteMany({ where: { campaignId } }),
    prisma.campaignBrand.deleteMany({ where: { campaignId } }),
    prisma.campaignProduct.createMany({ data: targeting.productIds.map((productId) => ({ campaignId, productId })) }),
    prisma.campaignCategory.createMany({ data: targeting.categoryIds.map((categoryId) => ({ campaignId, categoryId })) }),
    prisma.campaignBrand.createMany({ data: targeting.brandIds.map((brandId) => ({ campaignId, brandId })) }),
    prisma.campaignProductPrice.deleteMany({ where: { campaignId } }),
    ...(input.discountMode === "FINAL_PRICE"
      ? [
          prisma.campaignProductPrice.createMany({
            data: [...finalPrices.entries()]
              .filter((entry): entry is [string, number] => entry[1] != null)
              .map(([productId, finalPrice]) => ({ campaignId, productId, finalPrice })),
          }),
        ]
      : []),
  ]);

  await logActivity({ adminUserId: user.id, action: "CAMPAIGN_UPDATE", entityType: "Campaign", entityId: campaignId });
  revalidatePath("/admin/campaigns");
  revalidatePath(`/admin/campaigns/${campaignId}`);
  revalidatePath("/");
  redirect("/admin/campaigns");
}

export async function toggleCampaignAction(id: string) {
  const user = await requirePermission("homepage:write");
  const campaign = await prisma.campaign.findUniqueOrThrow({
    where: { id },
    include: { products: true, categories: true, brands: true, productPrices: true },
  });

  const willEnable = !campaign.isEnabled;
  if (willEnable && campaign.discountMode === "FINAL_PRICE") {
    const targetProductIds = await resolveCampaignTargetProductIds({
      productIds: campaign.products.map((p) => p.productId),
      categoryIds: campaign.categories.map((c) => c.categoryId),
      brandIds: campaign.brands.map((b) => b.brandId),
    });
    const finalPrices = new Map(campaign.productPrices.map((p) => [p.productId, Number(p.finalPrice)]));
    const priceError = await validateFinalPrices(finalPrices, targetProductIds, true);
    if (priceError) throw new Error(priceError);
  }

  await prisma.campaign.update({ where: { id }, data: { isEnabled: willEnable } });
  await logActivity({ adminUserId: user.id, action: "CAMPAIGN_TOGGLE", entityType: "Campaign", entityId: id });
  revalidatePath("/admin/campaigns");
  revalidatePath("/");
}

export async function archiveCampaignAction(id: string) {
  const user = await requirePermission("homepage:write");
  await prisma.campaign.update({ where: { id }, data: { isArchived: true, isEnabled: false } });
  await logActivity({ adminUserId: user.id, action: "CAMPAIGN_ARCHIVE", entityType: "Campaign", entityId: id });
  revalidatePath("/admin/campaigns");
  revalidatePath("/");
}

export async function duplicateCampaignAction(id: string) {
  const user = await requirePermission("homepage:write");
  const original = await prisma.campaign.findUniqueOrThrow({
    where: { id },
    include: { products: true, categories: true, brands: true, productPrices: true },
  });

  const copy = await prisma.campaign.create({
    data: {
      nameAr: `${original.nameAr} (نسخة)`,
      description: original.description,
      promoTextAr: original.promoTextAr,
      badgeText: original.badgeText,
      bannerImageUrl: original.bannerImageUrl,
      mobileBannerImageUrl: original.mobileBannerImageUrl,
      ctaLabel: original.ctaLabel,
      ctaUrl: original.ctaUrl,
      placements: original.placements,
      discountMode: original.discountMode,
      discountPercentage: original.discountPercentage,
      startsAt: original.startsAt,
      endsAt: original.endsAt,
      priority: original.priority,
      showCountdown: original.showCountdown,
      isEnabled: false, // duplicates always land as Draft — never silently go live
      products: { create: original.products.map((p) => ({ productId: p.productId })) },
      categories: { create: original.categories.map((c) => ({ categoryId: c.categoryId })) },
      brands: { create: original.brands.map((b) => ({ brandId: b.brandId })) },
      productPrices: { create: original.productPrices.map((p) => ({ productId: p.productId, finalPrice: p.finalPrice })) },
    },
  });

  await logActivity({ adminUserId: user.id, action: "CAMPAIGN_DUPLICATE", entityType: "Campaign", entityId: copy.id });
  revalidatePath("/admin/campaigns");
}

export async function deleteCampaignAction(id: string) {
  const user = await requirePermission("homepage:write");
  // Hard delete is safe: campaigns never overwrite base product prices (resolved live at
  // read time, see src/lib/campaign-pricing.ts) and historical OrderItem rows store their
  // own priceSnapshot independent of any campaign — nothing else references a Campaign row.
  await prisma.campaign.delete({ where: { id } });
  await logActivity({ adminUserId: user.id, action: "CAMPAIGN_DELETE", entityType: "Campaign", entityId: id });
  revalidatePath("/admin/campaigns");
  revalidatePath("/");
}
