import type { Metadata } from "next";
import type { ProductBadge } from "@prisma/client";
import { CatalogGrid, parseListingParams } from "@/components/storefront/catalog-grid";
import type { SortOption } from "@/lib/catalog";

const VALID_BADGES: ProductBadge[] = ["OFFER", "HOT", "NEW", "LOW", "OUT"];

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}): Promise<Metadata> {
  const sp = await searchParams;
  return { title: sp.q ? `نتائج البحث عن «${sp.q}»` : "المتجر" };
}

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const badge = VALID_BADGES.includes(sp.badge as ProductBadge) ? (sp.badge as ProductBadge) : undefined;
  const { pageSize, cols } = parseListingParams(sp);
  const isNew = sp.new === "1";
  const discounted = sp.discounted === "1";
  const title = sp.q ? `نتائج البحث عن «${sp.q}»` : isNew ? "جديدنا" : discounted || badge === "OFFER" ? "العروض الحالية" : "المتجر";
  return (
    <div>
      <CatalogGrid
        basePath="/shop"
        title={title}
        cols={cols}
        filters={{
          brandSlug: sp.brand,
          badge,
          isNew,
          discounted,
          query: sp.q,
          minPrice: sp.min ? Number(sp.min) : undefined,
          maxPrice: sp.max ? Number(sp.max) : undefined,
          sort: (sp.sort as SortOption) ?? "recommended",
          page: sp.page ? Number(sp.page) : 1,
          pageSize,
        }}
      />
    </div>
  );
}
