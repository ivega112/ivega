"use client";

import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

/** Reference-style shop sidebar: category list, brand filter and the offers toggle. */
export function CatalogFiltersBar({
  basePath,
  categories,
  brands,
  total,
}: {
  basePath: string;
  categories: { slug: string; nameAr: string }[];
  brands: { slug: string; nameAr: string; logoUrl?: string | null }[];
  total: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  // "/brands/[slug]" filters by its route segment, not a "brand" query param (the query
  // param only drives filtering on /shop and /category/[slug]) — so brand switching there
  // has to be a real route navigation, not setParam, or clicking another brand would
  // silently no-op (the page would keep showing the original route's brand regardless of
  // the query string).
  const brandRouteMatch = basePath.match(/^\/brands\/([^/]+)$/);
  const categoryRouteMatch = basePath.match(/^\/category\/([^/]+)$/);
  const activeBrand = brandRouteMatch ? brandRouteMatch[1] : searchParams.get("brand");
  const activeCategory = categoryRouteMatch?.[1] ? decodeURIComponent(categoryRouteMatch[1]) : null;
  const activeBadge = searchParams.get("badge");

  function hrefWith(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    params.delete("page");
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  }

  function setParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    params.delete("page");
    router.push(`${basePath}?${params.toString()}`);
  }

  function selectBrand(slug: string) {
    if (brandRouteMatch) {
      router.push(`/brands/${slug}`);
    } else {
      setParam("brand", activeBrand === slug ? null : slug);
    }
  }

  const widgetTitle = "mb-[18px] text-[16px] font-semibold text-ay-heading";
  const box = (checked: boolean) =>
    `grid size-4 flex-none place-items-center border text-[11px] text-white ${checked ? "border-ay-primary bg-ay-primary" : "border-black/20 bg-white"}`;

  return (
    <div className="space-y-[35px] text-ay-text">
      <p className="text-[13px]">{total} منتج</p>

      <section>
        <h2 className={widgetTitle}>تصفية حسب الأقسام</h2>
        <ul>
          {categories.map((c) => {
            const active = activeCategory === c.slug;
            return (
              <li key={c.slug}>
                <Link
                  href={`/category/${c.slug}`}
                  aria-current={active ? "page" : undefined}
                  className={`flex items-center gap-3 py-[9px] text-[14px] transition-colors hover:text-ay-primary ${active ? "font-semibold text-ay-primary" : "text-ay-title"}`}
                >
                  <span className="flex-1">{c.nameAr}</span>
                  <ChevronLeft className="size-3.5 opacity-40 ltr:rotate-180" />
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      {basePath === "/shop" && (
        <section>
          <h2 className={widgetTitle}>العروض</h2>
          {/* A real link so the toggle works even before the page has hydrated. */}
          <Link
            href={hrefWith("badge", activeBadge === "OFFER" ? null : "OFFER")}
            role="button"
            aria-pressed={activeBadge === "OFFER"}
            className="flex items-center gap-2.5 text-[14px] text-ay-title hover:text-ay-primary"
          >
            <span className={box(activeBadge === "OFFER")}>{activeBadge === "OFFER" && "✓"}</span>
            العروض
          </Link>
        </section>
      )}

      {brands.length > 0 && (
        <section>
          <div className="mb-[18px] flex items-center justify-between">
            <h2 className="text-[16px] font-semibold text-ay-heading">الشركات</h2>
            {activeBrand &&
              (brandRouteMatch ? (
                <Link href="/brands" className="text-[13px] font-semibold text-ay-primary">
                  مسح التصفية
                </Link>
              ) : (
                <button type="button" onClick={() => setParam("brand", null)} className="text-[13px] font-semibold text-ay-primary">
                  مسح التصفية
                </button>
              ))}
          </div>
          <div className="space-y-[2px]" role="radiogroup" aria-label="تصفية حسب الشركة">
            {brands.map((b) => {
              const active = activeBrand === b.slug;
              return (
                <button
                  key={b.slug}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  aria-label={b.nameAr}
                  onClick={() => selectBrand(b.slug)}
                  className="flex w-full items-center gap-2.5 py-[6px] text-start text-[14px] text-ay-title hover:text-ay-primary"
                >
                  <span className={box(active)}>{active && "✓"}</span>
                  <span className={active ? "font-semibold text-ay-primary" : ""}>{b.nameAr}</span>
                </button>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
