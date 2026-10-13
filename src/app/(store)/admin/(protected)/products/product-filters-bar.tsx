"use client";

import { useRouter, useSearchParams } from "next/navigation";

export function ProductFiltersBar({
  categories,
  brands,
}: {
  categories: { id: string; nameAr: string }[];
  brands: { id: string; nameAr: string }[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    // Any filter/sort change starts back at page 1 — a stale page number from a wider
    // result set could otherwise land past the end of a narrower filtered one.
    params.delete("page");
    router.push(`/admin/products?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-end gap-2">
      <label className="flex flex-col gap-1 text-xs text-text-secondary">
        القسم
        <select
          defaultValue={searchParams.get("category") ?? ""}
          onChange={(e) => setParam("category", e.target.value)}
          className="input h-10 w-40"
        >
          <option value="">كل الأقسام</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.nameAr}</option>)}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-xs text-text-secondary">
        الشركة
        <select
          defaultValue={searchParams.get("brand") ?? ""}
          onChange={(e) => setParam("brand", e.target.value)}
          className="input h-10 w-40"
        >
          <option value="">كل الشركات</option>
          {brands.map((b) => <option key={b.id} value={b.id}>{b.nameAr}</option>)}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-xs text-text-secondary">
        الحالة
        <select
          defaultValue={searchParams.get("status") ?? ""}
          onChange={(e) => setParam("status", e.target.value)}
          className="input h-10 w-32"
        >
          <option value="">الكل</option>
          <option value="visible">منشور</option>
          <option value="hidden">مخفي</option>
        </select>
      </label>
      <label className="flex flex-col gap-1 text-xs text-text-secondary">
        الترتيب
        <select
          defaultValue={searchParams.get("sort") ?? "newest"}
          onChange={(e) => setParam("sort", e.target.value)}
          className="input h-10 w-32"
        >
          <option value="newest">الأحدث</option>
          <option value="oldest">الأقدم</option>
        </select>
      </label>
    </div>
  );
}
