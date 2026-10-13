import Link from "next/link";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/pricing";
import { requireAdmin } from "@/lib/auth/guard";
import { ProductRowActions } from "./product-row-actions";
import { ProductFiltersBar } from "./product-filters-bar";
import { AdminPagination } from "../admin-pagination";

const PAGE_SIZE = 20;

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string; category?: string; brand?: string; status?: string; sort?: string }>;
}) {
  await requireAdmin();
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? 1) || 1);
  const hasFilters = Boolean(sp.q || sp.category || sp.brand || sp.status);

  const where: Prisma.ProductWhereInput = { isArchived: false };
  if (sp.q) where.OR = [{ nameAr: { contains: sp.q, mode: "insensitive" } }, { sku: { contains: sp.q, mode: "insensitive" } }];
  if (sp.category) where.categoryId = sp.category;
  if (sp.brand) where.brandId = sp.brand;
  if (sp.status === "visible") where.isVisible = true;
  if (sp.status === "hidden") where.isVisible = false;

  const orderBy: Prisma.ProductOrderByWithRelationInput[] =
    sp.sort === "oldest" ? [{ createdAt: "asc" }, { id: "asc" }] : [{ createdAt: "desc" }, { id: "asc" }];

  const [products, total, totalUnfiltered, categories, brands] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { category: true, brand: true, images: { take: 1 } },
    }),
    prisma.product.count({ where }),
    prisma.product.count(),
    prisma.category.findMany({ orderBy: { displayOrder: "asc" }, select: { id: true, nameAr: true } }),
    prisma.brand.findMany({ orderBy: { displayOrder: "asc" }, select: { id: true, nameAr: true } }),
  ]);

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const buildHref = (p: number) => {
    const params = new URLSearchParams();
    if (sp.q) params.set("q", sp.q);
    if (sp.category) params.set("category", sp.category);
    if (sp.brand) params.set("brand", sp.brand);
    if (sp.status) params.set("status", sp.status);
    if (sp.sort) params.set("sort", sp.sort);
    params.set("page", String(p));
    return `/admin/products?${params.toString()}`;
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-text-primary">المنتجات</h1>
        <Link href="/admin/products/new" className="h-10 rounded-control bg-brand-action px-4 text-sm font-semibold leading-10 text-white">
          + منتج جديد
        </Link>
      </div>

      <form className="flex gap-2">
        {sp.category && <input type="hidden" name="category" value={sp.category} />}
        {sp.brand && <input type="hidden" name="brand" value={sp.brand} />}
        {sp.status && <input type="hidden" name="status" value={sp.status} />}
        {sp.sort && <input type="hidden" name="sort" value={sp.sort} />}
        <label className="sr-only" htmlFor="admin-product-search">بحث بالاسم أو SKU</label>
        <input id="admin-product-search" name="q" defaultValue={sp.q} placeholder="بحث بالاسم أو SKU" className="input h-10 flex-1" />
        <button type="submit" className="h-10 rounded-control bg-brand-deep px-4 text-sm font-semibold text-white">بحث</button>
      </form>

      <ProductFiltersBar categories={categories} brands={brands} />

      {totalUnfiltered === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-card border border-border bg-white py-16 text-center">
          <span className="text-sm font-semibold text-text-primary">لا توجد منتجات بعد</span>
          <span className="max-w-[320px] text-xs text-text-faint">ابدأ بإضافة أول منتج للمتجر</span>
          <Link href="/admin/products/new" className="mt-2 h-10 rounded-control bg-brand-action px-4 text-sm font-semibold leading-10 text-white">
            + منتج جديد
          </Link>
        </div>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-card border border-border bg-white py-16 text-center">
          <span className="text-sm font-semibold text-text-primary">لا توجد نتائج مطابقة</span>
          <span className="max-w-[320px] text-xs text-text-faint">جرّب تعديل البحث أو الفلاتر</span>
          {hasFilters && (
            <Link href="/admin/products" className="mt-1 text-xs font-semibold text-brand-action">
              مسح الفلاتر
            </Link>
          )}
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-card border border-border bg-white">
            <table className="w-full text-sm">
              <thead className="bg-bg-panel text-xs text-text-muted">
                <tr>
                  <th className="p-3 text-start">المنتج</th>
                  <th className="p-3 text-start">SKU</th>
                  <th className="p-3 text-start">السعر</th>
                  <th className="p-3 text-start">الكمية</th>
                  <th className="p-3 text-start">الحالة</th>
                  <th className="p-3 text-start"></th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id} className="border-t border-border-light">
                    <td className="p-3">
                      <Link href={`/admin/products/${p.id}`} className="font-medium text-text-primary hover:text-brand-action">{p.nameAr}</Link>
                      {p.needsImage && <span className="ms-2 rounded bg-badge-low-bg px-1.5 py-0.5 text-[10px] text-white">بحاجة لصورة</span>}
                    </td>
                    <td className="p-3 font-mono text-xs">{p.sku}</td>
                    <td className="p-3 font-mono">{formatCurrency(Number(p.price))}</td>
                    <td className={`p-3 font-mono ${p.quantity === 0 ? "text-discount-ribbon" : p.quantity <= p.lowStockThreshold ? "text-badge-low-bg" : ""}`}>{p.quantity}</td>
                    <td className="p-3">{p.isVisible ? "منشور" : "مخفي"}</td>
                    <td className="p-3"><ProductRowActions productId={p.id} isVisible={p.isVisible} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col items-center gap-2">
            <span className="text-xs text-text-faint">
              {total} منتج{hasFilters ? " (مُصفّاة)" : ""} — صفحة {page} من {pageCount}
            </span>
            <AdminPagination page={page} pageCount={pageCount} buildHref={buildHref} />
          </div>
        </>
      )}
    </div>
  );
}
