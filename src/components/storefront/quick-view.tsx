"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { calculateDiscountPercent } from "@/lib/pricing";
import { useCart } from "./cart-context";
import { useStorefrontUi } from "./storefront-ui";
import { QuantityInput } from "./quantity-input";
import { ProductPrice, StockStatus } from "./product-card";

export function QuickView() {
  const { quickView: product, closeQuickView, setCartOpen } = useStorefrontUi();
  const { addToCart } = useCart();
  const [qty, setQty] = useState(1);

  useEffect(() => {
    if (!product) return;
    setQty(1);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeQuickView();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [product, closeQuickView]);

  if (!product) return null;
  const discount = calculateDiscountPercent(product.price, product.oldPrice);
  const outOfStock = product.quantity <= 0;

  return (
    <div className="fixed inset-0 z-[160] grid place-items-center overflow-y-auto p-[15px] text-ay-text">
      <div className="fixed inset-0 animate-ay-fade bg-black/70" onClick={closeQuickView} />
      <div role="dialog" aria-modal="true" aria-label={product.nameAr} className="relative grid w-full max-w-[920px] animate-ay-zoom bg-white md:grid-cols-2">
        <button
          type="button"
          onClick={closeQuickView}
          aria-label="إغلاق"
          className="absolute end-0 top-0 z-10 grid size-[50px] place-items-center text-ay-title transition-colors hover:text-ay-primary"
        >
          <X className="size-6" />
        </button>
        <div className="relative aspect-square bg-white">
          {product.imageUrl ? (
            <Image src={product.imageUrl} alt={product.nameAr} fill sizes="(max-width: 768px) 90vw, 460px" className="object-contain p-4" />
          ) : (
            <div className="grid h-full place-items-center text-[13px] text-ay-muted">بانتظار الصورة</div>
          )}
          {discount && (
            <span className="absolute start-[15px] top-[15px] bg-black px-2.5 py-[5px] text-[12px] font-semibold text-white" dir="ltr">
              -{discount}%
            </span>
          )}
        </div>
        <div className="flex max-h-[600px] flex-col gap-[15px] overflow-y-auto p-[30px] text-start">
          {(product.brandName || product.categoryName) && (
            <span className="text-[13px] text-ay-muted">
              {product.brandName} {product.brandName && product.categoryName && "·"} {product.categoryName}
            </span>
          )}
          <h2 className="pe-8 text-[24px] leading-[1.3] font-medium text-ay-title">{product.nameAr}</h2>
          <ProductPrice price={product.price} oldPrice={product.oldPrice} className="justify-start text-[22px]" />
          {product.shortSpec && <p className="text-[14px] leading-[1.7]">{product.shortSpec}</p>}
          <StockStatus outOfStock={outOfStock} />
          {!outOfStock && (
            <div className="flex flex-wrap items-center gap-[10px]">
              <QuantityInput value={qty} max={product.quantity} onChange={setQty} />
              <button
                type="button"
                onClick={() => {
                  addToCart(product.id, qty, product.quantity);
                  closeQuickView();
                  setCartOpen(true);
                }}
                className="ay-btn-primary"
              >
                أضف إلى السلة
              </button>
            </div>
          )}
          <Link
            href={`/product/${product.slug}`}
            onClick={closeQuickView}
            className="mt-auto self-start border-b-2 border-ay-primary pb-0.5 text-[13px] font-semibold text-ay-title hover:text-ay-primary"
          >
            عرض التفاصيل الكاملة
          </Link>
        </div>
      </div>
    </div>
  );
}
