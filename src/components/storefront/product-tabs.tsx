"use client";

import { useState } from "react";
import { ProductCard, type ProductCardData } from "./product-card";

/** Section title + inline tabs above a product grid (reference "random products / new / featured…"). */
export function ProductTabs({ title, subtitle, tabs }: { title: string; subtitle?: string | null; tabs: { key: string; label: string; products: ProductCardData[] }[] }) {
  const visible = tabs.filter((t) => t.products.length > 0);
  const [active, setActive] = useState(visible[0]?.key);
  const current = visible.find((t) => t.key === active) ?? visible[0];
  if (!current) return null;

  return (
    <section>
      <div className="mb-[25px] flex flex-col gap-3 border-b-2 border-black/[0.106] pb-3 sm:flex-row sm:items-center sm:gap-[30px]">
        <div>
          <h2 className="ay-section-title">{title}</h2>
          {subtitle && <p className="mt-1 text-[14px]">{subtitle}</p>}
        </div>
        <div className="ay-no-scrollbar flex gap-5 overflow-x-auto" role="tablist">
          {visible.map((t) => (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={t.key === current.key}
              onClick={() => setActive(t.key)}
              className={`text-[14px] font-semibold whitespace-nowrap transition-colors hover:text-ay-primary ${t.key === current.key ? "text-ay-primary" : "text-ay-title"}`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>
      <div key={current.key} role="tabpanel" className="grid animate-ay-rise grid-cols-2 gap-x-[10px] gap-y-[25px] lg:grid-cols-4 lg:gap-x-5">
        {current.products.slice(0, 8).map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}
