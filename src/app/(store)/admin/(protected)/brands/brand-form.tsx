"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { upsertBrandAction } from "./actions";

interface ProductRow {
  id: string;
  nameAr: string;
  sku: string;
  isVisible: boolean;
  brandId: string;
  category: { nameAr: string };
}

export function BrandForm({
  brand,
  products,
}: {
  brand?: { id: string; nameAr: string; slug: string; description: string | null; logoUrl: string | null };
  products: ProductRow[];
}) {
  // Filtering is client-side against the already-loaded product list — a server-side search
  // (full page reload) would wipe out whatever the admin already typed into the name/slug
  // fields above before they got to picking products. See category-form.tsx for the same fix.
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => p.nameAr.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q));
  }, [products, query]);

  return (
    <form action={upsertBrandAction} className="flex max-w-3xl flex-col gap-3 rounded-card border border-border bg-white p-5">
      {brand && <input type="hidden" name="id" value={brand.id} />}

      <label className="flex flex-col gap-1 text-sm text-text-secondary">
        اسم الشركة
        <input name="nameAr" defaultValue={brand?.nameAr} required className="input" />
      </label>
      <label className="flex flex-col gap-1 text-sm text-text-secondary">
        الرابط (slug)
        <input name="slug" defaultValue={brand?.slug} required dir="ltr" className="input" />
      </label>
      <label className="flex flex-col gap-1 text-sm text-text-secondary">
        الوصف
        <input name="description" defaultValue={brand?.description ?? ""} className="input" />
      </label>
      <label className="flex flex-col gap-1 text-sm text-text-secondary">
        شعار الشركة
        {brand?.logoUrl && (
          <Image
            src={brand.logoUrl}
            alt={brand.nameAr}
            width={96}
            height={96}
            className="mb-1 h-24 w-24 rounded-control border border-border-light object-contain p-2"
          />
        )}
        <input name="logo" type="file" accept="image/png,image/jpeg,image/webp,image/avif" className="input" />
      </label>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-text-primary">المنتجات التابعة لهذه الشركة</span>
          <span className="text-xs text-text-faint">كل منتج تابع لشركة واحدة فقط — المنتجات الحالية مقفلة هنا، عدّلها من صفحة المنتج نفسه</span>
        </div>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="بحث بالاسم أو SKU"
          className="input h-10"
        />
        <div className="max-h-72 overflow-y-auto rounded-control border border-border-light">
          {filtered.length === 0 ? (
            <p className="p-4 text-center text-sm text-text-faint">لا توجد منتجات مطابقة</p>
          ) : (
            filtered.map((p) => {
              const isCurrent = brand ? p.brandId === brand.id : false;
              return (
                <label
                  key={p.id}
                  className={`flex items-center gap-3 border-b border-border-light p-3 text-sm last:border-b-0 ${isCurrent ? "bg-bg-subtle" : ""}`}
                >
                  <input type="checkbox" name="productIds" value={p.id} defaultChecked={isCurrent} disabled={isCurrent} />
                  <span className="flex-1">{p.nameAr}</span>
                  <span className="font-mono text-xs text-text-faint" dir="ltr">{p.sku}</span>
                  <span className="text-xs text-text-muted">{p.category.nameAr}</span>
                  {!p.isVisible && <span className="rounded-pill bg-bg-panel px-2 py-0.5 text-[10px] text-text-faint">مخفي</span>}
                  {isCurrent && <span className="rounded-pill bg-brand-action-tint px-2 py-0.5 text-[10px] font-semibold text-brand-deep">تابع حالياً</span>}
                </label>
              );
            })
          )}
        </div>
      </div>

      <button type="submit" className="h-10 w-fit rounded-control bg-brand-action px-5 text-sm font-semibold text-white">
        حفظ
      </button>
    </form>
  );
}
