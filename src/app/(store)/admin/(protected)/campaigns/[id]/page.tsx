import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/guard";
import { resolveCampaignTargetProductIds } from "@/lib/campaign-pricing";
import { CampaignForm } from "../campaign-form";

/** Formats a Date as the value a `<input type="datetime-local">` expects, in server-local
 * time (matches the "بتوقيت السيرفر" label shown next to the fields). */
function toDatetimeLocal(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default async function EditCampaignPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;

  const [campaign, products, categories, brands] = await Promise.all([
    prisma.campaign.findUnique({
      where: { id },
      include: { products: true, categories: true, brands: true, productPrices: true },
    }),
    prisma.product.findMany({ where: { isArchived: false }, select: { id: true, nameAr: true }, orderBy: { nameAr: "asc" } }),
    prisma.category.findMany({ where: { isArchived: false }, select: { id: true, nameAr: true }, orderBy: { nameAr: "asc" } }),
    prisma.brand.findMany({ where: { isArchived: false }, select: { id: true, nameAr: true }, orderBy: { nameAr: "asc" } }),
  ]);
  if (!campaign) notFound();

  const targeting = {
    productIds: campaign.products.map((p) => p.productId),
    categoryIds: campaign.categories.map((c) => c.categoryId),
    brandIds: campaign.brands.map((b) => b.brandId),
  };
  const targetProductIds = await resolveCampaignTargetProductIds(targeting);
  const targetProducts =
    targetProductIds.length > 0
      ? await prisma.product.findMany({
          where: { id: { in: targetProductIds } },
          select: { id: true, nameAr: true, sku: true, price: true, images: { take: 1, orderBy: { sortOrder: "asc" }, select: { url: true } } },
          orderBy: { nameAr: "asc" },
        })
      : [];

  return (
    <div className="flex max-w-3xl flex-col gap-4">
      <h1 className="text-xl font-bold text-text-primary">تعديل حملة: {campaign.nameAr}</h1>
      <CampaignForm
        products={products}
        categories={categories}
        brands={brands}
        initial={{
          id: campaign.id,
          nameAr: campaign.nameAr,
          description: campaign.description ?? "",
          promoTextAr: campaign.promoTextAr ?? "",
          badgeText: campaign.badgeText ?? "",
          ctaLabel: campaign.ctaLabel ?? "",
          ctaUrl: campaign.ctaUrl ?? "",
          placements: campaign.placements,
          discountMode: campaign.discountMode,
          discountPercentage: campaign.discountPercentage != null ? Number(campaign.discountPercentage) : null,
          startsAtLocal: toDatetimeLocal(campaign.startsAt),
          endsAtLocal: toDatetimeLocal(campaign.endsAt),
          priority: campaign.priority,
          showCountdown: campaign.showCountdown,
          isEnabled: campaign.isEnabled,
          productIds: targeting.productIds,
          categoryIds: targeting.categoryIds,
          brandIds: targeting.brandIds,
          bannerImageUrl: campaign.bannerImageUrl,
          targetProducts: targetProducts.map((p) => ({
            id: p.id,
            nameAr: p.nameAr,
            sku: p.sku,
            price: Number(p.price),
            imageUrl: p.images[0]?.url ?? null,
          })),
          existingFinalPrices: Object.fromEntries(campaign.productPrices.map((p) => [p.productId, Number(p.finalPrice)])),
        }}
      />
    </div>
  );
}
