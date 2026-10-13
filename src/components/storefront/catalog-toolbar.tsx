"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { SidePanel } from "./side-panel";
import { PER_PAGE_OPTIONS } from "@/lib/listing";

const SORT_LABELS: Record<string, string> = {
  recommended: "الترتيب الافتراضي",
  newest: "الأحدث",
  popular: "الأكثر مبيعاً",
  "price-asc": "السعر: من الأقل للأعلى",
  "price-desc": "السعر: من الأعلى للأقل",
};


/** Reference shop toolbar: "show 9/12/18/24", column switcher and sort select. */
export function CatalogToolbar({ perPage, cols, sort }: { perPage: number; cols: number; sort: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const set = (key: string, value: string | null) => {
    const sp = new URLSearchParams(params.toString());
    if (value) sp.set(key, value);
    else sp.delete(key);
    sp.delete("page");
    const s = sp.toString();
    router.push(s ? `${pathname}?${s}` : pathname, { scroll: false });
  };

  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[14px]">
      <div className="hidden items-center gap-1 md:flex">
        <span className="font-semibold text-ay-title">عرض:</span>
        {PER_PAGE_OPTIONS.map((n, i) => (
          <span key={n} className="flex items-center">
            <button
              type="button"
              aria-pressed={n === perPage}
              onClick={() => set("per", String(n))}
              className={`px-1 hover:text-ay-title ${n === perPage ? "font-semibold text-ay-title" : ""}`}
            >
              {n}
            </button>
            {i < PER_PAGE_OPTIONS.length - 1 && <span className="text-[#ccc]">/</span>}
          </span>
        ))}
      </div>
      <div className="hidden items-center gap-2 md:flex" role="group" aria-label="عدد الأعمدة">
        {[2, 3, 4].map((n) => (
          <button
            key={n}
            type="button"
            aria-label={`${n} أعمدة`}
            aria-pressed={n === cols}
            onClick={() => set("cols", n === 3 ? null : String(n))}
            className={`flex h-[18px] gap-[2px] transition-opacity hover:opacity-80 ${n === cols ? "opacity-100" : "opacity-40"}`}
          >
            {Array.from({ length: n }).map((_, i) => (
              <span key={i} className="w-[4px] bg-ay-title" />
            ))}
          </button>
        ))}
      </div>
      <select
        value={sort}
        onChange={(e) => set("sort", e.target.value === "recommended" ? null : e.target.value)}
        aria-label="ترتيب المنتجات"
        className="h-[30px] cursor-pointer border-b-2 border-ay-line bg-transparent pe-6 text-[14px] text-ay-title outline-none transition-colors focus:border-ay-primary"
      >
        {Object.entries(SORT_LABELS).map(([k, label]) => (
          <option key={k} value={k}>
            {label}
          </option>
        ))}
      </select>
    </div>
  );
}

/** Mobile: the sidebar filters open as an off-canvas panel. */
export function MobileFiltersButton({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const params = useSearchParams();
  const routeKey = `${pathname}?${params.toString()}`;

  // Close after a filter link navigates (not on first mount).
  const lastRoute = useRef(routeKey);
  useEffect(() => {
    if (lastRoute.current === routeKey) return;
    lastRoute.current = routeKey;
    setOpen(false);
  }, [routeKey]);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="flex items-center gap-2 text-[14px] font-semibold text-ay-title">
        <SlidersHorizontal className="size-[18px]" />
        إظهار الفلاتر
      </button>
      <SidePanel open={open} onClose={() => setOpen(false)} side="start" width={300} label="الفلاتر">
        <div className="flex items-center justify-between border-b border-ay-line px-[15px] py-3">
          <span className="text-[14px] font-semibold text-ay-title">الفلاتر</span>
          <button type="button" onClick={() => setOpen(false)} aria-label="إغلاق" className="grid size-8 place-items-center text-ay-title">
            <X className="size-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">{open ? children : null}</div>
      </SidePanel>
    </>
  );
}
