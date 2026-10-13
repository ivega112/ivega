import Link from "next/link";
import Image from "next/image";
import { ChevronLeft } from "lucide-react";
import { getProducts, type CatalogFilters } from "@/lib/catalog";
import { mapProductToCard } from "@/lib/map-product-card";
import { getEffectivePricesForProducts } from "@/lib/campaign-pricing";
import { prisma } from "@/lib/prisma";
import { ProductCard } from "./product-card";
import { CatalogFiltersBar } from "./catalog-filters-bar";
import { CatalogToolbar, MobileFiltersButton } from "./catalog-toolbar";
import { DEFAULT_PER_PAGE } from "@/lib/listing";
import { BackButton } from "./back-button";

export { parseListingParams } from "@/lib/listing";

export async function CatalogGrid({
  filters,
  basePath,
  title,
  description,
  cols = 3,
  showNewFirst = false,
}: {
  filters: CatalogFilters;
  basePath: string;
  title: string;
  description?: string | null;
  cols?: number;
  showNewFirst?: boolean;
}) {
  const listingFilters = showNewFirst ? { ...filters, isNew: undefined, excludeNew: true, prioritizeNew: false } : filters;
  const categoryBrandWhere = filters.categorySlug
    ? {
        products: {
          some: {
            OR: [
              { category: { slug: filters.categorySlug } },
              { additionalCategories: { some: { category: { slug: filters.categorySlug } } } },
            ],
          },
        },
      }
    : {};
  const [{ items, total, page, pageCount, pageSize }, categories, brands, newResult] = await Promise.all([
    getProducts(listingFilters),
    prisma.category.findMany({ where: { isVisible: true, isArchived: false }, orderBy: { displayOrder: "asc" } }),
    prisma.brand.findMany({ where: { isVisible: true, isArchived: false, ...categoryBrandWhere }, orderBy: { displayOrder: "asc" } }),
    showNewFirst
      ? getProducts({ ...filters, isNew: true, excludeNew: false, prioritizeNew: false, page: 1, pageSize: 12 })
      : Promise.resolve(null),
  ]);
  const newItems = newResult?.items ?? [];
  const effectivePrices = await getEffectivePricesForProducts(
    [...newItems, ...items].map((p) => ({
      id: p.id,
      categoryId: p.categoryId,
      brandId: p.brandId,
      price: Number(p.price),
      additionalCategoryIds: p.additionalCategories.map((c) => c.categoryId),
    }))
  );

  const sidebar = (
    <CatalogFiltersBar
      basePath={basePath}
      categories={categories.map((c) => ({ slug: c.slug, nameAr: c.nameAr }))}
      brands={brands.map((b) => ({ slug: b.slug, nameAr: b.nameAr, logoUrl: b.logoUrl ?? `/images/brands/${b.slug}.png` }))}
      total={total}
    />
  );

  const colsClass = cols === 2 ? "" : cols === 4 ? "lg:grid-cols-3 xl:grid-cols-4" : "lg:grid-cols-3";
  const isCategoryPage = Boolean(filters.categorySlug);
  const productGrid = (products: typeof items, priorityOffset = 0) => (
    <div className={`grid grid-cols-2 gap-x-[10px] gap-y-[25px] lg:gap-x-5 ${colsClass}`}>
      {products.map((p, i) => <ProductCard key={p.id} product={mapProductToCard(p, effectivePrices.get(p.id))} priority={i + priorityOffset < 3} />)}
    </div>
  );

  return (
    <div className={`ay-container grid gap-[30px] pt-[30px] pb-[60px] ${isCategoryPage ? "grid-cols-1" : "lg:grid-cols-[276px_1fr]"}`}>
      {!isCategoryPage && <aside className="hidden lg:block">{sidebar}</aside>}

      <div className="min-w-0">
        <div className="mb-[20px] flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
          {isCategoryPage ? <BackButton /> : <nav aria-label="مسار التنقل" className="flex flex-wrap items-center gap-1.5 text-[14px]">
            <Link href="/" className="hover:text-ay-primary">
              الرئيسية
            </Link>
            <span className="text-[#bbb]">/</span>
            {basePath !== "/shop" || filters.query || filters.badge ? (
              <>
                <Link href="/shop" className="hover:text-ay-primary">
                  المتجر
                </Link>
                <span className="text-[#bbb]">/</span>
              </>
            ) : null}
            <h1 className="text-[14px] font-semibold text-ay-title">{title}</h1>
          </nav>}
          <CatalogToolbar perPage={pageSize} cols={cols} sort={filters.sort ?? "recommended"} />
        </div>
        {description && <p className="-mt-2 mb-[20px] text-[14px]">{description}</p>}

        {filters.categorySlug && brands.length > 0 && (
          <section aria-label={`شركات ${title}`} className="mb-7 border-y border-border-light py-4">
            <h2 className="mb-3 text-base font-semibold text-ay-heading">الشركات</h2>
            <div className="flex gap-3 overflow-x-auto pb-1">
              {brands.map((brand) => {
                const active = filters.brandSlug === brand.slug;
                const logoUrl = brand.logoUrl ?? `/images/brands/${brand.slug}.png`;
                const params = new URLSearchParams();
                if (!active) params.set("brand", brand.slug);
                const href = params.size ? `${basePath}?${params.toString()}` : basePath;
                return (
                  <Link key={brand.id} href={href} aria-pressed={active} className={`flex w-28 flex-none flex-col items-center gap-2 rounded-control border p-1.5 text-center text-xs transition ${active ? "border-ay-primary bg-brand-action-tint text-ay-primary" : "border-border bg-white hover:border-ay-primary"}`}>
                    <span className="relative grid aspect-square w-full place-items-center overflow-hidden rounded-[8px] bg-white">
                      <Image src={logoUrl} alt={brand.nameAr} fill sizes="100px" className="object-contain" />
                    </span>
                    <span className="line-clamp-1 w-full">{brand.nameAr}</span>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {!isCategoryPage && <div className="mb-[20px] flex items-center justify-between gap-3 lg:hidden">
          <MobileFiltersButton>{sidebar}</MobileFiltersButton>
          <span className="text-[13px]">{total} منتج</span>
        </div>}

        {showNewFirst && newItems.length > 0 && (
          <section className="mb-10">
            <div className="mb-5 flex items-center justify-between gap-4">
              <h2 className="ay-section-title">جديدنا</h2>
              <span className="text-xs text-text-faint">{newResult?.total ?? newItems.length} منتج</span>
            </div>
            {productGrid(newItems)}
          </section>
        )}

        {showNewFirst && items.length > 0 && <h2 className="ay-section-title mb-5">باقي المنتجات</h2>}

        {items.length === 0 && newItems.length === 0 ? (
          <div className="flex flex-col items-center gap-3 bg-white px-6 py-16 text-center">
            <span className="text-[22px] font-semibold text-ay-title">لا توجد نتائج مطابقة</span>
            <span className="max-w-[320px] text-[14px]">جرّب تعديل الفلاتر أو البحث عن كلمة مختلفة</span>
            <Link href="/shop" className="ay-btn-primary mt-2">
              العودة إلى المتجر
            </Link>
          </div>
        ) : items.length > 0 ? (
          productGrid(items, newItems.length)
        ) : null}

        {pageCount > 1 && (
          <nav aria-label="الصفحات" className="mt-[40px] flex items-center justify-center gap-[6px]">
            {Array.from({ length: pageCount }, (_, i) => i + 1).map((p) => (
              <Link
                key={p}
                href={buildPageUrl(basePath, filters, p, cols)}
                aria-current={p === page ? "page" : undefined}
                className={`grid h-[34px] min-w-[34px] place-items-center rounded-[3px] px-2 text-[14px] font-semibold transition-colors ${
                  p === page ? "bg-ay-primary text-white" : "text-ay-title hover:bg-black/5"
                }`}
              >
                {p}
              </Link>
            ))}
            {page < pageCount && (
              <Link href={buildPageUrl(basePath, filters, page + 1, cols)} aria-label="الصفحة التالية" className="grid size-[34px] place-items-center text-ay-title hover:text-ay-primary">
                <ChevronLeft className="size-4 ltr:rotate-180" />
              </Link>
            )}
          </nav>
        )}
      </div>
    </div>
  );
}

function buildPageUrl(basePath: string, filters: CatalogFilters, page: number, cols: number): string {
  const params = new URLSearchParams();
  if (filters.query) params.set("q", filters.query);
  if (filters.brandSlug && !basePath.startsWith("/brands/")) params.set("brand", filters.brandSlug);
  if (filters.badge) params.set("badge", filters.badge);
  if (filters.isNew) params.set("new", "1");
  if (filters.discounted) params.set("discounted", "1");
  if (filters.minPrice != null) params.set("min", String(filters.minPrice));
  if (filters.maxPrice != null) params.set("max", String(filters.maxPrice));
  if (filters.sort) params.set("sort", filters.sort);
  if (filters.pageSize && filters.pageSize !== DEFAULT_PER_PAGE) params.set("per", String(filters.pageSize));
  if (cols !== 3) params.set("cols", String(cols));
  params.set("page", String(page));
  return `${basePath}?${params.toString()}`;
}
