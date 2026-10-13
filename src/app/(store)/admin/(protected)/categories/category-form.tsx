"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { upsertCategoryAction } from "./actions";

interface ProductRow {
  id: string;
  nameAr: string;
  sku: string;
  isVisible: boolean;
  categoryId: string;
  brand: { nameAr: string };
}

export function CategoryForm({
  category,
  products,
  secondaryIds,
}: {
  category?: { id: string; nameAr: string; slug: string; description: string | null; imageUrl: string | null; isFeatured?: boolean };
  products: ProductRow[];
  secondaryIds: Set<string>;
}) {
  // Filtering happens entirely client-side against the already-loaded product list — a full
  // page reload here (as an earlier version did via a server-side search) would wipe out
  // whatever the admin had already typed into the name/slug/description fields above.
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => p.nameAr.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q));
  }, [products, query]);

  return (
    <form action={upsertCategoryAction} className="flex max-w-3xl flex-col gap-3 rounded-card border border-border bg-white p-5">
      {category && <input type="hidden" name="id" value={category.id} />}

      <label className="flex flex-col gap-1 text-sm text-text-secondary">
        اسم القسم
        <input name="nameAr" defaultValue={category?.nameAr} required className="input" />
      </label>
      <label className="flex flex-col gap-1 text-sm text-text-secondary">
        الرابط (slug)
        <input name="slug" defaultValue={category?.slug} required dir="ltr" className="input" />
      </label>
      <label className="flex flex-col gap-1 text-sm text-text-secondary">
        الوصف
        <input name="description" defaultValue={category?.description ?? ""} className="input" />
      </label>
      <label className="flex flex-col gap-1 text-sm text-text-secondary">
        صورة القسم
        {category?.imageUrl && (
          <Image
            src={category.imageUrl}
            alt={category.nameAr}
            width={96}
            height={96}
            className="mb-1 h-24 w-24 rounded-control border border-border-light object-cover"
          />
        )}
        <input name="image" type="file" accept="image/png,image/jpeg,image/webp,image/avif" className="input" />
        <span className="text-xs text-text-faint">تظهر كأيقونة بجانب اسم القسم في قائمة الأقسام بالصفحة الرئيسية، وكبانر صغير تحت السلايدر إذا لم توجد بانرات.</span>
      </label>
      <label className="flex items-center gap-2 text-sm text-text-secondary">
        <input type="checkbox" name="isFeatured" defaultChecked={category?.isFeatured ?? false} />
        عرض منتجات هذا القسم كشريط متحرك في الصفحة الرئيسية
      </label>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-text-primary">المنتجات التابعة لهذا القسم</span>
          <span className="text-xs text-text-faint">المنتجات المحدّدة يدوياً كقسم أساسي مقفلة هنا — عدّلها من صفحة المنتج نفسه</span>
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
              const isPrimary = category ? p.categoryId === category.id : false;
              const isSecondary = secondaryIds.has(p.id);
              return (
                <label
                  key={p.id}
                  className={`flex items-center gap-3 border-b border-border-light p-3 text-sm last:border-b-0 ${isPrimary ? "bg-bg-subtle" : ""}`}
                >
                  <input
                    type="checkbox"
                    name="productIds"
                    value={p.id}
                    defaultChecked={isPrimary || isSecondary}
                    disabled={isPrimary}
                  />
                  <span className="flex-1">{p.nameAr}</span>
                  <span className="font-mono text-xs text-text-faint" dir="ltr">{p.sku}</span>
                  <span className="text-xs text-text-muted">{p.brand.nameAr}</span>
                  {!p.isVisible && <span className="rounded-pill bg-bg-panel px-2 py-0.5 text-[10px] text-text-faint">مخفي</span>}
                  {isPrimary && <span className="rounded-pill bg-brand-action-tint px-2 py-0.5 text-[10px] font-semibold text-brand-deep">قسم أساسي</span>}
                </label>
              );
            })
          )}
        </div>
      </div>

      <button type="submit" className="h-10 w-fit rounded-control bg-brand-action px-5 text-sm font-semibold text-white">حفظ</button>
    </form>
  );
}
