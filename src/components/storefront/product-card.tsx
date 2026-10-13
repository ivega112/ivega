"use client";

import Image from "next/image";
import Link from "next/link";
import { Check, Search } from "lucide-react";
import { useCart } from "./cart-context";
import { useStorefrontUi } from "./storefront-ui";
import { calculateDiscountPercent, formatCurrency } from "@/lib/pricing";

export interface ProductCardData {
  id: string;
  slug: string;
  nameAr: string;
  shortSpec: string | null;
  price: number;
  oldPrice: number | null;
  quantity: number;
  badge: string;
  imageUrl: string | null;
  brandName?: string;
  categoryName?: string;
}

const BADGE_LABEL: Record<string, string> = {
  NEW: "جديد",
  HOT: "الأكثر مبيعاً",
  PICK: "مميّز",
  LOW: "كمية محدودة",
};

export function ProductPrice({ price, oldPrice, className = "" }: { price: number; oldPrice: number | null; className?: string }) {
  const onSale = oldPrice != null && oldPrice > price;
  return (
    <span className={`inline-flex flex-wrap items-baseline justify-center gap-x-1.5 text-ay-primary ${className}`}>
      {onSale && (
        <del className="text-[0.93em] font-normal text-[#bbb]" aria-label="السعر الأصلي">
          {formatCurrency(oldPrice)}
        </del>
      )}
      <ins className="font-semibold no-underline tabular-nums" aria-label="السعر الحالي">
        {formatCurrency(price)}
      </ins>
    </span>
  );
}

export function StockStatus({ outOfStock, className = "" }: { outOfStock: boolean; className?: string }) {
  return outOfStock ? (
    <p className={`text-[14px] font-semibold text-ay-out ${className}`}>غير متوفر</p>
  ) : (
    <p className={`inline-flex items-center gap-1 text-[14px] font-semibold text-ay-stock ${className}`}>
      <Check className="size-4" strokeWidth={2.4} />
      متوفر
    </p>
  );
}

export function ProductCard({ product, priority = false }: { product: ProductCardData; variant?: "grid" | "compact"; priority?: boolean }) {
  const { addToCart } = useCart();
  const { openQuickView, setCartOpen } = useStorefrontUi();
  const discount = calculateDiscountPercent(product.price, product.oldPrice);
  const outOfStock = product.quantity <= 0;
  const href = `/product/${product.slug}`;
  const label = BADGE_LABEL[product.badge];

  return (
    <div className="group relative flex h-full flex-col text-center">
      <div className="relative aspect-square overflow-hidden bg-white">
        <Link href={href} className="absolute inset-0 block" aria-label={product.nameAr} tabIndex={-1}>
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.nameAr}
              fill
              priority={priority}
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 283px"
              className="object-contain p-2 transition-transform duration-[2s] ease-[cubic-bezier(0,0,0.44,1.18)] group-hover:scale-[1.06]"
            />
          ) : (
            <span className="grid h-full place-items-center bg-[repeating-linear-gradient(135deg,#f6f6f6_0_8px,#fff_8px_16px)] text-[12px] text-ay-muted">
              بانتظار الصورة
            </span>
          )}
        </Link>

        {(discount || label) && (
          <div className="pointer-events-none absolute start-[15px] top-[15px] z-[2] flex flex-col items-start gap-1.5">
            {discount && (
              <span className="bg-black px-2.5 py-[5px] text-[12px] leading-[1.2] font-semibold text-white" dir="ltr">
                -{discount}%
              </span>
            )}
            {label && <span className="bg-ay-primary px-2.5 py-[5px] text-[12px] leading-[1.2] font-semibold text-white">{label}</span>}
          </div>
        )}

        {/* Hover action column (reference: fades/slides in on card hover). */}
        <div className="pointer-events-none absolute end-[10px] top-[10px] z-[3] hidden w-[50px] -translate-x-5 flex-col bg-white opacity-0 shadow-[1px_1px_1px_rgba(0,0,0,0.1)] transition-all duration-300 group-hover:pointer-events-auto group-hover:translate-x-0 group-hover:opacity-100 ltr:translate-x-5 ltr:group-hover:translate-x-0 [@media(hover:hover)]:flex">
          <button
            type="button"
            onClick={() => openQuickView(product)}
            aria-label="عرض سريع"
            className="group/btn relative grid h-[45px] w-full place-items-center text-ay-title transition-colors hover:text-ay-primary"
          >
            <Search className="size-[18px]" />
            <span className="pointer-events-none absolute end-full top-1/2 me-2 -translate-y-1/2 rounded-sm bg-black px-2 py-1 text-[12px] whitespace-nowrap text-white opacity-0 transition-opacity group-hover/btn:opacity-100">
              عرض سريع
            </span>
          </button>
        </div>
      </div>

      <div className="flex flex-1 flex-col items-center gap-[7px] px-1 pt-[10px] pb-1">
        <h3 className="line-clamp-3 text-[14px] leading-[1.4] font-medium text-ay-title">
          <Link href={href} className="hover:text-ay-primary">
            {product.nameAr}
          </Link>
        </h3>
        <StockStatus outOfStock={outOfStock} />
        <ProductPrice price={product.price} oldPrice={product.oldPrice} className="text-[14px]" />
        <div className="mt-auto pt-[5px]">
          {outOfStock ? (
            <Link href={href} className="ay-btn-pill">
              اقرأ المزيد
            </Link>
          ) : (
            <button
              type="button"
              className="ay-btn-pill"
              onClick={() => {
                addToCart(product.id, 1, product.quantity);
                setCartOpen(true);
              }}
            >
              أضف إلى السلة
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
