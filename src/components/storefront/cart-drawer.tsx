"use client";

import Image from "next/image";
import Link from "next/link";
import { ShoppingCart, X } from "lucide-react";
import { formatCurrency } from "@/lib/pricing";
import { useCart } from "./cart-context";
import { useStorefrontUi } from "./storefront-ui";
import { SidePanel } from "./side-panel";
import { QuantityInput } from "./quantity-input";

export function CartDrawer() {
  const { lines, setQuantity, removeFromCart } = useCart();
  const { cartOpen, setCartOpen, cartProducts, cartProductsLoading, cartSubtotal } = useStorefrontUi();
  const close = () => setCartOpen(false);

  const cartLines = lines
    .map((l) => ({ line: l, product: cartProducts.find((p) => p.id === l.productId) }))
    .filter((x): x is { line: (typeof lines)[number]; product: NonNullable<(typeof x)["product"]> } => Boolean(x.product));

  return (
    <SidePanel open={cartOpen} onClose={close} side="end" width={340} label="سلة المشتريات">
      <div className="flex items-center justify-between border-b border-ay-line p-[15px]">
        <span className="text-[16px] font-semibold text-ay-heading">سلة المشتريات</span>
        <button type="button" onClick={close} className="flex items-center gap-1 text-[13px] font-semibold text-ay-title hover:text-ay-primary">
          <X className="size-4" /> إغلاق
        </button>
      </div>

      {lines.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
          <ShoppingCart className="size-20 text-black/10" strokeWidth={1.2} />
          <p className="text-[15px] font-semibold text-ay-title">لا توجد منتجات في السلة.</p>
          <Link href="/shop" onClick={close} className="ay-btn-primary">
            العودة إلى المتجر
          </Link>
        </div>
      ) : cartProductsLoading && cartLines.length === 0 ? (
        <p className="flex-1 py-10 text-center text-[14px]">جارِ التحميل…</p>
      ) : (
        <>
          <ul className="flex-1 overflow-y-auto">
            {cartLines.map(({ line, product }) => (
              <li key={product.id} className="relative flex gap-[15px] border-b border-ay-line p-[15px] transition-colors hover:bg-ay-page">
                <Link href={`/product/${product.slug}`} onClick={close} className="relative size-[65px] flex-none bg-white">
                  {product.imageUrl && <Image src={product.imageUrl} alt="" fill sizes="65px" className="object-contain" />}
                </Link>
                <div className="min-w-0 flex-1 pe-6">
                  <Link href={`/product/${product.slug}`} onClick={close} className="line-clamp-2 text-[14px] font-medium text-ay-title hover:text-ay-primary">
                    {product.nameAr}
                  </Link>
                  <div className="mt-2 flex items-center gap-2">
                    <QuantityInput size="sm" value={line.quantity} max={product.quantity} onChange={(v) => setQuantity(product.id, v, product.quantity)} />
                    <span className="text-[13px]">×</span>
                    <span className="text-[14px] font-semibold text-ay-primary">{formatCurrency(product.price)}</span>
                  </div>
                </div>
                <button
                  type="button"
                  aria-label={`إزالة ${product.nameAr}`}
                  onClick={() => removeFromCart(product.id)}
                  className="absolute end-[15px] top-[15px] grid size-5 place-items-center text-ay-title hover:text-ay-out"
                >
                  <X className="size-4" />
                </button>
              </li>
            ))}
          </ul>
          <div className="border-t border-ay-line p-[15px]">
            <p className="mb-[15px] flex items-center justify-between text-[16px] font-semibold text-ay-title">
              <span>المجموع الفرعي:</span>
              <span className="text-ay-primary">{formatCurrency(cartSubtotal)}</span>
            </p>
            <div className="grid gap-[10px]">
              <Link href="/cart" onClick={close} className="ay-btn-light w-full">
                عرض السلة
              </Link>
              <Link href="/checkout/review" onClick={close} className="ay-btn-primary w-full">
                إتمام الطلب
              </Link>
            </div>
          </div>
        </>
      )}
    </SidePanel>
  );
}
