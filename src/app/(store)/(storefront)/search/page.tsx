import type { Metadata } from "next";
import { CatalogGrid, parseListingParams } from "@/components/storefront/catalog-grid";
import type { SortOption } from "@/lib/catalog";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}): Promise<Metadata> {
  const sp = await searchParams;
  return { title: sp.q ? `نتائج البحث عن «${sp.q}»` : "البحث" };
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const q = sp.q ?? "";
  const { pageSize, cols } = parseListingParams(sp);
  return (
    <div>
      <CatalogGrid
        basePath="/search"
        title={`نتائج البحث عن «${q}»`}
        cols={cols}
        filters={{ query: q, sort: (sp.sort as SortOption) ?? "recommended", page: sp.page ? Number(sp.page) : 1, pageSize }}
      />
    </div>
  );
}
