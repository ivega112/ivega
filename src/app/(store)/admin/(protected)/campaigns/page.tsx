import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/guard";
import { getCampaignStatus, resolveCampaignTargetProductIds } from "@/lib/campaign-pricing";
import { ConfirmSubmitButton } from "../confirm-submit-button";
import { toggleCampaignAction, archiveCampaignAction, duplicateCampaignAction, deleteCampaignAction } from "./actions";

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "مسودة",
  SCHEDULED: "مجدولة",
  ACTIVE: "نشطة الآن",
  EXPIRED: "منتهية",
};

const STATUS_STYLES: Record<string, string> = {
  DRAFT: "bg-bg-panel text-text-faint",
  SCHEDULED: "bg-badge-offer-bg text-badge-offer-fg",
  ACTIVE: "bg-success-bg text-stock-in-text",
  EXPIRED: "bg-bg-panel text-text-faintest",
};

const PLACEMENT_LABELS: Record<string, string> = {
  HOMEPAGE_HERO: "الواجهة الرئيسية",
  HOMEPAGE_SECTION: "قسم بالصفحة الرئيسية",
  SHOP: "صفحة المتجر",
  CATEGORY_PAGE: "صفحة القسم",
  BRAND_PAGE: "صفحة الشركة",
  PRODUCT_PAGE: "صفحة المنتج",
  BANNER: "بانر ترويجي",
};

export default async function AdminCampaignsPage() {
  await requireAdmin();
  const campaigns = await prisma.campaign.findMany({
    where: { isArchived: false },
    orderBy: { createdAt: "desc" },
    include: { products: true, categories: true, brands: true },
  });

  const withTargetCounts = await Promise.all(
    campaigns.map(async (c) => ({
      campaign: c,
      targetCount: (
        await resolveCampaignTargetProductIds({
          productIds: c.products.map((p) => p.productId),
          categoryIds: c.categories.map((cc) => cc.categoryId),
          brandIds: c.brands.map((b) => b.brandId),
        })
      ).length,
    }))
  );

  return (
    <div className="flex max-w-4xl flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-text-primary">الحملات الموسمية</h1>
        <Link href="/admin/campaigns/new" className="h-10 rounded-control bg-brand-action px-4 text-sm font-semibold leading-10 text-white">
          + حملة جديدة
        </Link>
      </div>

      {campaigns.length === 0 ? (
        <div className="rounded-card border border-border bg-bg-panel p-6 text-center text-sm text-text-muted">لا توجد حملات بعد</div>
      ) : (
        <div className="flex flex-col gap-2">
          {withTargetCounts.map(({ campaign: c, targetCount }) => {
            const status = getCampaignStatus(c);
            return (
              <div key={c.id} className="rounded-card border border-border bg-white p-4">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold text-text-primary">{c.nameAr}</span>
                  {c.badgeText && <span className="rounded-pill bg-badge-offer-bg px-2 py-0.5 text-[10px] font-bold text-badge-offer-fg">{c.badgeText}</span>}
                  <span className={`rounded-pill px-2 py-0.5 text-[10px] font-semibold ${STATUS_STYLES[status]}`}>{STATUS_LABELS[status]}</span>
                  {c.showCountdown && <span className="rounded-pill border border-border px-2 py-0.5 text-[10px] text-text-muted">عداد تنازلي</span>}
                </div>
                <p className="text-xs text-text-muted">
                  {c.discountMode === "PERCENTAGE" ? `خصم ${Number(c.discountPercentage ?? 0)}%` : "أسعار نهائية لكل منتج"}
                  {" · "}{targetCount} منتج متأثر{" · "}
                  {c.placements.map((p) => PLACEMENT_LABELS[p]).join("، ")}
                </p>
                <p className="text-xs text-text-faint">
                  {c.startsAt.toLocaleString("ar-JO")} — {c.endsAt.toLocaleString("ar-JO")}
                </p>
                <div className="mt-2 flex flex-wrap gap-3">
                  <Link href={`/admin/campaigns/${c.id}`} className="text-xs font-semibold text-brand-action">تعديل</Link>
                  <form action={toggleCampaignAction.bind(null, c.id)}>
                    <button type="submit" className="text-xs font-semibold text-brand-action">{c.isEnabled ? "تعطيل" : "تفعيل"}</button>
                  </form>
                  <form action={duplicateCampaignAction.bind(null, c.id)}>
                    <button type="submit" className="text-xs text-text-muted">نسخ</button>
                  </form>
                  <form action={archiveCampaignAction.bind(null, c.id)}>
                    <button type="submit" className="text-xs text-text-muted">أرشفة</button>
                  </form>
                  <form action={deleteCampaignAction.bind(null, c.id)}>
                    <ConfirmSubmitButton message={`حذف حملة "${c.nameAr}" نهائياً؟`} className="text-xs text-discount-ribbon">
                      حذف نهائي
                    </ConfirmSubmitButton>
                  </form>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
