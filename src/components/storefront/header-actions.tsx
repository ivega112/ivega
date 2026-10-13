"use client";

import Link from "next/link";
import { Headset, ShoppingCart } from "lucide-react";
import { formatCurrency } from "@/lib/pricing";
import { useCart } from "./cart-context";
import { useStorefrontUi } from "./storefront-ui";

/** Reference-style cart pill: white icon disc, running total, item-count bubble. Opens the side cart. */
export function HeaderActions({ compact = false }: { compact?: boolean }) {
  const { cartCount, hydrated } = useCart();
  const { setCartOpen, cartSubtotal } = useStorefrontUi();

  return (
    <button
      type="button"
      onClick={() => setCartOpen(true)}
      aria-label={`السلة (${cartCount})`}
      className={`relative flex flex-none items-center gap-2 rounded-[35px] bg-ay-primary ps-[2px] pe-[14px] text-white transition-colors hover:bg-ay-primary-dark ${
        compact ? "h-[38px]" : "h-10"
      }`}
    >
      <span className={`grid place-items-center rounded-full bg-white text-ay-title ${compact ? "size-[34px]" : "size-9"}`}>
        <ShoppingCart className="size-[19px]" strokeWidth={1.8} />
      </span>
      <span className="text-[14px] font-semibold whitespace-nowrap tabular-nums">{formatCurrency(hydrated ? cartSubtotal : 0)}</span>
      <span className="absolute -end-1 -top-1.5 grid h-[15px] min-w-[15px] place-items-center rounded-full bg-white px-[3px] text-[9px] leading-none font-semibold text-ay-primary">
        {cartCount}
      </span>
    </button>
  );
}

export function SupportLink() {
  return (
    <Link href="/support" className="flex items-center gap-1.5 text-[13px] font-semibold whitespace-nowrap text-ay-title hover:text-ay-primary">
      <Headset className="size-[18px]" strokeWidth={1.7} />
      الدعم / تواصل معنا
    </Link>
  );
}
