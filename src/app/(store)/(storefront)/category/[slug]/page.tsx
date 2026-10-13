import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { CatalogGrid, parseListingParams } from "@/components/storefront/catalog-grid";
import type { SortOption } from "@/lib/catalog";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const category = await prisma.category.findUnique({ where: { slug } });
  return { title: category?.nameAr ?? "قسم" };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const category = await prisma.category.findUnique({ where: { slug, isVisible: true, isArchived: false } });
  if (!category) notFound();

  const { pageSize, cols } = parseListingParams(sp);

  return (
    <div>
      <CatalogGrid
        basePath={`/category/${slug}`}
        title={category.nameAr}
        description={category.description}
        cols={cols}
        showNewFirst
        filters={{
          categorySlug: slug,
          brandSlug: sp.brand,
          prioritizeNew: true,
          sort: (sp.sort as SortOption) ?? "recommended",
          page: sp.page ? Number(sp.page) : 1,
          pageSize,
        }}
      />
    </div>
  );
}
