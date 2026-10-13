import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { CatalogGrid, parseListingParams } from "@/components/storefront/catalog-grid";
import type { SortOption } from "@/lib/catalog";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const brand = await prisma.brand.findUnique({ where: { slug } });
  return { title: brand?.nameAr ?? "شركة" };
}

export default async function BrandPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const brand = await prisma.brand.findUnique({ where: { slug, isVisible: true, isArchived: false } });
  if (!brand) notFound();

  const { pageSize, cols } = parseListingParams(sp);

  return (
    <div>
      <CatalogGrid
        basePath={`/brands/${slug}`}
        title={brand.nameAr}
        description={brand.description}
        cols={cols}
        filters={{ brandSlug: slug, sort: (sp.sort as SortOption) ?? "recommended", page: sp.page ? Number(sp.page) : 1, pageSize }}
      />
    </div>
  );
}
