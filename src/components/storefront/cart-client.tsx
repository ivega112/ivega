"use client";

import Image from "next/image";
import Link from "next/link";
import { ShoppingCart, X } from "lucide-react";
import { useCart } from "./cart-context";
import { useStorefrontUi } from "./storefront-ui";
import { QuantityInput } from "./quantity-input";
import { formatCurrency } from "@/lib/pricing";

export function CartClient() {
  const { lines, setQuantity, removeFromCart, hydrated } = useCart();
  const { cartProducts, cartProductsLoading, cartSubtotal } = useStorefrontUi();

  if (!hydrated || (cartProductsLoading && lines.length > 0 && cartProducts.length === 0)) {
    return <div className="py-10 text-center text-[14px]">جارِ التحميل…</div>;
  }

  if (lines.length === 0) {
    return (
      <div className="flex flex-col items-center gap-5 py-[60px] text-center">
        <ShoppingCart className="size-[110px] text-black/10" strokeWidth={1} />
        <p className="text-[24px] font-semibold text-ay-title">السلة فارغة</p>
        <Link href="/shop" className="ay-btn-primary">
          تسوّق الآن
        </Link>
      </div>
    );
  }

  const cartLines = lines
    .map((l) => {
      const product = cartProducts.find((p) => p.id === l.productId);
      return product ? { ...l, product } : null;
    })
    .filter((l): l is NonNullable<typeof l> => Boolean(l));

  return (
    <div className="grid grid-cols-1 gap-[30px] lg:grid-cols-[1fr_380px]">
      <div className="bg-white">
        <div className="hidden grid-cols-[40px_100px_1fr_120px_130px_120px] items-center border-b border-ay-line px-4 py-4 text-[13px] font-semibold text-ay-title md:grid">
          <span />
          <span className="col-span-2">المنتج</span>
          <span>السعر</span>
          <span>الكمية</span>
          <span>المجموع الفرعي</span>
        </div>
        {cartLines.map((line) => (
          <div
            key={line.productId}
            className="relative grid grid-cols-[80px_1fr] items-center gap-x-4 gap-y-2 border-b border-ay-line p-4 md:grid-cols-[40px_100px_1fr_120px_130px_120px] md:gap-y-0"
          >
            <button
              type="button"
              onClick={() => removeFromCart(line.productId)}
              aria-label="إزالة"
              className="absolute end-3 top-3 grid size-6 place-items-center text-ay-title hover:text-ay-out md:static"
            >
              <X className="size-4" />
            </button>
            <Link href={`/product/${line.product.slug}`} className="relative row-span-4 block size-[80px] bg-ay-page md:row-span-1">
              {line.product.imageUrl && <Image src={line.product.imageUrl} alt={line.product.nameAr} fill sizes="80px" className="object-contain p-1" />}
            </Link>
            <Link href={`/product/${line.product.slug}`} className="pe-8 text-[14px] font-medium text-ay-title hover:text-ay-primary md:pe-4">
              {line.product.nameAr}
            </Link>
            <span className="text-[14px] text-ay-primary">{formatCurrency(line.product.price)}</span>
            <span>
              <QuantityInput value={line.quantity} onChange={(v) => setQuantity(line.productId, v)} />
            </span>
            <span className="text-[14px] font-semibold text-ay-primary">{formatCurrency(line.product.price * line.quantity)}</span>
          </div>
        ))}
        <div className="p-4">
          <Link href="/shop" className="ay-btn-light">
            متابعة التسوق
          </Link>
        </div>
      </div>

      <div className="h-fit bg-white p-[30px]">
        <h2 className="mb-5 text-[20px] font-semibold text-ay-heading">إجمالي السلة</h2>
        <div className="flex items-center justify-between border-b border-ay-line py-3 text-[14px]">
          <span className="font-semibold text-ay-title">الإجمالي الفرعي</span>
          <span className="font-semibold text-ay-primary">{formatCurrency(cartSubtotal)}</span>
        </div>
        <p className="py-3 text-[13px]">رسوم التوصيل تُحسب في صفحة المراجعة</p>
        <Link href="/checkout/review" className="ay-btn-primary h-[48px] w-full text-[14px]">
          إتمام الطلب
        </Link>
      </div>
    </div>
  );
}
